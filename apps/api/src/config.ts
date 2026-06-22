import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ConfigValidationError,
  getOptionalEnv,
  parseIntegerEnv,
  parseLogLevel,
  parseNodeEnvironment,
  parseUrlEnv,
  type ConfigIssue,
  type LogLevel,
  type NodeEnvironment
} from "@webhook-monitor/core";

export interface ApiConfig {
  readonly nodeEnv: NodeEnvironment;
  readonly host: string;
  readonly port: number;
  readonly serviceName: string;
  readonly databaseUrl: string;
  readonly redisUrl: string;
  readonly stripeSampleWebhookSecret?: string;
  readonly signatureTimestampToleranceSeconds: number;
  readonly webhookMaxBodyBytes: number;
  readonly webhookRateLimitWindowMs: number;
  readonly webhookRateLimitMaxRequests: number;
  readonly logLevel: LogLevel;
}

export interface LoadLocalApiEnvOptions {
  readonly allowExampleFallback?: boolean;
}

const repoRoot = dirname(fileURLToPath(new URL("../../../", import.meta.url)));

const parseEnvValue = (value: string): string => {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
};

const loadEnvFileIfExists = (path: string, targetEnv: NodeJS.ProcessEnv = process.env): void => {
  if (!existsSync(path)) {
    return;
  }

  const contents = readFileSync(path, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex < 1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = parseEnvValue(trimmed.slice(separatorIndex + 1));

    if (!targetEnv[key]) {
      targetEnv[key] = value;
    }
  }
};

export const loadLocalApiEnv = (options: LoadLocalApiEnvOptions = {}): void => {
  loadEnvFileIfExists(join(repoRoot, ".env"));

  if (options.allowExampleFallback) {
    loadEnvFileIfExists(join(repoRoot, ".env.example"));
  }
};

const configKeys = [
  "NODE_ENV",
  "API_HOST",
  "API_PORT",
  "DATABASE_URL",
  "REDIS_URL",
  "STRIPE_SAMPLE_WEBHOOK_SECRET",
  "WEBHOOK_MAX_BODY_BYTES",
  "WEBHOOK_RATE_LIMIT_WINDOW_MS",
  "WEBHOOK_RATE_LIMIT_MAX_REQUESTS",
  "LOG_LEVEL"
] as const;

const diagnosticsFor = (env: NodeJS.ProcessEnv): Record<string, unknown> =>
  Object.fromEntries(configKeys.map((key) => [key, env[key]]));

const captureIssue = <TValue>(
  issues: ConfigIssue[],
  key: string,
  readValue: () => TValue
): TValue | undefined => {
  try {
    return readValue();
  } catch (error) {
    issues.push({
      key,
      message: error instanceof Error ? error.message : "Invalid configuration value."
    });
    return undefined;
  }
};

export const loadApiConfig = (env: NodeJS.ProcessEnv = process.env): ApiConfig => {
  const issues: ConfigIssue[] = [];
  const nodeEnv = captureIssue(issues, "NODE_ENV", () => parseNodeEnvironment(env.NODE_ENV));
  const port = captureIssue(issues, "API_PORT", () =>
    parseIntegerEnv(env, "API_PORT", 3000, { minimum: 1, maximum: 65_535 })
  );
  const databaseUrl = captureIssue(issues, "DATABASE_URL", () =>
    parseUrlEnv(env, "DATABASE_URL", {
      required: true,
      protocols: ["postgres:", "postgresql:"]
    })
  );
  const redisUrl = captureIssue(issues, "REDIS_URL", () =>
    parseUrlEnv(env, "REDIS_URL", {
      required: true,
      protocols: ["redis:"]
    })
  );
  const webhookMaxBodyBytes = captureIssue(issues, "WEBHOOK_MAX_BODY_BYTES", () =>
    parseIntegerEnv(env, "WEBHOOK_MAX_BODY_BYTES", 1_048_576, {
      minimum: 1,
      maximum: 10_485_760
    })
  );
  const webhookRateLimitWindowMs = captureIssue(issues, "WEBHOOK_RATE_LIMIT_WINDOW_MS", () =>
    parseIntegerEnv(env, "WEBHOOK_RATE_LIMIT_WINDOW_MS", 60_000, {
      minimum: 1
    })
  );
  const webhookRateLimitMaxRequests = captureIssue(issues, "WEBHOOK_RATE_LIMIT_MAX_REQUESTS", () =>
    parseIntegerEnv(env, "WEBHOOK_RATE_LIMIT_MAX_REQUESTS", 120, {
      minimum: 1
    })
  );
  const logLevel = captureIssue(issues, "LOG_LEVEL", () => parseLogLevel(env.LOG_LEVEL, "info"));
  const stripeSampleWebhookSecret = getOptionalEnv(env, "STRIPE_SAMPLE_WEBHOOK_SECRET");

  if (nodeEnv === "production" && !stripeSampleWebhookSecret) {
    issues.push({
      key: "STRIPE_SAMPLE_WEBHOOK_SECRET",
      message: "STRIPE_SAMPLE_WEBHOOK_SECRET is required in production."
    });
  }

  if (issues.length > 0) {
    throw new ConfigValidationError(issues, diagnosticsFor(env));
  }

  return {
    nodeEnv: nodeEnv ?? "development",
    host: getOptionalEnv(env, "API_HOST") ?? "localhost",
    port: port ?? 3000,
    serviceName: "webhook-reliability-api",
    databaseUrl: databaseUrl ?? "",
    redisUrl: redisUrl ?? "",
    stripeSampleWebhookSecret,
    signatureTimestampToleranceSeconds: 300,
    webhookMaxBodyBytes: webhookMaxBodyBytes ?? 1_048_576,
    webhookRateLimitWindowMs: webhookRateLimitWindowMs ?? 60_000,
    webhookRateLimitMaxRequests: webhookRateLimitMaxRequests ?? 120,
    logLevel: logLevel ?? "info"
  };
};
