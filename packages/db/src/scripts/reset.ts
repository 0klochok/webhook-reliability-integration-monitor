import { pathToFileURL } from "node:url";

import { createDatabaseClient, type CreateDatabaseClientOptions } from "../client.js";
import { resolveDatabaseUrl } from "../env.js";
import { truncateApplicationTables } from "../maintenance.js";

export const resetDatabase = async (options: CreateDatabaseClientOptions = {}): Promise<void> => {
  const databaseUrl = resolveDatabaseUrl({
    ...options,
    allowExampleFallback: options.allowExampleFallback ?? true
  });
  const client = createDatabaseClient({
    ...options,
    databaseUrl
  });

  try {
    await truncateApplicationTables(client.sql, databaseUrl);
  } finally {
    await client.close();
  }
};

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectRun) {
  resetDatabase()
    .then(() => {
      console.log("Local application database tables reset.");
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
