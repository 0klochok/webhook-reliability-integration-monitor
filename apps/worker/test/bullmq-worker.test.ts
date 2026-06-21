import {
  closeRedisConnection,
  createBullMqDeliveryQueue,
  createBullMqDeliveryWorker,
  createRetryPolicyFromEnv,
  createTestQueueName,
  obliterateLocalTestQueue,
  resolveRedisUrl,
  type BullMqDeliveryQueue,
  type BullMqDeliveryWorkerResource,
  type DeliveryJob
} from "@webhook-monitor/queue";
import {
  createDeadLetterEventsRepository,
  createDeliveryAttemptsRepository,
  createWebhookEventRepository,
  type DatabaseClient,
  type WebhookEvent
} from "@webhook-monitor/db";
import {
  createNormalizedEventFixture,
  createTestDatabaseClient,
  resetTestDatabase
} from "@webhook-monitor/db/test-utils";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { processDeliveryJob } from "../src/delivery-processor.js";
import {
  createPayloadDrivenMockDownstreamClient,
  type MockDeliveryBehavior
} from "../src/mock-downstream-client.js";

let client: DatabaseClient;

const redisUrl = resolveRedisUrl({ fallbackUrl: "redis://localhost:6379" });
const queues: BullMqDeliveryQueue[] = [];
const workers: BullMqDeliveryWorkerResource[] = [];

const retryPolicy = createRetryPolicyFromEnv({
  DELIVERY_MAX_ATTEMPTS: "2",
  DELIVERY_INITIAL_DELAY_MS: "10",
  DELIVERY_BACKOFF_MULTIPLIER: "2",
  DELIVERY_MAX_DELAY_MS: "25"
});

const createPersistedQueuedEvent = async (
  behavior: MockDeliveryBehavior,
  externalEventId: string
): Promise<WebhookEvent> => {
  const events = createWebhookEventRepository(client.db);
  const normalizedEvent = createNormalizedEventFixture({
    providerId: "generic-http",
    externalEventId,
    eventType: "order.fulfilled",
    signatureVerificationRequired: false,
    payload: {
      eventId: externalEventId,
      eventType: "order.fulfilled",
      occurredAt: "2026-06-20T12:00:00.000Z",
      source: "worker-bullmq-test",
      idempotencyKey: `${externalEventId}:idempotency`,
      payload: {
        deliveryBehavior: behavior
      }
    }
  });
  const result = await events.createWithInitialStatusHistory({
    normalizedEvent,
    currentStatus: "queued",
    createdAt: new Date("2026-06-20T12:00:00.000Z"),
    updatedAt: new Date("2026-06-20T12:00:00.000Z"),
    initialHistory: {
      reasonCode: "queued_for_bullmq_test",
      createdAt: new Date("2026-06-20T12:00:00.000Z")
    }
  });

  return result.event;
};

const waitForEventStatus = async (
  eventId: string,
  expectedStatus: "delivered" | "dead_lettered"
): Promise<void> => {
  const events = createWebhookEventRepository(client.db);

  for (let attempt = 0; attempt < 120; attempt += 1) {
    const event = await events.getById(eventId);

    if (event?.currentStatus === expectedStatus) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  throw new Error(`Timed out waiting for event ${eventId} to become ${expectedStatus}.`);
};

const createQueueWorkerPair = async () => {
  const queueName = createTestQueueName();
  const deliveryQueue = createBullMqDeliveryQueue({
    queueName,
    redisUrl,
    retryPolicy
  });
  const dependencies = {
    webhookEvents: createWebhookEventRepository(client.db),
    deliveryAttempts: createDeliveryAttemptsRepository(client.db),
    deadLetterEvents: createDeadLetterEventsRepository(client.db),
    downstreamClient: createPayloadDrivenMockDownstreamClient(),
    retryPolicy,
    targetUrl: "http://localhost:3000/mock-downstream/deliver"
  };
  const workerResource = createBullMqDeliveryWorker({
    queueName,
    redisUrl,
    retryPolicy,
    processor: async (job: DeliveryJob) =>
      processDeliveryJob(dependencies, {
        id: job.id,
        data: job.data,
        attemptsMade: job.attemptsMade
      })
  });

  queues.push(deliveryQueue);
  workers.push(workerResource);

  await workerResource.worker.waitUntilReady();

  return {
    deliveryQueue
  };
};

beforeAll(() => {
  client = createTestDatabaseClient();
});

beforeEach(async () => {
  await resetTestDatabase(client);
});

afterEach(async () => {
  for (const workerResource of workers.splice(0)) {
    await workerResource.worker.close();
    if (workerResource.ownsConnection) {
      await closeRedisConnection(workerResource.connection);
    }
  }

  for (const deliveryQueue of queues.splice(0)) {
    await obliterateLocalTestQueue(deliveryQueue.queue, redisUrl);
    await deliveryQueue.close();
  }
});

afterAll(async () => {
  await resetTestDatabase(client);
  await client.close();
});

describe("BullMQ delivery worker integration", () => {
  it("processes an enqueued job to delivery", async () => {
    const event = await createPersistedQueuedEvent("success", "bullmq-success-1");
    const { deliveryQueue } = await createQueueWorkerPair();

    const enqueueResult = await deliveryQueue.enqueueDelivery({
      eventId: event.id,
      providerId: event.providerId,
      externalEventId: event.externalEventId
    });
    const job = await deliveryQueue.queue.getJob(enqueueResult.queueJobId);

    if (!job) {
      throw new Error("Expected BullMQ job to exist after enqueue.");
    }

    await waitForEventStatus(event.id, "delivered");

    const updatedEvent = await createWebhookEventRepository(client.db).getById(event.id);
    const attempts = await createDeliveryAttemptsRepository(client.db).listAttemptsForEvent(
      event.id
    );

    expect(updatedEvent?.currentStatus).toBe("delivered");
    expect(attempts.map((attempt) => attempt.status)).toEqual(["succeeded"]);
  });

  it("records retries and dead-letters after BullMQ attempts are exhausted", async () => {
    const event = await createPersistedQueuedEvent("always-retryable-fail", "bullmq-dead-1");
    const { deliveryQueue } = await createQueueWorkerPair();

    const enqueueResult = await deliveryQueue.enqueueDelivery({
      eventId: event.id,
      providerId: event.providerId,
      externalEventId: event.externalEventId
    });
    const job = await deliveryQueue.queue.getJob(enqueueResult.queueJobId);

    if (!job) {
      throw new Error("Expected BullMQ job to exist after enqueue.");
    }

    await waitForEventStatus(event.id, "dead_lettered");

    const updatedEvent = await createWebhookEventRepository(client.db).getById(event.id);
    const attempts = await createDeliveryAttemptsRepository(client.db).listAttemptsForEvent(
      event.id
    );
    const deadLetter = await createDeadLetterEventsRepository(client.db).getDeadLetterByEventId(
      event.id
    );

    expect(updatedEvent?.currentStatus).toBe("dead_lettered");
    expect(attempts.map((attempt) => attempt.status)).toEqual([
      "failed_retryable",
      "failed_retryable"
    ]);
    expect(deadLetter).toMatchObject({
      reasonCode: "max_attempts_exhausted",
      finalAttemptNumber: 2
    });
  });
});
