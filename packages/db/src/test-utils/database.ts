import { createDatabaseClient, type DatabaseClient } from "../client.js";
import { resolveDatabaseUrl } from "../env.js";
import { assertLocalDatabaseUrl } from "../local-safety.js";
import { truncateApplicationTables } from "../maintenance.js";

export const createTestDatabaseClient = (): DatabaseClient =>
  createDatabaseClient({
    allowExampleFallback: true,
    maxConnections: 1
  });

export const resetTestDatabase = async (
  client: DatabaseClient,
  databaseUrl = resolveDatabaseUrl({ allowExampleFallback: true })
): Promise<void> => {
  await truncateApplicationTables(client.sql, databaseUrl);
};

export const assertSafeTestDatabaseUrl = (databaseUrl: string): void => {
  assertLocalDatabaseUrl(databaseUrl);
};
