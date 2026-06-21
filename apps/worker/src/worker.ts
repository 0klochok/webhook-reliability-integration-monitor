import {
  createDeadLetterEventsRepository,
  createDeliveryAttemptsRepository,
  createManualReplaysRepository,
  createWebhookEventRepository,
  type DatabaseClient
} from "@webhook-monitor/db";
import {
  createBullMqDeliveryWorker,
  type BullMqDeliveryWorkerResource,
  type DeliveryJob
} from "@webhook-monitor/queue";

import type { WorkerConfig } from "./config.js";
import { processDeliveryJob } from "./delivery-processor.js";
import { createPayloadDrivenMockDownstreamClient } from "./mock-downstream-client.js";
import { closeWorkerResources } from "./shutdown.js";

export interface DeliveryWorkerRuntime {
  readonly workerResource: BullMqDeliveryWorkerResource;
  close(): Promise<void>;
}

export interface CreateDeliveryWorkerRuntimeInput {
  readonly database: DatabaseClient;
  readonly config: WorkerConfig;
}

const toProcessorJob = (job: DeliveryJob) => ({
  id: job.id,
  data: job.data,
  attemptsMade: job.attemptsMade
});

export const createDeliveryWorkerRuntime = (
  input: CreateDeliveryWorkerRuntimeInput
): DeliveryWorkerRuntime => {
  const dependencies = {
    webhookEvents: createWebhookEventRepository(input.database.db),
    deliveryAttempts: createDeliveryAttemptsRepository(input.database.db),
    deadLetterEvents: createDeadLetterEventsRepository(input.database.db),
    manualReplays: createManualReplaysRepository(input.database.db),
    downstreamClient: createPayloadDrivenMockDownstreamClient(),
    retryPolicy: input.config.retryPolicy,
    targetUrl: input.config.mockDownstreamUrl
  };
  const workerResource = createBullMqDeliveryWorker({
    redisUrl: input.config.redisUrl,
    concurrency: input.config.concurrency,
    retryPolicy: input.config.retryPolicy,
    processor: async (job) => processDeliveryJob(dependencies, toProcessorJob(job))
  });

  workerResource.worker.on("completed", (job) => {
    console.log(`Delivery job ${job.id ?? "<unknown>"} completed.`);
  });

  workerResource.worker.on("failed", (job, error) => {
    console.error(
      `Delivery job ${job?.id ?? "<unknown>"} failed: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  });

  return {
    workerResource,
    close: async () =>
      closeWorkerResources({
        worker: workerResource.worker,
        redisConnection: workerResource.connection,
        ownsRedisConnection: workerResource.ownsConnection,
        closeDatabase: input.database.close
      })
  };
};
