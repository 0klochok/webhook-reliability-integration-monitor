import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface ApiConfig {
  readonly host: string;
  readonly port: number;
  readonly serviceName: string;
  readonly stripeSampleWebhookSecret?: string;
  readonly signatureTimestampToleranceSeconds: number;
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

const parsePort = (value: string | undefined): number => {
  if (!value) {
    return 3000;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("API_PORT must be an integer between 1 and 65535.");
  }

  return port;
};

const getOptionalEnv = (env: NodeJS.ProcessEnv, key: string): string | undefined => {
  const value = env[key]?.trim();
  return value ? value : undefined;
};

export const loadLocalApiEnv = (options: LoadLocalApiEnvOptions = {}): void => {
  loadEnvFileIfExists(join(repoRoot, ".env"));

  if (options.allowExampleFallback) {
    loadEnvFileIfExists(join(repoRoot, ".env.example"));
  }
};

export const loadApiConfig = (env: NodeJS.ProcessEnv = process.env): ApiConfig => ({
  host: getOptionalEnv(env, "API_HOST") ?? "localhost",
  port: parsePort(env.API_PORT),
  serviceName: "webhook-reliability-api",
  stripeSampleWebhookSecret: getOptionalEnv(env, "STRIPE_SAMPLE_WEBHOOK_SECRET"),
  signatureTimestampToleranceSeconds: 300
});
