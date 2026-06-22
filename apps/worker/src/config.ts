import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ConfigValidationError,
  parseIntegerEnv,
  parseLogLevel,
  parseNodeEnvironment,
  parseUrlEnv,
  type ConfigIssue,
  type LogLevel,
  type NodeEnvironment,
  type RetryPolicy
} from "@webhook-monitor/core";
import { createRetryPolicyFromEnv } from "@webhook-monitor/queue";

export type MockDownstreamMode = "payload-driven";

export interface WorkerConfig {
  readonly nodeEnv: NodeEnvironment;
  readonly serviceName: string;
  readonly databaseUrl: string;
  readonly redisUrl: string;
  readonly concurrency: number;
  readonly retryPolicy: RetryPolicy;
  readonly mockDownstreamMode: MockDownstreamMode;
  readonly mockDownstreamUrl: string;
  readonly logLevel: LogLevel;
}

export interface LoadLocalWorkerEnvOptions {
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

const parseMockDownstreamMode = (value: string | undefined): MockDownstreamMode => {
  const mode = value?.trim() || "payload-driven";

  if (mode !== "payload-driven") {
    throw new Error("MOCK_DOWNSTREAM_MODE must be payload-driven.");
  }

  return mode;
};

export const loadLocalWorkerEnv = (options: LoadLocalWorkerEnvOptions = {}): void => {
  loadEnvFileIfExists(join(repoRoot, ".env"));

  if (options.allowExampleFallback) {
    loadEnvFileIfExists(join(repoRoot, ".env.example"));
  }
};

const configKeys = [
  "NODE_ENV",
  "DATABASE_URL",
  "REDIS_URL",
  "WORKER_CONCURRENCY",
  "DELIVERY_MAX_ATTEMPTS",
  "DELIVERY_INITIAL_DELAY_MS",
  "DELIVERY_BACKOFF_MULTIPLIER",
  "DELIVERY_MAX_DELAY_MS",
  "MOCK_DOWNSTREAM_MODE",
  "MOCK_DOWNSTREAM_URL",
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

export const loadWorkerConfig = (env: NodeJS.ProcessEnv = process.env): WorkerConfig => {
  const issues: ConfigIssue[] = [];
  const nodeEnv = captureIssue(issues, "NODE_ENV", () => parseNodeEnvironment(env.NODE_ENV));
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
  const concurrency = captureIssue(issues, "WORKER_CONCURRENCY", () =>
    parseIntegerEnv(env, "WORKER_CONCURRENCY", 2, {
      minimum: 1
    })
  );
  const retryPolicy = captureIssue(issues, "DELIVERY_RETRY_POLICY", () =>
    createRetryPolicyFromEnv(env)
  );
  const mockDownstreamMode = captureIssue(issues, "MOCK_DOWNSTREAM_MODE", () =>
    parseMockDownstreamMode(env.MOCK_DOWNSTREAM_MODE)
  );
  const mockDownstreamUrl = captureIssue(issues, "MOCK_DOWNSTREAM_URL", () =>
    parseUrlEnv(env, "MOCK_DOWNSTREAM_URL", {
      fallback: "http://localhost:3000/mock-downstream/deliver",
      protocols: ["http:", "https:"]
    })
  );
  const logLevel = captureIssue(issues, "LOG_LEVEL", () => parseLogLevel(env.LOG_LEVEL, "info"));

  if (issues.length > 0) {
    throw new ConfigValidationError(issues, diagnosticsFor(env));
  }

  return {
    nodeEnv: nodeEnv ?? "development",
    serviceName: "webhook-reliability-worker",
    databaseUrl: databaseUrl ?? "",
    redisUrl: redisUrl ?? "",
    concurrency: concurrency ?? 2,
    retryPolicy: retryPolicy ?? createRetryPolicyFromEnv({}),
    mockDownstreamMode: mockDownstreamMode ?? "payload-driven",
    mockDownstreamUrl: mockDownstreamUrl ?? "http://localhost:3000/mock-downstream/deliver",
    logLevel: logLevel ?? "info"
  };
};
