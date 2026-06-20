import { describe, expect, it } from "vitest";

import {
  genericHttpAdapter,
  mockCrmAdapter,
  ProviderPayloadValidationError,
  stripeSampleAdapter
} from "../src/adapters.js";
import type { NormalizedEvent } from "../src/normalized-event.js";
import { createGenericHttpEventFixture } from "../src/test-fixtures/generic-http.js";
import { createMockCrmEventFixture } from "../src/test-fixtures/mock-crm.js";
import { createStripeSampleEventFixture } from "../src/test-fixtures/stripe-sample.js";

const receivedAt = new Date("2026-06-20T12:05:00.000Z");
const normalizationContext = {
  receivedAt,
  headers: {}
};

const expectNormalizedEventShape = (event: NormalizedEvent): void => {
  expect(event).toEqual(
    expect.objectContaining({
      externalEventId: expect.any(String),
      eventType: expect.any(String),
      occurredAt: expect.any(Date),
      receivedAt,
      idempotencyKey: expect.any(String),
      payload: expect.any(Object),
      payloadHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      schemaVersion: "v1"
    })
  );
};

describe("provider adapters", () => {
  it("normalizes a valid stripe sample payload", () => {
    const payload = stripeSampleAdapter.validatePayload(createStripeSampleEventFixture());
    const normalized = stripeSampleAdapter.normalizeEvent(payload, normalizationContext);

    expectNormalizedEventShape(normalized);
    expect(normalized.providerId).toBe("stripe-sample");
    expect(normalized.externalEventId).toBe(payload.id);
    expect(normalized.eventType).toBe(payload.type);
    expect(normalized.idempotencyKey).toBe(payload.id);
    expect(normalized.signatureVerificationRequired).toBe(true);
  });

  it("normalizes a valid generic HTTP payload", () => {
    const payload = genericHttpAdapter.validatePayload(createGenericHttpEventFixture());
    const normalized = genericHttpAdapter.normalizeEvent(payload, normalizationContext);

    expectNormalizedEventShape(normalized);
    expect(normalized.providerId).toBe("generic-http");
    expect(normalized.externalEventId).toBe(payload.eventId);
    expect(normalized.eventType).toBe(payload.eventType);
    expect(normalized.idempotencyKey).toBe(payload.idempotencyKey);
    expect(normalized.signatureVerificationRequired).toBe(false);
  });

  it("defaults generic HTTP idempotency to the external event id", () => {
    const fixture: Record<string, unknown> = { ...createGenericHttpEventFixture() };
    Reflect.deleteProperty(fixture, "idempotencyKey");

    const payload = genericHttpAdapter.validatePayload(fixture);
    const normalized = genericHttpAdapter.normalizeEvent(payload, normalizationContext);

    expect(normalized.idempotencyKey).toBe(payload.eventId);
  });

  it("normalizes a valid mock CRM payload", () => {
    const payload = mockCrmAdapter.validatePayload(createMockCrmEventFixture());
    const normalized = mockCrmAdapter.normalizeEvent(payload, normalizationContext);

    expectNormalizedEventShape(normalized);
    expect(normalized.providerId).toBe("mock-crm");
    expect(normalized.externalEventId).toBe(payload.eventId);
    expect(normalized.eventType).toBe(payload.action);
    expect(normalized.idempotencyKey).toBe(payload.idempotencyKey);
    expect(normalized.signatureVerificationRequired).toBe(false);
  });

  it("produces clear validation failures for invalid payloads", () => {
    expect(() => stripeSampleAdapter.validatePayload({ object: "event" })).toThrow(
      ProviderPayloadValidationError
    );
    expect(() => genericHttpAdapter.validatePayload({ eventId: "" })).toThrow(
      /Invalid payload for provider "generic-http"/
    );
    expect(() => mockCrmAdapter.validatePayload({ action: "company.created" })).toThrow(
      /Invalid payload for provider "mock-crm"/
    );
  });
});
