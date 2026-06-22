import {
  createRetryPolicyFromEnv,
  createDeliveryJobData,
  createDeliveryJobId,
  createReplayDeliveryJobId
} from "@webhook-monitor/queue";
import {
  createTestDatabaseClient,
  createNormalizedEventFixture,
  resetTestDatabase
} from "@webhook-monitor/db/test-utils";
import {
  createDeadLetterEventsRepository,
  createDeliveryAttemptsRepository,
  createManualReplaysRepository,
  createWebhookEventRepository,
  type DatabaseClient,
  type WebhookEvent
} from "@webhook-monitor/db";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  processDeliveryJob,
  type DeliveryProcessorDependencies
} from "../src/delivery-processor.js";
import {
  MissingWebhookEventError,
  PermanentMockDeliveryError,
  RetryableMockDeliveryError
} from "../src/errors.js";
import {
  createPayloadDrivenMockDownstreamClient,
  type MockDeliveryBehavior
} from "../src/mock-downstream-client.js";

let client: DatabaseClient;

const baseTime = new Date("2026-06-20T12:00:00.000Z").getTime();

const createClock = () => {
  let offsetMs = 0;

  return () => {
    const now = new Date(baseTime + offsetMs);
    offsetMs += 1;
    return now;
  };
};

const createRetryPolicy = (maxAttempts = 3) =>
  createRetryPolicyFromEnv({
    DELIVERY_MAX_ATTEMPTS: String(maxAttempts),
    DELIVERY_INITIAL_DELAY_MS: "10",
    DELIVERY_BACKOFF_MULTIPLIER: "2",
    DELIVERY_MAX_DELAY_MS: "50"
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
      source: "worker-test",
      idempotencyKey: `${externalEventId}:idempotency`,
      payload: {
        deliveryBehavior: behavior
      },
      metadata: {
        environment: "test"
      }
    }
  });
  const result = await events.createWithInitialStatusHistory({
    normalizedEvent,
    currentStatus: "queued",
    createdAt: new Date(baseTime),
    updatedAt: new Date(baseTime),
    initialHistory: {
      reasonCode: "queued_for_test",
      createdAt: new Date(baseTime)
    }
  });

  return result.event;
};

const createPersistedEventWithStatus = async (
  behavior: MockDeliveryBehavior,
  externalEventId: string,
  currentStatus: WebhookEvent["currentStatus"]
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
      source: "worker-replay-test",
      idempotencyKey: `${externalEventId}:idempotency`,
      payload: {
        deliveryBehavior: behavior
      },
      metadata: {
        environment: "test"
      }
    }
  });
  const result = await events.createWithInitialStatusHistory({
    normalizedEvent,
    currentStatus,
    createdAt: new Date(baseTime),
    updatedAt: new Date(baseTime),
    initialHistory: {
      reasonCode: "replay_fixture",
      createdAt: new Date(baseTime)
    }
  });

  return result.event;
};

const createDependencies = (
  clock = createClock(),
  maxAttempts = 3
): DeliveryProcessorDependencies => ({
  webhookEvents: createWebhookEventRepository(client.db),
  deliveryAttempts: createDeliveryAttemptsRepository(client.db),
  deadLetterEvents: createDeadLetterEventsRepository(client.db),
  manualReplays: createManualReplaysRepository(client.db),
  downstreamClient: createPayloadDrivenMockDownstreamClient(),
  retryPolicy: createRetryPolicy(maxAttempts),
  targetUrl: "http://localhost:3000/mock-downstream/deliver",
  clock
});

const createJob = (event: WebhookEvent, attemptsMade: number) => ({
  id: createDeliveryJobId(event.id),
  data: createDeliveryJobData({
    eventId: event.id,
    providerId: event.providerId,
    externalEventId: event.externalEventId,
    enqueuedAt: "2026-06-20T12:00:00.000Z"
  }),
  attemptsMade
});

const createReplayJob = (
  event: WebhookEvent,
  manualReplayId: string,
  attemptsMade: number,
  initialAttemptNumber: number
) => ({
  id: createReplayDeliveryJobId(manualReplayId),
  data: createDeliveryJobData({
    eventId: event.id,
    providerId: event.providerId,
    externalEventId: event.externalEventId,
    enqueuedAt: "2026-06-20T12:00:00.000Z",
    replayOfEventId: event.id,
    manualReplayId,
    requestedBy: "local-operator",
    initialAttemptNumber
  }),
  attemptsMade
});

beforeAll(() => {
  client = createTestDatabaseClient();
});

beforeEach(async () => {
  await resetTestDatabase(client);
});

afterAll(async () => {
  await resetTestDatabase(client);
  await client.close();
});

describe("delivery processor", () => {
  it("records a successful first delivery attempt and marks the event delivered", async () => {
    const event = await createPersistedQueuedEvent("success", "worker-success-1");
    const dependencies = createDependencies();

    const result = await processDeliveryJob(dependencies, createJob(event, 0));
    const updatedEvent = await dependencies.webhookEvents.getById(event.id);
    const attempts = await dependencies.deliveryAttempts.listAttemptsForEvent(event.id);
    const history = await dependencies.webhookEvents.listStatusHistory(event.id);

    expect(result).toEqual({
      outcome: "delivered",
      eventId: event.id,
      attemptNumber: 1
    });
    expect(updatedEvent?.currentStatus).toBe("delivered");
    expect(updatedEvent?.lastSuccessfulAt).toEqual(expect.any(Date));
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({
      attemptNumber: 1,
      status: "succeeded",
      httpStatusCode: 200
    });
    expect(history.map((entry) => entry.toStatus)).toContain("queued");
    expect(history.map((entry) => entry.toStatus).slice(-1)).toEqual(["delivered"]);
    expect(history.map((entry) => entry.toStatus)).toContain("processing");
  });

  it("records retryable failure and later success", async () => {
    const event = await createPersistedQueuedEvent("fail-once-then-success", "worker-retry-1");
    const dependencies = createDependencies();

    await expect(processDeliveryJob(dependencies, createJob(event, 0))).rejects.toBeInstanceOf(
      RetryableMockDeliveryError
    );
    await expect(processDeliveryJob(dependencies, createJob(event, 1))).resolves.toMatchObject({
      outcome: "delivered",
      attemptNumber: 2
    });

    const updatedEvent = await dependencies.webhookEvents.getById(event.id);
    const attempts = await dependencies.deliveryAttempts.listAttemptsForEvent(event.id);

    expect(updatedEvent?.currentStatus).toBe("delivered");
    expect(attempts.map((attempt) => attempt.status)).toEqual(["failed_retryable", "succeeded"]);
    expect(attempts[0]?.nextRetryAt).toEqual(expect.any(Date));
  });

  it("succeeds after two retryable failures when max attempts permit it", async () => {
    const event = await createPersistedQueuedEvent("fail-twice-then-success", "worker-retry-2");
    const dependencies = createDependencies();

    await expect(processDeliveryJob(dependencies, createJob(event, 0))).rejects.toBeInstanceOf(
      RetryableMockDeliveryError
    );
    await expect(processDeliveryJob(dependencies, createJob(event, 1))).rejects.toBeInstanceOf(
      RetryableMockDeliveryError
    );
    await expect(processDeliveryJob(dependencies, createJob(event, 2))).resolves.toMatchObject({
      outcome: "delivered",
      attemptNumber: 3
    });

    const attempts = await dependencies.deliveryAttempts.listAttemptsForEvent(event.id);

    expect(attempts.map((attempt) => attempt.attemptNumber)).toEqual([1, 2, 3]);
    expect(attempts.map((attempt) => attempt.status)).toEqual([
      "failed_retryable",
      "failed_retryable",
      "succeeded"
    ]);
  });

  it("dead-letters an event after retry attempts are exhausted", async () => {
    const event = await createPersistedQueuedEvent("always-retryable-fail", "worker-dead-letter-1");
    const dependencies = createDependencies();

    await expect(processDeliveryJob(dependencies, createJob(event, 0))).rejects.toBeInstanceOf(
      RetryableMockDeliveryError
    );
    await expect(processDeliveryJob(dependencies, createJob(event, 1))).rejects.toBeInstanceOf(
      RetryableMockDeliveryError
    );
    await expect(processDeliveryJob(dependencies, createJob(event, 2))).rejects.toBeInstanceOf(
      RetryableMockDeliveryError
    );

    const updatedEvent = await dependencies.webhookEvents.getById(event.id);
    const attempts = await dependencies.deliveryAttempts.listAttemptsForEvent(event.id);
    const deadLetter = await dependencies.deadLetterEvents.getDeadLetterByEventId(event.id);
    const history = await dependencies.webhookEvents.listStatusHistory(event.id);

    expect(updatedEvent?.currentStatus).toBe("dead_lettered");
    expect(attempts).toHaveLength(3);
    expect(deadLetter).toMatchObject({
      reasonCode: "max_attempts_exhausted",
      finalAttemptNumber: 3
    });
    expect(history.map((entry) => entry.toStatus)).toContain("dead_lettered");
  });

  it("dead-letters permanent failures without another attempt", async () => {
    const event = await createPersistedQueuedEvent("permanent-fail", "worker-permanent-1");
    const dependencies = createDependencies();

    await expect(processDeliveryJob(dependencies, createJob(event, 0))).rejects.toBeInstanceOf(
      PermanentMockDeliveryError
    );

    const updatedEvent = await dependencies.webhookEvents.getById(event.id);
    const attempts = await dependencies.deliveryAttempts.listAttemptsForEvent(event.id);
    const deadLetter = await dependencies.deadLetterEvents.getDeadLetterByEventId(event.id);

    expect(updatedEvent?.currentStatus).toBe("dead_lettered");
    expect(attempts).toHaveLength(1);
    expect(attempts[0]?.status).toBe("failed_permanent");
    expect(deadLetter).toMatchObject({
      reasonCode: "permanent_delivery_failure",
      finalAttemptNumber: 1
    });
  });

  it("does not reprocess terminal events destructively", async () => {
    const event = await createPersistedQueuedEvent("success", "worker-terminal-1");
    const dependencies = createDependencies();

    await processDeliveryJob(dependencies, createJob(event, 0));
    const skipped = await processDeliveryJob(dependencies, createJob(event, 0));
    const attempts = await dependencies.deliveryAttempts.listAttemptsForEvent(event.id);

    expect(skipped).toMatchObject({
      outcome: "skipped_terminal_status",
      eventId: event.id,
      status: "delivered"
    });
    expect(attempts).toHaveLength(1);
  });

  it("does not create duplicate attempt rows for the same event and attempt number", async () => {
    const event = await createPersistedQueuedEvent("success", "worker-duplicate-attempt-1");
    const dependencies = createDependencies();

    await dependencies.deliveryAttempts.createDeliveryAttempt({
      eventId: event.id,
      attemptNumber: 1,
      status: "running",
      startedAt: new Date(baseTime)
    });

    const result = await processDeliveryJob(dependencies, createJob(event, 0));
    const attempts = await dependencies.deliveryAttempts.listAttemptsForEvent(event.id);

    expect(result).toMatchObject({
      outcome: "duplicate_attempt_ignored",
      attemptNumber: 1
    });
    expect(attempts).toHaveLength(1);
  });

  it("fails clearly when the queued event no longer exists", async () => {
    const dependencies = createDependencies();

    await expect(
      processDeliveryJob(dependencies, {
        id: createDeliveryJobId("33333333-3333-4333-8333-333333333333"),
        data: createDeliveryJobData({
          eventId: "33333333-3333-4333-8333-333333333333",
          enqueuedAt: "2026-06-20T12:00:00.000Z"
        }),
        attemptsMade: 0
      })
    ).rejects.toBeInstanceOf(MissingWebhookEventError);
  });

  it("processes a manual replay of a dead-lettered event and completes the replay audit", async () => {
    const event = await createPersistedEventWithStatus(
      "success",
      "worker-replay-success-1",
      "dead_lettered"
    );
    const dependencies = createDependencies();
    await dependencies.deliveryAttempts.createDeliveryAttempt({
      eventId: event.id,
      attemptNumber: 1,
      status: "failed_retryable"
    });
    await dependencies.deliveryAttempts.createDeliveryAttempt({
      eventId: event.id,
      attemptNumber: 2,
      status: "failed_retryable"
    });
    await dependencies.deadLetterEvents.createDeadLetterEvent({
      eventId: event.id,
      reasonCode: "max_attempts_exhausted",
      finalAttemptNumber: 2,
      deadLetteredAt: new Date(baseTime)
    });
    const replay = await dependencies.manualReplays.createManualReplay({
      originalEventId: event.id,
      requestedBy: "local-operator",
      status: "queued",
      requestedAt: new Date(baseTime)
    });

    const result = await processDeliveryJob(dependencies, createReplayJob(event, replay.id, 0, 3));
    const updatedEvent = await dependencies.webhookEvents.getById(event.id);
    const attempts = await dependencies.deliveryAttempts.listAttemptsForEvent(event.id);
    const replayRows = await dependencies.manualReplays.listReplaysForOriginalEvent(event.id);
    const history = await dependencies.webhookEvents.listStatusHistory(event.id);

    expect(result).toMatchObject({
      outcome: "delivered",
      attemptNumber: 3
    });
    expect(updatedEvent?.currentStatus).toBe("delivered");
    expect(attempts.map((attempt) => attempt.attemptNumber)).toEqual([1, 2, 3]);
    expect(attempts[2]).toMatchObject({
      status: "succeeded",
      httpStatusCode: 200
    });
    expect(replayRows[0]).toMatchObject({
      id: replay.id,
      status: "completed"
    });
    expect(history.map((entry) => entry.toStatus)).toContain("processing");
    expect(history.map((entry) => entry.toStatus)).toContain("delivered");
  });

  it("keeps failing until a manual replay job succeeds for the demo replay scenario", async () => {
    const event = await createPersistedQueuedEvent(
      "fail-until-manual-replay-success",
      "worker-replay-demo-success-1"
    );
    const dependencies = createDependencies();

    await expect(processDeliveryJob(dependencies, createJob(event, 0))).rejects.toBeInstanceOf(
      RetryableMockDeliveryError
    );
    await expect(processDeliveryJob(dependencies, createJob(event, 1))).rejects.toBeInstanceOf(
      RetryableMockDeliveryError
    );
    await expect(processDeliveryJob(dependencies, createJob(event, 2))).rejects.toBeInstanceOf(
      RetryableMockDeliveryError
    );

    const deadLettered = await dependencies.webhookEvents.getById(event.id);
    expect(deadLettered?.currentStatus).toBe("dead_lettered");

    const replay = await dependencies.manualReplays.createManualReplay({
      originalEventId: event.id,
      requestedBy: "local-operator",
      status: "queued",
      requestedAt: new Date(baseTime)
    });

    await expect(
      processDeliveryJob(dependencies, createReplayJob(event, replay.id, 0, 4))
    ).resolves.toMatchObject({
      outcome: "delivered",
      attemptNumber: 4
    });

    const updatedEvent = await dependencies.webhookEvents.getById(event.id);
    const attempts = await dependencies.deliveryAttempts.listAttemptsForEvent(event.id);
    const replayRows = await dependencies.manualReplays.listReplaysForOriginalEvent(event.id);

    expect(updatedEvent?.currentStatus).toBe("delivered");
    expect(attempts.map((attempt) => attempt.status)).toEqual([
      "failed_retryable",
      "failed_retryable",
      "failed_retryable",
      "succeeded"
    ]);
    expect(replayRows[0]).toMatchObject({
      id: replay.id,
      status: "completed"
    });
  });

  it("marks manual replay failed and updates the dead-letter record on final replay failure", async () => {
    const event = await createPersistedEventWithStatus(
      "always-retryable-fail",
      "worker-replay-final-failure-1",
      "dead_lettered"
    );
    const dependencies = createDependencies(createClock(), 2);
    await dependencies.deliveryAttempts.createDeliveryAttempt({
      eventId: event.id,
      attemptNumber: 3,
      status: "failed_retryable"
    });
    await dependencies.deadLetterEvents.createDeadLetterEvent({
      eventId: event.id,
      reasonCode: "max_attempts_exhausted",
      finalAttemptNumber: 3,
      deadLetteredAt: new Date(baseTime)
    });
    const replay = await dependencies.manualReplays.createManualReplay({
      originalEventId: event.id,
      requestedBy: "local-operator",
      status: "queued",
      requestedAt: new Date(baseTime)
    });

    await expect(
      processDeliveryJob(dependencies, createReplayJob(event, replay.id, 0, 4))
    ).rejects.toBeInstanceOf(RetryableMockDeliveryError);
    await expect(
      processDeliveryJob(dependencies, createReplayJob(event, replay.id, 1, 4))
    ).rejects.toBeInstanceOf(RetryableMockDeliveryError);

    const updatedEvent = await dependencies.webhookEvents.getById(event.id);
    const attempts = await dependencies.deliveryAttempts.listAttemptsForEvent(event.id);
    const deadLetter = await dependencies.deadLetterEvents.getDeadLetterByEventId(event.id);
    const replayRows = await dependencies.manualReplays.listReplaysForOriginalEvent(event.id);

    expect(updatedEvent?.currentStatus).toBe("dead_lettered");
    expect(attempts.map((attempt) => attempt.attemptNumber)).toEqual([3, 4, 5]);
    expect(deadLetter).toMatchObject({
      reasonCode: "max_attempts_exhausted",
      finalAttemptNumber: 5
    });
    expect(replayRows[0]).toMatchObject({
      id: replay.id,
      status: "failed"
    });
  });
});
