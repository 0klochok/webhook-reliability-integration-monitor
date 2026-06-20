import type { DatabaseSql } from "./client.js";
import { assertLocalDatabaseUrl } from "./local-safety.js";

export const truncateApplicationTables = async (
  sql: DatabaseSql,
  databaseUrl: string
): Promise<void> => {
  assertLocalDatabaseUrl(databaseUrl);

  await sql`
    truncate table
      manual_replays,
      dead_letter_events,
      delivery_attempts,
      event_status_history,
      webhook_events
    restart identity cascade
  `;
};
