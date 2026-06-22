import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { ConfigValidationError } from "@webhook-monitor/core";
import { config as loadDotenv } from "dotenv";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

export interface DatabaseUrlOptions {
  readonly databaseUrl?: string;
  readonly allowExampleFallback?: boolean;
}

export const validateDatabaseUrl = (databaseUrl: string): string => {
  let parsed: URL;

  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new ConfigValidationError(
      [{ key: "DATABASE_URL", message: "DATABASE_URL must be a valid URL." }],
      { DATABASE_URL: databaseUrl }
    );
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new ConfigValidationError(
      [{ key: "DATABASE_URL", message: "DATABASE_URL must use postgres or postgresql." }],
      { DATABASE_URL: databaseUrl }
    );
  }

  return databaseUrl;
};

export const loadLocalDatabaseEnv = (allowExampleFallback = false): void => {
  const envPath = fileURLToPath(new URL("../../../.env", import.meta.url));
  if (existsSync(envPath)) {
    loadDotenv({ path: envPath });
  }

  if (allowExampleFallback && !process.env.DATABASE_URL) {
    loadDotenv({ path: fileURLToPath(new URL("../../../.env.example", import.meta.url)) });
  }
};

export const resolveDatabaseUrl = (options: DatabaseUrlOptions = {}): string => {
  if (options.databaseUrl !== undefined) {
    const explicitDatabaseUrl = options.databaseUrl.trim();

    if (!explicitDatabaseUrl) {
      throw new ConfigValidationError(
        [{ key: "DATABASE_URL", message: "DATABASE_URL is required." }],
        { DATABASE_URL: options.databaseUrl }
      );
    }

    return validateDatabaseUrl(explicitDatabaseUrl);
  }

  loadLocalDatabaseEnv(options.allowExampleFallback ?? false);

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new ConfigValidationError(
      [
        {
          key: "DATABASE_URL",
          message: `DATABASE_URL is required. Create ${repoRoot}.env from .env.example or pass a databaseUrl.`
        }
      ],
      { DATABASE_URL: databaseUrl }
    );
  }

  return validateDatabaseUrl(databaseUrl);
};
