import { createLogger } from "@webhook-monitor/core";
import {
  checkDatabaseConnection,
  createDatabaseClient,
  type DatabaseClient
} from "@webhook-monitor/db";
import { checkRedisConnection } from "@webhook-monitor/queue";

import { loadLocalWorkerEnv, loadWorkerConfig } from "./config.js";
import { registerWorkerShutdown } from "./shutdown.js";
import { createDeliveryWorkerRuntime, type DeliveryWorkerRuntime } from "./worker.js";

loadLocalWorkerEnv({ allowExampleFallback: true });

const startupLogger = createLogger({
  service: "webhook-reliability-worker",
  level: "info"
});

const waitUntilReady = async (runtime: DeliveryWorkerRuntime): Promise<void> => {
  let timeout: NodeJS.Timeout | undefined;

  try {
    await Promise.race([
      runtime.workerResource.worker.waitUntilReady(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Worker readiness check timed out.")), 5_000);
      })
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
};

const closeAfterStartupFailure = async (
  runtime: DeliveryWorkerRuntime | undefined,
  database: DatabaseClient | undefined
): Promise<void> => {
  if (runtime) {
    await runtime.close();
    return;
  }

  await database?.close();
};

const main = async (): Promise<void> => {
  let database: DatabaseClient | undefined;
  let runtime: DeliveryWorkerRuntime | undefined;
  let logger = startupLogger;

  try {
    const config = loadWorkerConfig();
    logger = createLogger({
      service: config.serviceName,
      level: config.logLevel
    });
    database = createDatabaseClient({
      databaseUrl: config.databaseUrl,
      allowExampleFallback: true
    });

    await checkDatabaseConnection(database);

    runtime = createDeliveryWorkerRuntime({
      database,
      config,
      logger
    });

    await checkRedisConnection(runtime.workerResource.connection);
    await waitUntilReady(runtime);

    registerWorkerShutdown({
      worker: runtime.workerResource.worker,
      redisConnection: runtime.workerResource.connection,
      ownsRedisConnection: runtime.workerResource.ownsConnection,
      closeDatabase: database.close,
      logger
    });

    logger.info("Worker started.", {
      concurrency: config.concurrency
    });
  } catch (error) {
    logger.error("Worker startup failed.", {
      errorCode: "worker_startup_failed",
      error: error instanceof Error ? error : undefined
    });

    try {
      await closeAfterStartupFailure(runtime, database);
    } catch (closeError) {
      logger.error("Worker startup cleanup failed.", {
        errorCode: "worker_shutdown_failed",
        error: closeError instanceof Error ? closeError : undefined
      });
    }

    process.exitCode = 1;
  }
};

void main();
