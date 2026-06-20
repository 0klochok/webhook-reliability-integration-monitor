import type { ZodError, ZodType } from "zod";

import {
  createPayloadHash,
  jsonValueSchema,
  normalizedEventSchema,
  type JsonValue,
  type NormalizedEvent
} from "./normalized-event.js";
import { getProviderMetadata, type ProviderId } from "./providers.js";
import {
  genericHttpEventSchema,
  mockCrmEventSchema,
  stripeSampleEventSchema,
  type GenericHttpEvent,
  type MockCrmEvent,
  type StripeSampleEvent
} from "./schemas/index.js";
import { fakeStripeSampleSignatureVerifier, type SignatureVerifier } from "./signature.js";

export interface NormalizationContext {
  readonly receivedAt: Date;
  readonly headers: Record<string, string | undefined>;
  readonly payloadHash?: string;
  readonly rawBodyHash?: string;
}

export interface ProviderAdapter<TPayload = unknown> {
  readonly providerId: ProviderId;
  readonly displayName: string;
  readonly requiresSignatureVerification: boolean;
  readonly signatureVerifier?: SignatureVerifier;
  validatePayload(input: unknown): TPayload;
  normalizeEvent(payload: TPayload, context: NormalizationContext): NormalizedEvent;
}

export class ProviderPayloadValidationError extends Error {
  readonly providerId: ProviderId;
  readonly issues: readonly string[];

  constructor(providerId: ProviderId, issues: readonly string[]) {
    super(`Invalid payload for provider "${providerId}": ${issues.join("; ")}`);
    this.name = "ProviderPayloadValidationError";
    this.providerId = providerId;
    this.issues = issues;
  }
}

const zodIssuesToMessages = (error: ZodError): string[] =>
  error.issues.map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`);

const parseProviderPayload = <TPayload>(
  providerId: ProviderId,
  schema: ZodType<TPayload>,
  input: unknown
): TPayload => {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new ProviderPayloadValidationError(providerId, zodIssuesToMessages(result.error));
  }

  return result.data;
};

const createNormalizedEvent = (
  event: Omit<NormalizedEvent, "payloadHash">,
  context: NormalizationContext
): NormalizedEvent => {
  const payloadHash =
    context.payloadHash ?? context.rawBodyHash ?? createPayloadHash(event.payload as JsonValue);

  return normalizedEventSchema.parse({
    ...event,
    payloadHash
  });
};

const toJsonValue = (payload: unknown): JsonValue => jsonValueSchema.parse(payload);

export const stripeSampleAdapter: ProviderAdapter<StripeSampleEvent> = {
  providerId: "stripe-sample",
  displayName: getProviderMetadata("stripe-sample").displayName,
  requiresSignatureVerification: getProviderMetadata("stripe-sample").requiresSignatureVerification,
  signatureVerifier: fakeStripeSampleSignatureVerifier,
  validatePayload(input) {
    return parseProviderPayload(this.providerId, stripeSampleEventSchema, input);
  },
  normalizeEvent(payload, context) {
    const jsonPayload = toJsonValue(payload);

    return createNormalizedEvent(
      {
        providerId: this.providerId,
        externalEventId: payload.id,
        eventType: payload.type,
        occurredAt: new Date(payload.created * 1000),
        receivedAt: context.receivedAt,
        idempotencyKey: payload.id,
        payload: jsonPayload,
        signatureVerificationRequired: this.requiresSignatureVerification,
        schemaVersion: "v1"
      },
      context
    );
  }
};

export const genericHttpAdapter: ProviderAdapter<GenericHttpEvent> = {
  providerId: "generic-http",
  displayName: getProviderMetadata("generic-http").displayName,
  requiresSignatureVerification: getProviderMetadata("generic-http").requiresSignatureVerification,
  validatePayload(input) {
    return parseProviderPayload(this.providerId, genericHttpEventSchema, input);
  },
  normalizeEvent(payload, context) {
    const jsonPayload = toJsonValue(payload);

    return createNormalizedEvent(
      {
        providerId: this.providerId,
        externalEventId: payload.eventId,
        eventType: payload.eventType,
        occurredAt: new Date(payload.occurredAt),
        receivedAt: context.receivedAt,
        idempotencyKey: payload.idempotencyKey ?? payload.eventId,
        payload: jsonPayload,
        signatureVerificationRequired: this.requiresSignatureVerification,
        schemaVersion: "v1"
      },
      context
    );
  }
};

export const mockCrmAdapter: ProviderAdapter<MockCrmEvent> = {
  providerId: "mock-crm",
  displayName: getProviderMetadata("mock-crm").displayName,
  requiresSignatureVerification: getProviderMetadata("mock-crm").requiresSignatureVerification,
  validatePayload(input) {
    return parseProviderPayload(this.providerId, mockCrmEventSchema, input);
  },
  normalizeEvent(payload, context) {
    const jsonPayload = toJsonValue(payload);

    return createNormalizedEvent(
      {
        providerId: this.providerId,
        externalEventId: payload.eventId,
        eventType: payload.action,
        occurredAt: new Date(payload.occurredAt),
        receivedAt: context.receivedAt,
        idempotencyKey: payload.idempotencyKey ?? payload.eventId,
        payload: jsonPayload,
        signatureVerificationRequired: this.requiresSignatureVerification,
        schemaVersion: "v1"
      },
      context
    );
  }
};

export const providerAdapterRegistry = {
  "stripe-sample": stripeSampleAdapter,
  "generic-http": genericHttpAdapter,
  "mock-crm": mockCrmAdapter
} satisfies Record<ProviderId, ProviderAdapter<unknown>>;

export const providerAdapters = Object.values(providerAdapterRegistry);

export const getProviderAdapter = (providerId: ProviderId): ProviderAdapter<unknown> =>
  providerAdapterRegistry[providerId];
