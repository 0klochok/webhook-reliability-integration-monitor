const allowedLocalHosts = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "postgres",
  "host.docker.internal"
]);

const allowedLocalDatabaseNames = new Set(["webhook_monitor", "webhook_monitor_test"]);

export interface LocalDatabaseTarget {
  readonly host: string;
  readonly databaseName: string;
}

const normalizeHostname = (hostname: string): string => hostname.replace(/^\[(.*)\]$/, "$1");

export const parseDatabaseUrlTarget = (databaseUrl: string): LocalDatabaseTarget => {
  const url = new URL(databaseUrl);

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error("DATABASE_URL must use the postgres or postgresql protocol.");
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ""));

  if (!databaseName) {
    throw new Error("DATABASE_URL must include a database name.");
  }

  return {
    host: normalizeHostname(url.hostname).toLowerCase(),
    databaseName
  };
};

export const assertLocalDatabaseUrl = (databaseUrl: string): LocalDatabaseTarget => {
  const target = parseDatabaseUrlTarget(databaseUrl);

  if (!allowedLocalHosts.has(target.host)) {
    throw new Error(`Refusing destructive database operation for non-local host "${target.host}".`);
  }

  if (!allowedLocalDatabaseNames.has(target.databaseName)) {
    throw new Error(
      `Refusing destructive database operation for unexpected database "${target.databaseName}".`
    );
  }

  return target;
};
