import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";

import { resolveDatabaseUrl, type DatabaseUrlOptions } from "./env.js";
import * as schema from "./schema.js";

export type Database = PostgresJsDatabase<typeof schema>;
export type DatabaseSql = Sql;

export interface DatabaseClient {
  readonly db: Database;
  readonly sql: DatabaseSql;
  readonly close: () => Promise<void>;
}

export interface CreateDatabaseClientOptions extends DatabaseUrlOptions {
  readonly maxConnections?: number;
  readonly prepareStatements?: boolean;
  readonly closeTimeoutSeconds?: number;
}

export const createDatabaseClient = (options: CreateDatabaseClientOptions = {}): DatabaseClient => {
  const databaseUrl = resolveDatabaseUrl(options);
  const sql = postgres(databaseUrl, {
    max: options.maxConnections ?? 5,
    prepare: options.prepareStatements ?? false
  });

  return {
    db: drizzle(sql, { schema }),
    sql,
    close: async () => {
      await sql.end({ timeout: options.closeTimeoutSeconds ?? 5 });
    }
  };
};
