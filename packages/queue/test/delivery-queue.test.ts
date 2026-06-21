import { afterEach, describe, expect, it } from "vitest";

import {
  createBullMqDeliveryQueue,
  createDeliveryJobId,
  createRetryPolicyFromEnv,
  createTestQueueName,
  obliterateLocalTestQueue,
  resolveRedisUrl,
  type BullMqDeliveryQueue
} from "../src/index.js";

const redisUrl = resolveRedisUrl({ fallbackUrl: "redis://localhost:6379" });
const queues: BullMqDeliveryQueue[] = [];

afterEach(async () => {
  for (const deliveryQueue of queues.splice(0)) {
    await obliterateLocalTestQueue(deliveryQueue.queue, redisUrl);
    await deliveryQueue.close();
  }
});

describe("BullMQ delivery queue", () => {
  it("enqueues a delivery job with a stable id and validates idempotent duplicate enqueue", async () => {
    const eventId = "22222222-2222-4222-8222-222222222222";
    const deliveryQueue = createBullMqDeliveryQueue({
      queueName: createTestQueueName(),
      redisUrl,
      retryPolicy: createRetryPolicyFromEnv({
        DELIVERY_MAX_ATTEMPTS: "3",
        DELIVERY_INITIAL_DELAY_MS: "10",
        DELIVERY_BACKOFF_MULTIPLIER: "2",
        DELIVERY_MAX_DELAY_MS: "50"
      }),
      clock: () => new Date("2026-06-20T12:00:00.000Z")
    });
    queues.push(deliveryQueue);

    const first = await deliveryQueue.enqueueDelivery({
      eventId,
      providerId: "generic-http",
      externalEventId: "generic-event-1"
    });
    const second = await deliveryQueue.enqueueDelivery({
      eventId,
      providerId: "generic-http",
      externalEventId: "generic-event-1"
    });
    const jobId = createDeliveryJobId(eventId);
    const job = await deliveryQueue.queue.getJob(jobId);
    const counts = await deliveryQueue.queue.getJobCounts(
      "waiting",
      "delayed",
      "active",
      "completed",
      "failed",
      "prioritized",
      "paused"
    );

    expect(first.queueJobId).toBe(jobId);
    expect(second.queueJobId).toBe(jobId);
    expect(job?.data).toMatchObject({
      eventId,
      providerId: "generic-http",
      externalEventId: "generic-event-1",
      enqueuedAt: "2026-06-20T12:00:00.000Z"
    });
    expect(Object.values(counts).reduce((total, count) => total + count, 0)).toBe(1);
  });
});
