import {
  jsonValueSchema,
  normalizedEventSchema,
  normalizedEventSchemaVersion,
  type EventStatus,
  type JsonValue,
  type NormalizedEvent,
  type ProviderId
} from "@webhook-monitor/core";

export interface CreateRejectedNormalizedEventInput {
  readonly providerId: ProviderId;
  readonly status: Extract<EventStatus, "rejected_invalid_signature" | "rejected_invalid_payload">;
  readonly payloadHash: string;
  readonly receivedAt: Date;
  readonly signatureVerificationRequired: boolean;
  readonly parsedPayload?: unknown;
  readonly fallbackReasonCode: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const extractPlausibleEventId = (payload: unknown): string | undefined => {
  if (!isRecord(payload)) {
    return undefined;
  }

  for (const key of ["id", "eventId", "externalEventId"]) {
    const value = payload[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return undefined;
};

const toSafeJsonValue = (payload: unknown, fallback: JsonValue): JsonValue => {
  const result = jsonValueSchema.safeParse(payload);
  return result.success ? result.data : fallback;
};

const createFallbackPayload = (input: CreateRejectedNormalizedEventInput): JsonValue => ({
  payloadHash: input.payloadHash,
  reasonCode: input.fallbackReasonCode
});

export const createRejectedNormalizedEvent = (
  input: CreateRejectedNormalizedEventInput
): NormalizedEvent => {
  const externalEventId =
    extractPlausibleEventId(input.parsedPayload) ??
    `${input.status === "rejected_invalid_signature" ? "invalid-signature" : "invalid-payload"}:${
      input.payloadHash
    }`;
  const fallbackPayload = createFallbackPayload(input);
  const payload =
    input.parsedPayload === undefined
      ? fallbackPayload
      : toSafeJsonValue(input.parsedPayload, fallbackPayload);

  return normalizedEventSchema.parse({
    providerId: input.providerId,
    externalEventId,
    eventType:
      input.status === "rejected_invalid_signature"
        ? "webhook.rejected_invalid_signature"
        : "webhook.rejected_invalid_payload",
    occurredAt: input.receivedAt,
    receivedAt: input.receivedAt,
    idempotencyKey: externalEventId,
    payload,
    payloadHash: input.payloadHash,
    signatureVerificationRequired: input.signatureVerificationRequired,
    schemaVersion: normalizedEventSchemaVersion
  });
};
