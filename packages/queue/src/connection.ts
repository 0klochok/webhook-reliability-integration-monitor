import { Redis, type RedisOptions } from "ioredis";

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
  return value || options.fallbackUrl || "redis://localhost:6379";
};

export const parseRedisUrlTarget = (
  redisUrl: string
): {
  readonly protocol: string;
  readonly host: string;
} => {
  const url = new URL(redisUrl);

  if (url.protocol !== "redis:") {
    throw new Error("REDIS_URL must use the redis protocol for local Phase 4 queue behavior.");
  }

  return {
    protocol: url.protocol,
    host: normalizeHostname(url.hostname).toLowerCase()
  };
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
