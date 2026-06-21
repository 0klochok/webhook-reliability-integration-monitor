import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createRetryPolicyFromEnv, resolveRedisUrl } from "@webhook-monitor/queue";
import type { RetryPolicy } from "@webhook-monitor/core";

export type MockDownstreamMode = "payload-driven";

export interface WorkerConfig {
  readonly redisUrl: string;
  readonly concurrency: number;
  readonly retryPolicy: RetryPolicy;
  readonly mockDownstreamMode: MockDownstreamMode;
  readonly mockDownstreamUrl: string;
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

const parsePositiveInteger = (value: string | undefined, key: string, fallback: number): number => {
  if (!value?.trim()) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${key} must be a positive integer.`);
  }

  return parsed;
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

export const loadWorkerConfig = (env: NodeJS.ProcessEnv = process.env): WorkerConfig => ({
  redisUrl: resolveRedisUrl({ env }),
  concurrency: parsePositiveInteger(env.WORKER_CONCURRENCY, "WORKER_CONCURRENCY", 2),
  retryPolicy: createRetryPolicyFromEnv(env),
  mockDownstreamMode: parseMockDownstreamMode(env.MOCK_DOWNSTREAM_MODE),
  mockDownstreamUrl:
    env.MOCK_DOWNSTREAM_URL?.trim() || "http://localhost:3000/mock-downstream/deliver"
});
