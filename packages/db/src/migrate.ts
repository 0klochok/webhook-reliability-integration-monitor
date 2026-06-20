import { fileURLToPath, pathToFileURL } from "node:url";

import { migrate } from "drizzle-orm/postgres-js/migrator";

import { createDatabaseClient, type CreateDatabaseClientOptions } from "./client.js";

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

export const runMigrations = async (
  options: CreateDatabaseClientOptions = { allowExampleFallback: true }
): Promise<void> => {
  const client = createDatabaseClient(options);

  try {
    await migrate(client.db, { migrationsFolder });
  } finally {
    await client.close();
  }
};

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectRun) {
  runMigrations()
    .then(() => {
      console.log("Database migrations applied.");
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
