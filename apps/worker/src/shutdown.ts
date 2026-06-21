import { closeRedisConnection } from "@webhook-monitor/queue";

export interface ShutdownLogger {
  log(message: string): void;
  error(message: string): void;
}

export interface ClosableWorker {
  close(): Promise<void>;
}

export type ClosableRedisConnection = Parameters<typeof closeRedisConnection>[0];

export interface WorkerShutdownResources {
  readonly worker: ClosableWorker;
  readonly redisConnection?: ClosableRedisConnection;
  readonly ownsRedisConnection?: boolean;
  readonly closeDatabase?: () => Promise<void>;
  readonly logger?: ShutdownLogger;
}

export const closeWorkerResources = async (resources: WorkerShutdownResources): Promise<void> => {
  await resources.worker.close();

  if (resources.redisConnection && resources.ownsRedisConnection) {
    await closeRedisConnection(resources.redisConnection);
  }

  await resources.closeDatabase?.();
};

export const registerWorkerShutdown = (resources: WorkerShutdownResources): (() => void) => {
  const logger = resources.logger ?? console;
  let isShuttingDown = false;

  const shutdown = (signal: NodeJS.Signals): void => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    logger.log(`Received ${signal}; shutting down webhook delivery worker.`);

    closeWorkerResources(resources)
      .then(() => {
        logger.log("Webhook delivery worker shut down cleanly.");
        process.exit(0);
      })
      .catch((error: unknown) => {
        logger.error(error instanceof Error ? error.message : "Worker shutdown failed.");
        process.exit(1);
      });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return () => {
    process.off("SIGINT", shutdown);
    process.off("SIGTERM", shutdown);
  };
};
