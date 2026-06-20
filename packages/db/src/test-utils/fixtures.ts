import {
  createPayloadHash,
  normalizedEventSchemaVersion,
  type JsonValue,
  type NormalizedEvent,
  type ProviderId
} from "@webhook-monitor/core";

export interface NormalizedEventFixtureOptions {
  readonly providerId?: ProviderId;
  readonly externalEventId?: string;
  readonly eventType?: string;
  readonly occurredAt?: Date;
  readonly receivedAt?: Date;
  readonly idempotencyKey?: string;
  readonly payload?: JsonValue;
  readonly signatureVerificationRequired?: boolean;
}

export const createNormalizedEventFixture = (
  options: NormalizedEventFixtureOptions = {}
): NormalizedEvent => {
  const providerId = options.providerId ?? "stripe-sample";
  const externalEventId = options.externalEventId ?? "evt_test_001";
  const payload =
    options.payload ??
    ({
      id: externalEventId,
      object: "event",
      type: options.eventType ?? "invoice.payment_succeeded",
      created: "2026-06-20T12:00:00.000Z"
    } satisfies JsonValue);

  return {
    providerId,
    externalEventId,
    eventType: options.eventType ?? "invoice.payment_succeeded",
    occurredAt: options.occurredAt ?? new Date("2026-06-20T12:00:00.000Z"),
    receivedAt: options.receivedAt ?? new Date("2026-06-20T12:05:00.000Z"),
    idempotencyKey: options.idempotencyKey ?? externalEventId,
    payload,
    payloadHash: createPayloadHash(payload),
    signatureVerificationRequired:
      options.signatureVerificationRequired ?? providerId === "stripe-sample",
    schemaVersion: normalizedEventSchemaVersion
  };
};
