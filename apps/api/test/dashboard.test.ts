import {
  createDeadLetterEventsRepository,
  createDeliveryAttemptsRepository,
  createManualReplaysRepository,
  createWebhookEventRepository,
  type DatabaseClient,
  type WebhookEvent
} from "@webhook-monitor/db";
import {
  createNormalizedEventFixture,
  createTestDatabaseClient,
  resetTestDatabase
} from "@webhook-monitor/db/test-utils";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createApiTestHarness } from "../src/test-utils/app-test-harness.js";

let client: DatabaseClient;

const createPersistedEvent = async (
  externalEventId: string,
  currentStatus: WebhookEvent["currentStatus"],
  receivedAt = new Date("2026-06-20T12:00:00.000Z"),
  lastSuccessfulAt: Date | null = null
): Promise<WebhookEvent> => {
  const repository = createWebhookEventRepository(client.db);
  const result = await repository.createWithInitialStatusHistory({
    normalizedEvent: createNormalizedEventFixture({
      providerId: "generic-http",
      externalEventId,
      eventType: "order.fulfilled",
      signatureVerificationRequired: false,
      receivedAt,
      payload: {
        eventId: externalEventId,
        eventType: "order.fulfilled",
        occurredAt: "2026-06-20T12:00:00.000Z",
        source: "api-dashboard-test",
        idempotencyKey: `${externalEventId}:idempotency`,
        payload: {
          orderId: `${externalEventId}-order`,
          deliveryBehavior: "success"
        },
        secretLikeValue: "not-a-real-secret"
      }
    }),
    currentStatus,
    lastSuccessfulAt,
    createdAt: receivedAt,
    updatedAt: receivedAt,
    initialHistory: {
      reasonCode: "dashboard_route_test_seed",
      createdAt: receivedAt
    }
  });

  return result.event;
};

const createDeadLetterFixture = async (): Promise<WebhookEvent> => {
  const event = await createPersistedEvent(
    "api-dashboard-dead-letter",
    "dead_lettered",
    new Date("2026-06-20T12:01:00.000Z")
  );
  const attempts = createDeliveryAttemptsRepository(client.db);
  const deadLetters = createDeadLetterEventsRepository(client.db);

  await attempts.createDeliveryAttempt({
    eventId: event.id,
    attemptNumber: 1,
    status: "failed_retryable",
    errorCode: "MOCK_DOWNSTREAM_RETRYABLE",
    errorMessage: "Fake retryable failure."
  });
  await attempts.createDeliveryAttempt({
    eventId: event.id,
    attemptNumber: 2,
    status: "failed_retryable",
    errorCode: "MOCK_DOWNSTREAM_RETRYABLE",
    errorMessage: "Fake retryable failure."
  });
  await deadLetters.createDeadLetterEvent({
    eventId: event.id,
    reasonCode: "max_attempts_exhausted",
    errorMessage: "Fake retryable failure.",
    finalAttemptNumber: 2,
    deadLetteredAt: new Date("2026-06-20T12:02:00.000Z")
  });

  return event;
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

describe("dashboard summary routes", () => {
  it("returns safe zero JSON metrics for an empty database", async () => {
    const { app } = createApiTestHarness({ client });

    const response = await app.request("/api/dashboard/summary");
    const body = (await response.json()) as {
      readonly ok: true;
      readonly data: {
        readonly totalEventVolume: number;
        readonly successRate: number;
        readonly failedEvents: number;
        readonly retryCount: number;
        readonly deadLetterCount: number;
        readonly lastSuccessfulEvent: null;
      };
    };

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      totalEventVolume: 0,
      successRate: 0,
      failedEvents: 0,
      retryCount: 0,
      deadLetterCount: 0,
      lastSuccessfulEvent: null
    });
  });

  it("renders summary labels in HTML without exposing local secrets", async () => {
    const { app } = createApiTestHarness({ client });

    const response = await app.request("/dashboard");
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("Total event volume");
    expect(body).toContain("Success rate");
    expect(body).toContain("Failed events");
    expect(body).toContain("Retry count");
    expect(body).toContain("Dead-letter count");
    expect(body).toContain("Last successful event");
    expect(body).not.toContain("whsec_");
  });
});

describe("dashboard event routes", () => {
  it("lists recent events as JSON and supports status filtering", async () => {
    const { app } = createApiTestHarness({ client });
    const deadLettered = await createDeadLetterFixture();
    await createPersistedEvent(
      "api-dashboard-delivered",
      "delivered",
      new Date("2026-06-20T12:00:00.000Z"),
      new Date("2026-06-20T12:00:01.000Z")
    );

    const response = await app.request("/api/dashboard/events?status=dead_lettered");
    const body = (await response.json()) as {
      readonly ok: true;
      readonly data: ReadonlyArray<{ readonly id: string; readonly payload?: unknown }>;
    };

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.id).toBe(deadLettered.id);
    expect(body.data[0]).not.toHaveProperty("payload");
  });

  it("rejects invalid status filters safely", async () => {
    const { app } = createApiTestHarness({ client });

    const response = await app.request("/api/dashboard/events?status=not-a-status");
    const body = (await response.json()) as {
      readonly ok: false;
      readonly error: { readonly code: string };
    };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("invalid_status_filter");
  });

  it("renders event list HTML and empty state", async () => {
    const { app } = createApiTestHarness({ client });

    const emptyResponse = await app.request("/dashboard/events");
    const emptyBody = await emptyResponse.text();
    expect(emptyResponse.status).toBe(200);
    expect(emptyBody).toContain("No webhook events match the current filter.");

    await createPersistedEvent("api-dashboard-list-html", "queued");
    const response = await app.request("/dashboard/events");
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("api-dashboard-list-html");
  });

  it("returns event detail JSON and HTML with attempts, history, and replay actions", async () => {
    const { app } = createApiTestHarness({ client });
    const deadLettered = await createDeadLetterFixture();
    const delivered = await createPersistedEvent(
      "api-dashboard-detail-delivered",
      "delivered",
      new Date("2026-06-20T12:03:00.000Z"),
      new Date("2026-06-20T12:03:01.000Z")
    );

    const jsonResponse = await app.request(`/api/dashboard/events/${deadLettered.id}`);
    const jsonBody = (await jsonResponse.json()) as {
      readonly ok: true;
      readonly data: {
        readonly event: { readonly id: string; readonly payload?: unknown };
        readonly statusHistory: readonly unknown[];
        readonly deliveryAttempts: readonly unknown[];
        readonly deadLetterEvent: unknown;
      };
    };
    const replayableHtml = await (await app.request(`/dashboard/events/${deadLettered.id}`)).text();
    const deliveredHtml = await (await app.request(`/dashboard/events/${delivered.id}`)).text();
    const notFoundResponse = await app.request(
      "/dashboard/events/11111111-1111-4111-8111-111111111111"
    );

    expect(jsonResponse.status).toBe(200);
    expect(jsonBody.data.event.id).toBe(deadLettered.id);
    expect(jsonBody.data.event).not.toHaveProperty("payload");
    expect(jsonBody.data.statusHistory.length).toBeGreaterThan(0);
    expect(jsonBody.data.deliveryAttempts).toHaveLength(2);
    expect(jsonBody.data.deadLetterEvent).not.toBeNull();
    expect(replayableHtml).toContain("Status History");
    expect(replayableHtml).toContain("Delivery Attempts");
    expect(replayableHtml).toContain("Replay event");
    expect(deliveredHtml).not.toContain("Replay event");
    expect(notFoundResponse.status).toBe(404);
  });
});

describe("dashboard dead-letter and replay routes", () => {
  it("returns dead-letter JSON and renders replay actions in HTML", async () => {
    const { app } = createApiTestHarness({ client });
    const deadLettered = await createDeadLetterFixture();

    const jsonResponse = await app.request("/api/dashboard/dead-letter");
    const jsonBody = (await jsonResponse.json()) as {
      readonly ok: true;
      readonly data: ReadonlyArray<{ readonly eventId: string }>;
    };
    const htmlResponse = await app.request("/dashboard/dead-letter");
    const htmlBody = await htmlResponse.text();

    expect(jsonResponse.status).toBe(200);
    expect(jsonBody.data).toHaveLength(1);
    expect(jsonBody.data[0]?.eventId).toBe(deadLettered.id);
    expect(htmlResponse.status).toBe(200);
    expect(htmlBody).toContain("Replay event");
  });

  it("renders a safe empty dead-letter state", async () => {
    const { app } = createApiTestHarness({ client });

    const response = await app.request("/dashboard/dead-letter");
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("No dead-letter records exist.");
  });

  it("queues manual replay through the JSON route with a replay-specific job id", async () => {
    const { app, deliveryQueue } = createApiTestHarness({ client });
    const deadLettered = await createDeadLetterFixture();
    const manualReplays = createManualReplaysRepository(client.db);

    const response = await app.request(`/api/dashboard/events/${deadLettered.id}/replay`, {
      method: "POST"
    });
    const body = (await response.json()) as {
      readonly ok: true;
      readonly data: {
        readonly manualReplay: { readonly id: string; readonly status: string };
        readonly queueJobId: string;
        readonly initialAttemptNumber: number;
      };
    };
    const replayRows = await manualReplays.listReplaysForOriginalEvent(deadLettered.id);

    expect(response.status).toBe(200);
    expect(body.data.manualReplay.status).toBe("queued");
    expect(body.data.queueJobId).toBe(`delivery-replay-${body.data.manualReplay.id}`);
    expect(body.data.initialAttemptNumber).toBe(3);
    expect(deliveryQueue.calls).toHaveLength(1);
    expect(deliveryQueue.calls[0]).toMatchObject({
      eventId: deadLettered.id,
      replayOfEventId: deadLettered.id,
      manualReplayId: body.data.manualReplay.id,
      initialAttemptNumber: 3
    });
    expect(replayRows).toHaveLength(1);
    expect(replayRows[0]?.status).toBe("queued");
  });

  it("queues manual replay through the HTML route and redirects to detail", async () => {
    const { app } = createApiTestHarness({ client });
    const deadLettered = await createDeadLetterFixture();

    const response = await app.request(`/dashboard/events/${deadLettered.id}/replay`, {
      method: "POST"
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      `/dashboard/events/${deadLettered.id}?replay=queued`
    );
  });

  it("blocks replay for delivered events without queueing", async () => {
    const { app, deliveryQueue } = createApiTestHarness({ client });
    const delivered = await createPersistedEvent(
      "api-dashboard-replay-blocked",
      "delivered",
      new Date("2026-06-20T12:04:00.000Z"),
      new Date("2026-06-20T12:04:01.000Z")
    );
    const manualReplays = createManualReplaysRepository(client.db);

    const response = await app.request(`/api/dashboard/events/${delivered.id}/replay`, {
      method: "POST"
    });
    const body = (await response.json()) as {
      readonly ok: false;
      readonly error: { readonly code: string };
    };

    expect(response.status).toBe(409);
    expect(body.error.code).toBe("replay_not_allowed");
    expect(deliveryQueue.calls).toHaveLength(0);
    await expect(manualReplays.listReplaysForOriginalEvent(delivered.id)).resolves.toHaveLength(0);
  });

  it("marks replay failed when queue enqueue fails", async () => {
    const { app, deliveryQueue } = createApiTestHarness({ client });
    const deadLettered = await createDeadLetterFixture();
    const manualReplays = createManualReplaysRepository(client.db);
    deliveryQueue.failNext(new Error("Fake queue failure."));

    const response = await app.request(`/api/dashboard/events/${deadLettered.id}/replay`, {
      method: "POST"
    });
    const body = (await response.json()) as {
      readonly ok: false;
      readonly error: { readonly code: string };
    };
    const replayRows = await manualReplays.listReplaysForOriginalEvent(deadLettered.id);

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("queue_enqueue_failed");
    expect(replayRows).toHaveLength(1);
    expect(replayRows[0]?.status).toBe("failed");
  });
});
