import { Redis, type RedisOptions } from "ioredis";
import { ConfigValidationError, OperationalError } from "@webhook-monitor/core";

export interface ResolveRedisUrlOptions {
  readonly redisUrl?: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly fallbackUrl?: string;
}

export interface CreateRedisConnectionOptions extends ResolveRedisUrlOptions {
  readonly connectionName?: string;
  readonly maxRetriesPerRequest?: number | null;
}

const allowedLocalRedisHosts = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "redis",
  "host.docker.internal"
]);

const normalizeHostname = (hostname: string): string => hostname.replace(/^\[(.*)\]$/, "$1");

export const resolveRedisUrl = (options: ResolveRedisUrlOptions = {}): string => {
  const value =
    options.redisUrl?.trim() ?? options.env?.REDIS_URL?.trim() ?? process.env.REDIS_URL?.trim();
  return validateRedisUrl(value || options.fallbackUrl || "redis://localhost:6379");
};

export const parseRedisUrlTarget = (
  redisUrl: string
): {
  readonly protocol: string;
  readonly host: string;
} => {
  let url: URL;

  try {
    url = new URL(redisUrl);
  } catch {
    throw new ConfigValidationError(
      [{ key: "REDIS_URL", message: "REDIS_URL must be a valid URL." }],
      { REDIS_URL: redisUrl }
    );
  }

  if (url.protocol !== "redis:") {
    throw new ConfigValidationError(
      [{ key: "REDIS_URL", message: "REDIS_URL must use the redis protocol." }],
      { REDIS_URL: redisUrl }
    );
  }

  return {
    protocol: url.protocol,
    host: normalizeHostname(url.hostname).toLowerCase()
  };
};

export const validateRedisUrl = (redisUrl: string): string => {
  parseRedisUrlTarget(redisUrl);
  return redisUrl;
};

export const assertLocalRedisUrl = (redisUrl: string): void => {
  const target = parseRedisUrlTarget(redisUrl);

  if (!allowedLocalRedisHosts.has(target.host)) {
    throw new Error(`Refusing destructive Redis operation for non-local host "${target.host}".`);
  }
};

const createConnection = (
  options: CreateRedisConnectionOptions,
  redisOptions: RedisOptions
): Redis =>
  new Redis(resolveRedisUrl(options), {
    ...redisOptions,
    connectionName: options.connectionName
  });

export const createQueueRedisConnection = (options: CreateRedisConnectionOptions = {}): Redis =>
  createConnection(options, {
    maxRetriesPerRequest: options.maxRetriesPerRequest ?? 1
  });

export const createWorkerRedisConnection = (options: CreateRedisConnectionOptions = {}): Redis =>
  createConnection(options, {
    maxRetriesPerRequest: options.maxRetriesPerRequest ?? null
  });

export const closeRedisConnection = async (connection: Redis): Promise<void> => {
  try {
    await connection.quit();
  } catch {
    connection.disconnect();
  }
};

export const checkRedisConnection = async (connection: Redis): Promise<void> => {
  try {
    await connection.ping();
  } catch (cause) {
    throw new OperationalError({
      code: "queue_connection_failed",
      cause
    });
  }
};
