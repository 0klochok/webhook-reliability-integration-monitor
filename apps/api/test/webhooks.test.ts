import { createFakeStripeSampleSignatureHeader } from "@webhook-monitor/core";
import { createTestDatabaseClient, resetTestDatabase } from "@webhook-monitor/db/test-utils";
import type { DatabaseClient } from "@webhook-monitor/db";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createApiTestHarness } from "../src/test-utils/app-test-harness.js";
import type { ApiErrorResponse, WebhookSuccessResponse } from "../src/index.js";

interface CountRow {
  readonly count: number;
}

let client: DatabaseClient;

const fixedNow = new Date("2026-06-20T12:00:00.000Z");
const fixedTimestamp = Math.floor(fixedNow.getTime() / 1000);

const createGenericPayload = (eventId = "generic-api-event-1") => ({
  eventId,
  eventType: "order.fulfilled",
  occurredAt: fixedNow.toISOString(),
  source: "local-api-test",
  idempotencyKey: `${eventId}:idempotency`,
  payload: {
    orderId: "order_local_123",
    total: 2499,
    currency: "usd"
  },
  metadata: {
    environment: "test"
  }
});

const createMockCrmPayload = (eventId = "crm-api-event-1") => ({
  eventId,
  action: "contact.created",
  occurredAt: fixedNow.toISOString(),
  crmAccountId: "crm_account_local_123",
  actorId: "crm_user_local_123",
  idempotencyKey: `${eventId}:idempotency`,
  record: {
    id: "contact_local_123",
    type: "contact",
    attributes: {
      email: "demo@example.test",
      lifecycleStage: "lead"
    }
  }
});

const createStripePayload = (eventId = "evt_api_payment_succeeded") => ({
  id: eventId,
  object: "event",
  type: "payment_intent.succeeded",
  created: fixedTimestamp,
  livemode: false,
  data: {
    object: {
      id: "pi_local_123",
      object: "payment_intent",
      amount: 2499,
      currency: "usd",
      customer: "cus_local_123",
      metadata: {
        source: "local-test"
      }
    }
  }
});

const postJson = async (
  app: ReturnType<typeof createApiTestHarness>["app"],
  path: string,
  body: unknown
) =>
  app.request(path, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });

const countEvents = async (): Promise<number> => {
  const rows = await client.sql<CountRow[]>`select count(*)::int as count from webhook_events`;
  return rows[0]?.count ?? 0;
};

const countEventsFor = async (providerId: string, externalEventId: string): Promise<number> => {
  const rows = await client.sql<CountRow[]>`
    select count(*)::int as count
    from webhook_events
    where provider_id = ${providerId}
      and external_event_id = ${externalEventId}
  `;

  return rows[0]?.count ?? 0;
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

describe("webhook ingress API", () => {
  it("returns a minimal health response", async () => {
    const { app } = createApiTestHarness({ client });

    const response = await app.request("/healthz");
    const body = (await response.json()) as { readonly ok: boolean; readonly service: string };

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toEqual(expect.any(String));
    expect(body).toEqual({
      ok: true,
      service: "webhook-reliability-api"
    });
  });

  it("returns readiness success when database and queue checks pass", async () => {
    const { app } = createApiTestHarness({ client });

    const response = await app.request("/readyz");
    const body = (await response.json()) as {
      readonly ok: true;
      readonly service: string;
      readonly dependencies: { readonly database: string; readonly queue: string };
    };

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      service: "webhook-reliability-api",
      dependencies: {
        database: "ok",
        queue: "ok"
      }
    });
  });

  it("returns readiness failure without exposing dependency URLs", async () => {
    const { app } = createApiTestHarness({
      client,
      queueReadiness: async () => {
        throw new Error("redis://:redis-password@localhost:6379 is down");
      }
    });

    const response = await app.request("/readyz");
    const bodyText = await response.text();
    const body = JSON.parse(bodyText) as {
      readonly ok: false;
      readonly dependencies: { readonly database: string; readonly queue: string };
      readonly error: { readonly code: string };
    };

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      ok: false,
      dependencies: {
        database: "ok",
        queue: "unavailable"
      },
      error: {
        code: "queue_unavailable"
      }
    });
    expect(bodyText).not.toContain("redis-password");
  });

  it("accepts a valid generic HTTP webhook, persists it, and enqueues delivery once", async () => {
    const { app, deliveryQueue, webhookEvents } = createApiTestHarness({
      client,
      clock: () => fixedNow
    });
    const payload = createGenericPayload();

    const response = await postJson(app, "/webhooks/generic-http", payload);
    const body = (await response.json()) as WebhookSuccessResponse;

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toEqual(expect.any(String));
    expect(body).toMatchObject({
      ok: true,
      providerId: "generic-http",
      externalEventId: payload.eventId,
      status: "queued",
      duplicate: false
    });
    expect(deliveryQueue.calls).toHaveLength(1);
    expect(deliveryQueue.calls[0]).toMatchObject({
      eventId: body.eventId,
      providerId: "generic-http",
      externalEventId: payload.eventId,
      correlationId: response.headers.get("x-request-id"),
      enqueuedAt: new Date(fixedNow.getTime() + 2).toISOString()
    });

    const event = await webhookEvents.getById(body.eventId);
    const history = await webhookEvents.listStatusHistory(body.eventId);

    expect(event?.currentStatus).toBe("queued");
    expect(event?.payloadHash).toMatch(/^[a-f0-9]{64}$/);
    expect(history.map((entry) => entry.toStatus)).toEqual(["received", "validated", "queued"]);
  });

  it("accepts a valid mock CRM webhook and enqueues delivery once", async () => {
    const { app, deliveryQueue, webhookEvents } = createApiTestHarness({
      client,
      clock: () => fixedNow
    });
    const payload = createMockCrmPayload();

    const response = await postJson(app, "/webhooks/mock-crm", payload);
    const body = (await response.json()) as WebhookSuccessResponse;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      providerId: "mock-crm",
      externalEventId: payload.eventId,
      status: "queued",
      duplicate: false
    });
    expect(deliveryQueue.calls).toHaveLength(1);
    await expect(webhookEvents.getById(body.eventId)).resolves.toMatchObject({
      currentStatus: "queued",
      providerId: "mock-crm"
    });
  });

  it("preserves a valid incoming x-request-id and passes it to queue data", async () => {
    const { app, deliveryQueue } = createApiTestHarness({
      client,
      clock: () => fixedNow
    });
    const payload = createGenericPayload("generic-correlation-event-1");

    const response = await app.request("/webhooks/generic-http", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-request-id": "demo-correlation-123"
      },
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("demo-correlation-123");
    expect(deliveryQueue.calls[0]).toMatchObject({
      correlationId: "demo-correlation-123"
    });
  });

  it("accepts a valid signed stripe-sample webhook", async () => {
    const { app, config, deliveryQueue, webhookEvents } = createApiTestHarness({
      client,
      clock: () => fixedNow
    });
    const rawBody = JSON.stringify(createStripePayload());
    const signature = createFakeStripeSampleSignatureHeader({
      rawBody,
      secret: config.stripeSampleWebhookSecret ?? "",
      timestamp: fixedTimestamp
    });

    const response = await app.request("/webhooks/stripe-sample", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": signature
      },
      body: rawBody
    });
    const body = (await response.json()) as WebhookSuccessResponse;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      providerId: "stripe-sample",
      externalEventId: "evt_api_payment_succeeded",
      status: "queued",
      duplicate: false
    });
    expect(deliveryQueue.calls).toHaveLength(1);
    await expect(webhookEvents.getById(body.eventId)).resolves.toMatchObject({
      currentStatus: "queued",
      signatureVerificationRequired: true
    });
  });

  it("rejects a missing stripe-sample signature and persists rejected_invalid_signature", async () => {
    const { app, deliveryQueue, webhookEvents } = createApiTestHarness({
      client,
      clock: () => fixedNow
    });

    const response = await postJson(app, "/webhooks/stripe-sample", createStripePayload());
    const body = (await response.json()) as ApiErrorResponse;

    expect(response.status).toBe(401);
    expect(response.headers.get("x-request-id")).toEqual(expect.any(String));
    expect(body.error.code).toBe("invalid_signature");
    expect(body.correlationId).toBe(response.headers.get("x-request-id"));
    expect(body.eventId).toEqual(expect.any(String));
    expect(deliveryQueue.calls).toHaveLength(0);

    const event = await webhookEvents.getById(body.eventId ?? "");
    const history = await webhookEvents.listStatusHistory(body.eventId ?? "");

    expect(event).toMatchObject({
      currentStatus: "rejected_invalid_signature",
      externalEventId: "evt_api_payment_succeeded",
      signatureVerificationRequired: true
    });
    expect(history.map((entry) => entry.toStatus)).toEqual(["rejected_invalid_signature"]);
  });

  it("rejects malformed provider payloads and persists rejected_invalid_payload", async () => {
    const { app, deliveryQueue, webhookEvents } = createApiTestHarness({
      client,
      clock: () => fixedNow
    });
    const invalidPayload = {
      eventId: "generic-invalid-payload-1",
      occurredAt: fixedNow.toISOString(),
      payload: {}
    };

    const response = await postJson(app, "/webhooks/generic-http", invalidPayload);
    const body = (await response.json()) as ApiErrorResponse;

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("invalid_payload");
    expect(body.correlationId).toBe(response.headers.get("x-request-id"));
    expect(body.error.issues?.length).toBeGreaterThan(0);
    expect(deliveryQueue.calls).toHaveLength(0);

    const event = await webhookEvents.getById(body.eventId ?? "");
    const history = await webhookEvents.listStatusHistory(body.eventId ?? "");

    expect(event).toMatchObject({
      currentStatus: "rejected_invalid_payload",
      externalEventId: "generic-invalid-payload-1"
    });
    expect(history.map((entry) => entry.toStatus)).toEqual(["rejected_invalid_payload"]);
  });

  it("rejects invalid JSON and persists rejected_invalid_payload", async () => {
    const { app, deliveryQueue, webhookEvents } = createApiTestHarness({
      client,
      clock: () => fixedNow
    });

    const response = await app.request("/webhooks/generic-http", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: '{"eventId":'
    });
    const body = (await response.json()) as ApiErrorResponse;

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("invalid_json");
    expect(body.correlationId).toBe(response.headers.get("x-request-id"));
    expect(body.eventId).toEqual(expect.any(String));
    expect(deliveryQueue.calls).toHaveLength(0);

    const event = await webhookEvents.getById(body.eventId ?? "");
    const history = await webhookEvents.listStatusHistory(body.eventId ?? "");

    expect(event).toMatchObject({
      currentStatus: "rejected_invalid_payload"
    });
    expect(event?.externalEventId).toMatch(/^invalid-payload:[a-f0-9]{64}$/);
    expect(history.map((entry) => entry.toStatus)).toEqual(["rejected_invalid_payload"]);
  });

  it("ignores duplicate provider/external event ids without a second queue call", async () => {
    const { app, deliveryQueue, webhookEvents } = createApiTestHarness({
      client,
      clock: () => fixedNow
    });
    const payload = createGenericPayload("generic-duplicate-event-1");

    const firstResponse = await postJson(app, "/webhooks/generic-http", payload);
    const firstBody = (await firstResponse.json()) as WebhookSuccessResponse;
    const secondResponse = await postJson(app, "/webhooks/generic-http", payload);
    const secondBody = (await secondResponse.json()) as WebhookSuccessResponse;

    expect(firstResponse.status).toBe(200);
    expect(firstBody.duplicate).toBe(false);
    expect(secondResponse.status).toBe(200);
    expect(secondBody).toMatchObject({
      ok: true,
      eventId: firstBody.eventId,
      providerId: "generic-http",
      externalEventId: payload.eventId,
      status: "duplicate_ignored",
      duplicate: true
    });
    expect(await countEventsFor("generic-http", payload.eventId)).toBe(1);
    expect(deliveryQueue.calls).toHaveLength(1);

    const event = await webhookEvents.getById(firstBody.eventId);
    const history = await webhookEvents.listStatusHistory(firstBody.eventId);

    expect(event?.currentStatus).toBe("queued");
    expect(history.map((entry) => entry.toStatus)).toEqual([
      "received",
      "validated",
      "queued",
      "duplicate_ignored"
    ]);
  });

  it("rejects unsupported providers without persistence or queue calls", async () => {
    const { app, deliveryQueue } = createApiTestHarness({ client });

    const response = await postJson(app, "/webhooks/not-a-provider", createGenericPayload());
    const body = (await response.json()) as ApiErrorResponse;

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "unsupported_provider",
        message: "Unsupported webhook provider."
      },
      correlationId: response.headers.get("x-request-id")
    });
    expect(await countEvents()).toBe(0);
    expect(deliveryQueue.calls).toHaveLength(0);
  });

  it("rejects oversized webhook payloads without persistence or queue calls", async () => {
    const { app, deliveryQueue } = createApiTestHarness({
      client,
      config: {
        webhookMaxBodyBytes: 20
      }
    });

    const response = await app.request("/webhooks/generic-http", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(createGenericPayload("generic-oversized-event-1"))
    });
    const body = (await response.json()) as ApiErrorResponse;

    expect(response.status).toBe(413);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "payload_too_large"
      },
      correlationId: response.headers.get("x-request-id")
    });
    expect(await countEvents()).toBe(0);
    expect(deliveryQueue.calls).toHaveLength(0);
  });

  it("rate limits webhook ingress by provider and client key", async () => {
    const { app, deliveryQueue } = createApiTestHarness({
      client,
      clock: () => fixedNow,
      config: {
        webhookRateLimitWindowMs: 60_000,
        webhookRateLimitMaxRequests: 1
      }
    });

    const firstResponse = await app.request("/webhooks/generic-http", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "127.0.0.1"
      },
      body: JSON.stringify(createGenericPayload("generic-rate-limit-event-1"))
    });
    const secondResponse = await app.request("/webhooks/generic-http", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "127.0.0.1"
      },
      body: JSON.stringify(createGenericPayload("generic-rate-limit-event-2"))
    });
    const secondBody = (await secondResponse.json()) as ApiErrorResponse;

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(429);
    expect(secondResponse.headers.get("retry-after")).toEqual(expect.any(String));
    expect(secondBody).toMatchObject({
      ok: false,
      error: {
        code: "rate_limited"
      },
      correlationId: secondResponse.headers.get("x-request-id")
    });
    expect(deliveryQueue.calls).toHaveLength(1);
  });

  it("allows rate-limit windows to reset deterministically", async () => {
    let now = fixedNow;
    const { app } = createApiTestHarness({
      client,
      clock: () => now,
      config: {
        webhookRateLimitWindowMs: 1000,
        webhookRateLimitMaxRequests: 1
      }
    });

    const firstResponse = await app.request("/webhooks/generic-http", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "127.0.0.2"
      },
      body: JSON.stringify(createGenericPayload("generic-rate-reset-event-1"))
    });
    const limitedResponse = await app.request("/webhooks/generic-http", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "127.0.0.2"
      },
      body: JSON.stringify(createGenericPayload("generic-rate-reset-event-2"))
    });
    now = new Date(fixedNow.getTime() + 1001);
    const resetResponse = await app.request("/webhooks/generic-http", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "127.0.0.2"
      },
      body: JSON.stringify(createGenericPayload("generic-rate-reset-event-3"))
    });

    expect(firstResponse.status).toBe(200);
    expect(limitedResponse.status).toBe(429);
    expect(resetResponse.status).toBe(200);
  });

  it("records enqueue failures without falsely reporting queued", async () => {
    const { app, deliveryQueue, webhookEvents } = createApiTestHarness({
      client,
      clock: () => fixedNow
    });
    deliveryQueue.failNext(new Error("Fake queue failure."));

    const response = await postJson(
      app,
      "/webhooks/generic-http",
      createGenericPayload("generic-queue-failure-event-1")
    );
    const body = (await response.json()) as ApiErrorResponse;

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("queue_enqueue_failed");
    expect(deliveryQueue.calls).toHaveLength(0);
    expect(body.eventId).toEqual(expect.any(String));

    const event = await webhookEvents.getById(body.eventId ?? "");
    const history = await webhookEvents.listStatusHistory(body.eventId ?? "");

    expect(event?.currentStatus).toBe("failed_retryable");
    expect(history.map((entry) => entry.reasonCode)).toContain("queue_enqueue_failed");
  });

  it("verifies stripe-sample signatures against the exact raw body", async () => {
    const { app, config, deliveryQueue, webhookEvents } = createApiTestHarness({
      client,
      clock: () => fixedNow
    });
    const payload = createStripePayload("evt_raw_body_mismatch");
    const signedRawBody = JSON.stringify(payload);
    const sentRawBody = JSON.stringify(payload, null, 2);
    const signature = createFakeStripeSampleSignatureHeader({
      rawBody: signedRawBody,
      secret: config.stripeSampleWebhookSecret ?? "",
      timestamp: fixedTimestamp
    });

    const response = await app.request("/webhooks/stripe-sample", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": signature
      },
      body: sentRawBody
    });
    const body = (await response.json()) as ApiErrorResponse;

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("invalid_signature");
    expect(body.correlationId).toBe(response.headers.get("x-request-id"));
    expect(deliveryQueue.calls).toHaveLength(0);

    const event = await webhookEvents.getById(body.eventId ?? "");

    expect(event).toMatchObject({
      currentStatus: "rejected_invalid_signature",
      externalEventId: "evt_raw_body_mismatch"
    });
  });
});
