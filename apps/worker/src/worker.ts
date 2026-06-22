import {
  createDeadLetterEventsRepository,
  createDeliveryAttemptsRepository,
  createManualReplaysRepository,
  createWebhookEventRepository,
  type DatabaseClient
} from "@webhook-monitor/db";
import type { Logger } from "@webhook-monitor/core";
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
  readonly logger: Logger;
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
    targetUrl: input.config.mockDownstreamUrl,
    logger: input.logger
  };
  const workerResource = createBullMqDeliveryWorker({
    redisUrl: input.config.redisUrl,
    concurrency: input.config.concurrency,
    retryPolicy: input.config.retryPolicy,
    processor: async (job) => processDeliveryJob(dependencies, toProcessorJob(job))
  });

  workerResource.worker.on("completed", (job) => {
    input.logger.info("BullMQ delivery job completed.", {
      correlationId: job.data.correlationId,
      jobId: job.id,
      eventId: job.data.eventId,
      providerId: job.data.providerId,
      externalEventId: job.data.externalEventId
    });
  });

  workerResource.worker.on("failed", (job, error) => {
    input.logger.warn("BullMQ delivery job failed.", {
      correlationId: job?.data.correlationId,
      jobId: job?.id,
      eventId: job?.data.eventId,
      providerId: job?.data.providerId,
      externalEventId: job?.data.externalEventId,
      errorCode:
        error instanceof Error && "reasonCode" in error && typeof error.reasonCode === "string"
          ? error.reasonCode
          : "downstream_retryable_failure",
      error
    });
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
