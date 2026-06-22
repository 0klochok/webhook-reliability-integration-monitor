import { Queue } from "bullmq";
import type { Redis } from "ioredis";
import { OperationalError, type RetryPolicy } from "@webhook-monitor/core";

import {
  checkRedisConnection,
  closeRedisConnection,
  createQueueRedisConnection
} from "./connection.js";
import {
  createDeliveryJobData,
  createDeliveryQueueJobId,
  type DeliveryJobData,
  type DeliveryQueuePort,
  type EnqueueDeliveryInput,
  type EnqueueDeliveryResult
} from "./delivery-job.js";
import { deliveryJobName, webhookDeliveryQueueName } from "./names.js";
import { createDeliveryJobOptions, createRetryPolicyFromEnv } from "./retry-options.js";

export interface CreateBullMqDeliveryQueueOptions {
  readonly queueName?: string;
  readonly prefix?: string;
  readonly redisUrl?: string;
  readonly connection?: Redis;
  readonly retryPolicy?: RetryPolicy;
  readonly clock?: () => Date;
}

export class BullMqDeliveryQueue implements DeliveryQueuePort {
  readonly queue: Queue<DeliveryJobData>;

  private readonly connection: Redis;
  private readonly ownsConnection: boolean;
  private readonly retryPolicy: RetryPolicy;
  private readonly clock: () => Date;

  constructor(input: {
    readonly queue: Queue<DeliveryJobData>;
    readonly connection: Redis;
    readonly ownsConnection: boolean;
    readonly retryPolicy: RetryPolicy;
    readonly clock?: () => Date;
  }) {
    this.queue = input.queue;
    this.connection = input.connection;
    this.ownsConnection = input.ownsConnection;
    this.retryPolicy = input.retryPolicy;
    this.clock = input.clock ?? (() => new Date());
  }

  async enqueueDelivery(input: EnqueueDeliveryInput): Promise<EnqueueDeliveryResult> {
    const data = createDeliveryJobData(input, this.clock);
    const jobId = createDeliveryQueueJobId(data);

    let job: Awaited<ReturnType<Queue<DeliveryJobData>["add"]>>;

    try {
      job = await this.queue.add(deliveryJobName, data, {
        ...createDeliveryJobOptions(this.retryPolicy),
        jobId
      });
    } catch (cause) {
      throw new OperationalError({
        code: "queue_enqueue_failed",
        cause
      });
    }

    return {
      queued: true,
      queueJobId: job.id ?? jobId
    };
  }

  async checkReadiness(): Promise<void> {
    await checkRedisConnection(this.connection);
  }

  async close(): Promise<void> {
    try {
      await this.queue.close();

      if (this.ownsConnection) {
        await closeRedisConnection(this.connection);
      }
    } catch (cause) {
      throw new OperationalError({
        code: "queue_shutdown_failed",
        cause
      });
    }
  }
}

export const createBullMqDeliveryQueue = (
  options: CreateBullMqDeliveryQueueOptions = {}
): BullMqDeliveryQueue => {
  const connection =
    options.connection ??
    createQueueRedisConnection({
      redisUrl: options.redisUrl,
      connectionName: "webhook-delivery-queue"
    });
  const retryPolicy = options.retryPolicy ?? createRetryPolicyFromEnv();
  const queue = new Queue<DeliveryJobData>(options.queueName ?? webhookDeliveryQueueName, {
    connection,
    defaultJobOptions: createDeliveryJobOptions(retryPolicy),
    prefix: options.prefix
  });

  return new BullMqDeliveryQueue({
    queue,
    connection,
    ownsConnection: !options.connection,
    retryPolicy,
    clock: options.clock
  });
};

export const createNoopDeliveryQueue = (): DeliveryQueuePort => ({
  enqueueDelivery: async (input) => ({
    queued: true,
    queueJobId: createDeliveryQueueJobId(input)
  })
});
