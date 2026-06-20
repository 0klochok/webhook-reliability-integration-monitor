import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { config as loadDotenv } from "dotenv";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

export interface DatabaseUrlOptions {
  readonly databaseUrl?: string;
  readonly allowExampleFallback?: boolean;
}

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
  if (options.databaseUrl) {
    return options.databaseUrl;
  }

  loadLocalDatabaseEnv(options.allowExampleFallback ?? false);

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      `DATABASE_URL is required. Create ${repoRoot}.env from .env.example or pass a databaseUrl.`
    );
  }

  return databaseUrl;
};
