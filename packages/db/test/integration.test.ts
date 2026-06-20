import { providerIds, eventStatuses } from "@webhook-monitor/core";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { DatabaseClient } from "../src/client.js";
import {
  createDeadLetterEventsRepository,
  createDeliveryAttemptsRepository,
  createManualReplaysRepository,
  createStatusHistoryRepository,
  createWebhookEventRepository
} from "../src/repositories/index.js";
import {
  eventStatusEnum,
  providerIdEnum,
  webhookEvents,
  type WebhookEvent
} from "../src/schema.js";
import {
  assertSafeTestDatabaseUrl,
  createTestDatabaseClient,
  resetTestDatabase
} from "../src/test-utils/database.js";
import { createNormalizedEventFixture } from "../src/test-utils/fixtures.js";

interface TableNameRow {
  readonly table_name: string;
}

let client: DatabaseClient;

const createPersistedEvent = async (externalEventId = "evt_repo_base"): Promise<WebhookEvent> => {
  const repository = createWebhookEventRepository(client.db);
  return repository.create({
    normalizedEvent: createNormalizedEventFixture({ externalEventId }),
    currentStatus: "received",
    createdAt: new Date("2026-06-20T12:00:00.000Z"),
    updatedAt: new Date("2026-06-20T12:00:00.000Z")
  });
};

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

describe("database schema and migrations", () => {
  it("connects to PostgreSQL and exposes expected migrated tables", async () => {
    const rows = await client.sql<TableNameRow[]>`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in (
          'webhook_events',
          'event_status_history',
          'delivery_attempts',
          'dead_letter_events',
          'manual_replays'
        )
      order by table_name
    `;

    expect(rows.map((row) => row.table_name)).toEqual([
      "dead_letter_events",
      "delivery_attempts",
      "event_status_history",
      "manual_replays",
      "webhook_events"
    ]);
  });

  it("keeps database enum definitions aligned with core literals", () => {
    expect(providerIdEnum.enumValues).toEqual(providerIds);
    expect(eventStatusEnum.enumValues).toEqual(eventStatuses);
  });

  it("supports a basic insert and select through the repository layer", async () => {
    const event = await createPersistedEvent("evt_schema_smoke");
    const repository = createWebhookEventRepository(client.db);

    await expect(repository.getById(event.id)).resolves.toEqual(event);
  });
});

describe("webhook event repository", () => {
  it("inserts, retrieves, lists, and stores JSON payload/current status", async () => {
    const repository = createWebhookEventRepository(client.db);
    const normalizedEvent = createNormalizedEventFixture({
      externalEventId: "evt_repo_001",
      payload: {
        id: "evt_repo_001",
        nested: {
          amount: 4200,
          currency: "usd"
        }
      }
    });

    const event = await repository.create({
      normalizedEvent,
      currentStatus: "validated",
      createdAt: new Date("2026-06-20T12:01:00.000Z"),
      updatedAt: new Date("2026-06-20T12:01:00.000Z")
    });

    expect(await repository.getById(event.id)).toEqual(event);
    expect(
      await repository.getByProviderAndExternalEventId("stripe-sample", "evt_repo_001")
    ).toEqual(event);
    expect(await repository.listRecent(5)).toContainEqual(event);
    expect(event.payload).toEqual(normalizedEvent.payload);
    expect(event.currentStatus).toBe("validated");
  });
});

describe("idempotency", () => {
  it("rejects duplicate provider/external event ids and idempotently returns existing rows", async () => {
    const repository = createWebhookEventRepository(client.db);
    const normalizedEvent = createNormalizedEventFixture({ externalEventId: "evt_duplicate" });

    const inserted = await repository.create({
      normalizedEvent,
      currentStatus: "received"
    });

    await expect(
      repository.create({
        normalizedEvent,
        currentStatus: "received"
      })
    ).rejects.toThrow();

    const rows = await client.db
      .select()
      .from(webhookEvents)
      .where(
        and(
          eq(webhookEvents.providerId, normalizedEvent.providerId),
          eq(webhookEvents.externalEventId, normalizedEvent.externalEventId)
        )
      );

    expect(rows).toHaveLength(1);

    const idempotentResult = await repository.createIdempotent({
      normalizedEvent,
      currentStatus: "received"
    });

    expect(idempotentResult.inserted).toBe(false);
    expect(idempotentResult.event.id).toBe(inserted.id);
    expect(await repository.isDuplicate("stripe-sample", "evt_duplicate")).toBe(true);
  });
});

describe("status history", () => {
  it("writes initial history and appends deterministic transition history", async () => {
    const events = createWebhookEventRepository(client.db);
    const statusHistory = createStatusHistoryRepository(client.db);
    const initialAt = new Date("2026-06-20T12:02:00.000Z");
    const transitionAt = new Date("2026-06-20T12:02:05.000Z");

    const initial = await events.createWithInitialStatusHistory({
      normalizedEvent: createNormalizedEventFixture({ externalEventId: "evt_status_history" }),
      currentStatus: "received",
      createdAt: initialAt,
      updatedAt: initialAt,
      initialHistory: {
        reasonCode: "received",
        createdAt: initialAt
      }
    });

    const transition = await events.transitionStatus({
      eventId: initial.event.id,
      toStatus: "delivered",
      reasonCode: "delivery_ok",
      changedAt: transitionAt
    });

    await statusHistory.appendStatusTransition({
      eventId: initial.event.id,
      fromStatus: "delivered",
      toStatus: "replayed",
      reasonCode: "manual_replay_requested",
      createdAt: new Date("2026-06-20T12:02:10.000Z")
    });

    const history = await events.listStatusHistory(initial.event.id);

    expect(transition.event.currentStatus).toBe("delivered");
    expect(history.map((entry) => entry.toStatus)).toEqual(["received", "delivered", "replayed"]);
    expect(history[0]?.fromStatus).toBeNull();
    expect(history[1]?.fromStatus).toBe("received");
  });
});

describe("delivery attempts", () => {
  it("creates, uniquely numbers, updates, lists, and returns latest attempts", async () => {
    const event = await createPersistedEvent("evt_attempts");
    const attempts = createDeliveryAttemptsRepository(client.db);

    const attempt = await attempts.createDeliveryAttempt({
      eventId: event.id,
      attemptNumber: 1,
      status: "pending",
      targetUrl: "http://localhost:3999/mock-downstream",
      createdAt: new Date("2026-06-20T12:03:00.000Z")
    });

    await expect(
      attempts.createDeliveryAttempt({
        eventId: event.id,
        attemptNumber: 1,
        status: "pending"
      })
    ).rejects.toThrow();

    const completedAt = new Date("2026-06-20T12:03:01.000Z");
    const updated = await attempts.updateDeliveryAttemptResult({
      attemptId: attempt.id,
      status: "failed_retryable",
      httpStatusCode: 500,
      errorCode: "DOWNSTREAM_500",
      errorMessage: "Fake downstream failure.",
      durationMs: 73,
      completedAt,
      nextRetryAt: new Date("2026-06-20T12:03:05.000Z")
    });

    const latest = await attempts.createDeliveryAttempt({
      eventId: event.id,
      attemptNumber: 2,
      status: "running",
      createdAt: new Date("2026-06-20T12:03:06.000Z")
    });

    expect(updated.status).toBe("failed_retryable");
    expect(await attempts.listAttemptsForEvent(event.id)).toHaveLength(2);
    expect(await attempts.getLatestAttemptForEvent(event.id)).toEqual(latest);
  });
});

describe("dead-letter events", () => {
  it("creates, prevents duplicates, and lists dead-letter records", async () => {
    const event = await createPersistedEvent("evt_dead_letter");
    const repository = createDeadLetterEventsRepository(client.db);
    const deadLetteredAt = new Date("2026-06-20T12:04:00.000Z");

    const deadLetter = await repository.createDeadLetterEvent({
      eventId: event.id,
      reasonCode: "max_attempts_exhausted",
      errorMessage: "Fake downstream failure.",
      finalAttemptNumber: 3,
      payloadSnapshot: event.payload,
      deadLetteredAt,
      createdAt: deadLetteredAt
    });

    await expect(
      repository.createDeadLetterEvent({
        eventId: event.id,
        reasonCode: "max_attempts_exhausted"
      })
    ).rejects.toThrow();

    expect(await repository.getDeadLetterByEventId(event.id)).toEqual(deadLetter);
    expect(await repository.listDeadLetterEvents()).toContainEqual(deadLetter);
  });
});

describe("manual replays", () => {
  it("creates, updates, and lists replay audit records", async () => {
    const original = await createPersistedEvent("evt_replay_original");
    const replayed = await createPersistedEvent("evt_replay_replayed");
    const repository = createManualReplaysRepository(client.db);

    const replay = await repository.createManualReplay({
      originalEventId: original.id,
      requestedBy: "local-operator",
      reason: "Manual retry from test.",
      requestedAt: new Date("2026-06-20T12:05:00.000Z")
    });

    const completedAt = new Date("2026-06-20T12:05:10.000Z");
    const updated = await repository.updateReplayStatus({
      replayId: replay.id,
      status: "completed",
      replayedEventId: replayed.id,
      completedAt,
      metadata: {
        source: "test"
      }
    });

    expect(updated.status).toBe("completed");
    expect(updated.replayedEventId).toBe(replayed.id);
    expect(await repository.listReplaysForOriginalEvent(original.id)).toEqual([updated]);
  });
});

describe("local database safety", () => {
  it("refuses unsafe database URLs for destructive cleanup helpers", () => {
    expect(() =>
      assertSafeTestDatabaseUrl("postgresql://user:password@db.example.com:5432/webhook_monitor")
    ).toThrow(/non-local host/);

    expect(() =>
      assertSafeTestDatabaseUrl("postgresql://user:password@localhost:5432/prod")
    ).toThrow(/unexpected database/);
  });
});
