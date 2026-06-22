import type { Logger } from "@webhook-monitor/core";
import { closeRedisConnection } from "@webhook-monitor/queue";

export interface ClosableWorker {
  close(): Promise<void>;
}

export type ClosableRedisConnection = Parameters<typeof closeRedisConnection>[0];

export interface WorkerShutdownResources {
  readonly worker: ClosableWorker;
  readonly redisConnection?: ClosableRedisConnection;
  readonly ownsRedisConnection?: boolean;
  readonly closeDatabase?: () => Promise<void>;
  readonly logger?: Logger;
  readonly timeoutMs?: number;
}

export const closeWorkerResources = async (resources: WorkerShutdownResources): Promise<void> => {
  await resources.worker.close();

  if (resources.redisConnection && resources.ownsRedisConnection) {
    await closeRedisConnection(resources.redisConnection);
  }

  await resources.closeDatabase?.();
};

const withTimeout = async <TValue>(
  promise: Promise<TValue>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<TValue> => {
  let timeout: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      })
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
};

export interface WorkerShutdownController {
  shutdown(signal?: NodeJS.Signals | "startup_failure"): Promise<void>;
}

export const createWorkerShutdownController = (
  resources: WorkerShutdownResources
): WorkerShutdownController => {
  let shutdownPromise: Promise<void> | undefined;

  return {
    shutdown: (signal = "startup_failure") => {
      if (shutdownPromise) {
        return shutdownPromise;
      }

      resources.logger?.info("Worker shutdown started.", {
        signal
      });

      shutdownPromise = withTimeout(
        closeWorkerResources(resources),
        resources.timeoutMs ?? 5_000,
        "Worker shutdown timed out."
      )
        .then(() => {
          resources.logger?.info("Worker shutdown completed.", {
            signal
          });
        })
        .catch((error: unknown) => {
          resources.logger?.error("Worker shutdown failed.", {
            signal,
            errorCode: "worker_shutdown_failed",
            error: error instanceof Error ? error : undefined
          });
          throw error;
        });

      return shutdownPromise;
    }
  };
};

export const registerWorkerShutdown = (resources: WorkerShutdownResources): (() => void) => {
  const controller = createWorkerShutdownController(resources);

  const shutdown = (signal: NodeJS.Signals): void => {
    controller
      .shutdown(signal)
      .then(() => {
        process.exit(0);
      })
      .catch(() => {
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
