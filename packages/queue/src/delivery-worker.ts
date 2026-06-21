import { Worker, type Job } from "bullmq";
import type { Redis } from "ioredis";

import { createWorkerRedisConnection } from "./connection.js";
import { parseDeliveryJobData, type DeliveryJobData } from "./delivery-job.js";
import { deliveryJobName, webhookDeliveryQueueName } from "./names.js";
import { createDeliveryBackoffStrategy, createRetryPolicyFromEnv } from "./retry-options.js";
import type { RetryPolicy } from "@webhook-monitor/core";

export type DeliveryJob = Job<DeliveryJobData>;

export type DeliveryJobProcessor = (job: DeliveryJob) => Promise<unknown>;

export interface CreateBullMqDeliveryWorkerOptions {
  readonly queueName?: string;
  readonly prefix?: string;
  readonly redisUrl?: string;
  readonly connection?: Redis;
  readonly concurrency?: number;
  readonly retryPolicy?: RetryPolicy;
  readonly processor: DeliveryJobProcessor;
}

export interface BullMqDeliveryWorkerResource {
  readonly worker: Worker<DeliveryJobData>;
  readonly connection: Redis;
  readonly ownsConnection: boolean;
}

export const createBullMqDeliveryWorker = (
  options: CreateBullMqDeliveryWorkerOptions
): BullMqDeliveryWorkerResource => {
  const connection =
    options.connection ??
    createWorkerRedisConnection({
      redisUrl: options.redisUrl,
      connectionName: "webhook-delivery-worker"
    });
  const retryPolicy = options.retryPolicy ?? createRetryPolicyFromEnv();
  const worker = new Worker<DeliveryJobData>(
    options.queueName ?? webhookDeliveryQueueName,
    async (job) => {
      if (job.name !== deliveryJobName) {
        throw new Error(`Unexpected BullMQ delivery job name "${job.name}".`);
      }

      parseDeliveryJobData(job.data);
      return options.processor(job);
    },
    {
      connection,
      concurrency: options.concurrency ?? 1,
      prefix: options.prefix,
      settings: {
        backoffStrategy: createDeliveryBackoffStrategy(retryPolicy)
      }
    }
  );

  return {
    worker,
    connection,
    ownsConnection: !options.connection
  };
};
