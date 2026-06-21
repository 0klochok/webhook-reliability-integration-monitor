import { createHash } from "node:crypto";

import {
  getProviderAdapter,
  isProviderId,
  type JsonValue,
  type NormalizedEvent,
  type ProviderId
} from "@webhook-monitor/core";
import type { createWebhookEventRepository } from "@webhook-monitor/db";
import { webhookDeliveryQueueName, type DeliveryQueuePort } from "@webhook-monitor/queue";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { ApiConfig } from "../config.js";
import { ApiError } from "../errors.js";
import { createRejectedNormalizedEvent } from "./rejected-events.js";
import {
  createErrorResponse,
  createWebhookSuccessResponse,
  type ApiErrorResponse,
  type WebhookSuccessResponse
} from "./response-shapes.js";

export type WebhookEventRepository = ReturnType<typeof createWebhookEventRepository>;

export interface IngestWebhookDependencies {
  readonly config: ApiConfig;
  readonly webhookEvents: WebhookEventRepository;
  readonly deliveryQueue: DeliveryQueuePort;
  readonly clock?: () => Date;
}

export interface IngestWebhookInput {
  readonly providerParam: string;
  readonly rawBody: string;
  readonly headers: Record<string, string | undefined>;
}

export interface IngestWebhookResult {
  readonly statusCode: ContentfulStatusCode;
  readonly body: WebhookSuccessResponse | ApiErrorResponse;
}

interface JsonParseResult {
  readonly success: boolean;
  readonly data?: unknown;
}

const createRawBodyHash = (rawBody: string): string =>
  createHash("sha256").update(rawBody).digest("hex");

const parseJsonSafely = (rawBody: string): JsonParseResult => {
  try {
    return {
      success: true,
      data: JSON.parse(rawBody) as unknown
    };
  } catch {
    return {
      success: false
    };
  }
};

const issueMessagesFromError = (error: unknown): string[] => {
  if (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray(error.issues)
  ) {
    return error.issues.filter((issue): issue is string => typeof issue === "string");
  }

  return ["Payload failed provider schema validation."];
};

const toHistoryMetadata = (value: JsonValue): JsonValue => value;

const addMilliseconds = (date: Date, milliseconds: number): Date =>
  new Date(date.getTime() + milliseconds);

const createRejectionResponse = (input: {
  readonly statusCode: ContentfulStatusCode;
  readonly code: "invalid_signature" | "invalid_json" | "invalid_payload";
  readonly message: string;
  readonly eventId: string;
  readonly issues?: readonly string[];
}): IngestWebhookResult => ({
  statusCode: input.statusCode,
  body: createErrorResponse({
    code: input.code,
    message: input.message,
    eventId: input.eventId,
    issues: input.issues
  })
});

const persistRejectedEvent = async (
  dependencies: IngestWebhookDependencies,
  input: {
    readonly providerId: ProviderId;
    readonly status: "rejected_invalid_signature" | "rejected_invalid_payload";
    readonly payloadHash: string;
    readonly receivedAt: Date;
    readonly signatureVerificationRequired: boolean;
    readonly parsedPayload?: unknown;
    readonly reasonCode: string;
    readonly message: string;
    readonly metadata: JsonValue;
  }
) => {
  const normalizedEvent = createRejectedNormalizedEvent({
    providerId: input.providerId,
    status: input.status,
    payloadHash: input.payloadHash,
    receivedAt: input.receivedAt,
    signatureVerificationRequired: input.signatureVerificationRequired,
    parsedPayload: input.parsedPayload,
    fallbackReasonCode: input.reasonCode
  });

  try {
    return await dependencies.webhookEvents.createIdempotentWithInitialStatusHistory({
      normalizedEvent,
      currentStatus: input.status,
      initialHistory: {
        reasonCode: input.reasonCode,
        message: input.message,
        metadata: input.metadata,
        createdAt: input.receivedAt
      },
      createdAt: input.receivedAt,
      updatedAt: input.receivedAt
    });
  } catch (cause) {
    throw new ApiError({
      code: "persistence_error",
      statusCode: 500,
      publicMessage: "The webhook rejection could not be persisted.",
      cause
    });
  }
};

const verifySignatureIfRequired = async (
  dependencies: IngestWebhookDependencies,
  input: {
    readonly providerId: ProviderId;
    readonly rawBody: string;
    readonly headers: Record<string, string | undefined>;
    readonly payloadHash: string;
    readonly receivedAt: Date;
  }
): Promise<IngestWebhookResult | undefined> => {
  const adapter = getProviderAdapter(input.providerId);

  if (!adapter.requiresSignatureVerification) {
    return undefined;
  }

  if (!dependencies.config.stripeSampleWebhookSecret) {
    throw new ApiError({
      code: "misconfigured_signature_secret",
      statusCode: 503,
      publicMessage: "Webhook signature verification is not configured for this provider."
    });
  }

  const verification = adapter.signatureVerifier?.verify({
    providerId: input.providerId,
    rawBody: input.rawBody,
    headers: input.headers,
    secret: dependencies.config.stripeSampleWebhookSecret,
    timestampToleranceSeconds: dependencies.config.signatureTimestampToleranceSeconds,
    now: dependencies.clock?.() ?? new Date()
  });

  if (verification?.verified) {
    return undefined;
  }

  const parsedPayload = parseJsonSafely(input.rawBody);
  const reasonCode = verification?.reasonCode ?? "signature_verification_failed";
  const persisted = await persistRejectedEvent(dependencies, {
    providerId: input.providerId,
    status: "rejected_invalid_signature",
    payloadHash: input.payloadHash,
    receivedAt: input.receivedAt,
    signatureVerificationRequired: true,
    parsedPayload: parsedPayload.success ? parsedPayload.data : undefined,
    reasonCode,
    message: "Webhook signature verification failed.",
    metadata: toHistoryMetadata({
      reasonCode,
      payloadHash: input.payloadHash
    })
  });

  return createRejectionResponse({
    statusCode: 401,
    code: "invalid_signature",
    message: "Webhook signature verification failed.",
    eventId: persisted.event.id
  });
};

const parseTrustedJson = async (
  dependencies: IngestWebhookDependencies,
  input: {
    readonly providerId: ProviderId;
    readonly rawBody: string;
    readonly payloadHash: string;
    readonly receivedAt: Date;
    readonly signatureVerificationRequired: boolean;
  }
): Promise<{ readonly parsedPayload: unknown } | IngestWebhookResult> => {
  const parsedPayload = parseJsonSafely(input.rawBody);

  if (parsedPayload.success) {
    return { parsedPayload: parsedPayload.data };
  }

  const persisted = await persistRejectedEvent(dependencies, {
    providerId: input.providerId,
    status: "rejected_invalid_payload",
    payloadHash: input.payloadHash,
    receivedAt: input.receivedAt,
    signatureVerificationRequired: input.signatureVerificationRequired,
    reasonCode: "invalid_json",
    message: "Webhook request body must be valid JSON.",
    metadata: toHistoryMetadata({
      reasonCode: "invalid_json",
      payloadHash: input.payloadHash
    })
  });

  return createRejectionResponse({
    statusCode: 400,
    code: "invalid_json",
    message: "Webhook request body must be valid JSON.",
    eventId: persisted.event.id
  });
};

const normalizeTrustedPayload = async (
  dependencies: IngestWebhookDependencies,
  input: {
    readonly providerId: ProviderId;
    readonly parsedPayload: unknown;
    readonly payloadHash: string;
    readonly headers: Record<string, string | undefined>;
    readonly receivedAt: Date;
    readonly signatureVerificationRequired: boolean;
  }
) => {
  const adapter = getProviderAdapter(input.providerId);

  try {
    const payload = adapter.validatePayload(input.parsedPayload);
    return adapter.normalizeEvent(payload, {
      receivedAt: input.receivedAt,
      headers: input.headers,
      payloadHash: input.payloadHash,
      rawBodyHash: input.payloadHash
    });
  } catch (error) {
    const issues = issueMessagesFromError(error);
    const persisted = await persistRejectedEvent(dependencies, {
      providerId: input.providerId,
      status: "rejected_invalid_payload",
      payloadHash: input.payloadHash,
      receivedAt: input.receivedAt,
      signatureVerificationRequired: input.signatureVerificationRequired,
      parsedPayload: input.parsedPayload,
      reasonCode: "schema_validation_failed",
      message: "Webhook payload failed provider schema validation.",
      metadata: toHistoryMetadata({
        reasonCode: "schema_validation_failed",
        issues: Array.from(issues),
        payloadHash: input.payloadHash
      })
    });

    return createRejectionResponse({
      statusCode: 400,
      code: "invalid_payload",
      message: "Webhook payload failed provider schema validation.",
      eventId: persisted.event.id,
      issues
    });
  }
};

const persistAcceptedEvent = async (
  dependencies: IngestWebhookDependencies,
  input: {
    readonly normalizedEvent: NormalizedEvent;
    readonly receivedAt: Date;
  }
): Promise<IngestWebhookResult> => {
  let createResult: Awaited<
    ReturnType<WebhookEventRepository["createIdempotentWithInitialStatusHistory"]>
  >;

  try {
    createResult = await dependencies.webhookEvents.createIdempotentWithInitialStatusHistory({
      normalizedEvent: input.normalizedEvent,
      currentStatus: "received",
      initialHistory: {
        reasonCode: "webhook_received",
        message: "Webhook event was received.",
        metadata: {
          payloadHash: input.normalizedEvent.payloadHash
        },
        createdAt: input.receivedAt
      },
      createdAt: input.receivedAt,
      updatedAt: input.receivedAt
    });
  } catch (cause) {
    throw new ApiError({
      code: "persistence_error",
      statusCode: 500,
      publicMessage: "The webhook event could not be persisted.",
      cause
    });
  }

  if (!createResult.inserted) {
    try {
      await dependencies.webhookEvents.appendStatusHistory({
        eventId: createResult.event.id,
        fromStatus: createResult.event.currentStatus,
        toStatus: "duplicate_ignored",
        reasonCode: "duplicate_event",
        message: "Duplicate webhook event was ignored.",
        metadata: {
          providerId: input.normalizedEvent.providerId,
          externalEventId: input.normalizedEvent.externalEventId
        },
        createdAt: addMilliseconds(input.receivedAt, 3)
      });
    } catch (cause) {
      throw new ApiError({
        code: "persistence_error",
        statusCode: 500,
        publicMessage: "The duplicate webhook audit entry could not be persisted.",
        eventId: createResult.event.id,
        cause
      });
    }

    return {
      statusCode: 200,
      body: createWebhookSuccessResponse({
        ok: true,
        eventId: createResult.event.id,
        providerId: input.normalizedEvent.providerId,
        externalEventId: input.normalizedEvent.externalEventId,
        status: "duplicate_ignored",
        duplicate: true
      })
    };
  }

  try {
    await dependencies.webhookEvents.transitionStatus({
      eventId: createResult.event.id,
      toStatus: "validated",
      reasonCode: "payload_validated",
      message: "Webhook payload passed provider validation.",
      metadata: {
        providerId: input.normalizedEvent.providerId,
        externalEventId: input.normalizedEvent.externalEventId
      },
      changedAt: addMilliseconds(input.receivedAt, 1)
    });
  } catch (cause) {
    throw new ApiError({
      code: "persistence_error",
      statusCode: 500,
      publicMessage: "The webhook validation status could not be persisted.",
      eventId: createResult.event.id,
      cause
    });
  }

  let enqueueResult: Awaited<ReturnType<DeliveryQueuePort["enqueueDelivery"]>>;
  const queuedAt = addMilliseconds(input.receivedAt, 2);

  try {
    enqueueResult = await dependencies.deliveryQueue.enqueueDelivery({
      eventId: createResult.event.id,
      providerId: input.normalizedEvent.providerId,
      externalEventId: input.normalizedEvent.externalEventId,
      enqueuedAt: queuedAt.toISOString()
    });
  } catch (cause) {
    throw new ApiError({
      code: "queue_enqueue_failed",
      statusCode: 500,
      publicMessage: "The webhook event could not be queued for delivery.",
      eventId: createResult.event.id,
      cause
    });
  }

  try {
    await dependencies.webhookEvents.transitionStatus({
      eventId: createResult.event.id,
      toStatus: "queued",
      reasonCode: "delivery_enqueued",
      message: "Webhook event was accepted by the delivery queue.",
      metadata: {
        queue: webhookDeliveryQueueName,
        queueJobId: enqueueResult.queueJobId
      },
      changedAt: queuedAt
    });
  } catch (cause) {
    throw new ApiError({
      code: "persistence_error",
      statusCode: 500,
      publicMessage: "The webhook queued status could not be persisted.",
      eventId: createResult.event.id,
      cause
    });
  }

  return {
    statusCode: 200,
    body: createWebhookSuccessResponse({
      ok: true,
      eventId: createResult.event.id,
      providerId: input.normalizedEvent.providerId,
      externalEventId: input.normalizedEvent.externalEventId,
      status: "queued",
      duplicate: false
    })
  };
};

export const ingestWebhook = async (
  dependencies: IngestWebhookDependencies,
  input: IngestWebhookInput
): Promise<IngestWebhookResult> => {
  if (!isProviderId(input.providerParam)) {
    return {
      statusCode: 404,
      body: createErrorResponse({
        code: "unsupported_provider",
        message: "Unsupported webhook provider."
      })
    };
  }

  const providerId = input.providerParam;
  const adapter = getProviderAdapter(providerId);
  const receivedAt = dependencies.clock?.() ?? new Date();
  const payloadHash = createRawBodyHash(input.rawBody);

  const signatureResult = await verifySignatureIfRequired(dependencies, {
    providerId,
    rawBody: input.rawBody,
    headers: input.headers,
    payloadHash,
    receivedAt
  });

  if (signatureResult) {
    return signatureResult;
  }

  const parseResult = await parseTrustedJson(dependencies, {
    providerId,
    rawBody: input.rawBody,
    payloadHash,
    receivedAt,
    signatureVerificationRequired: adapter.requiresSignatureVerification
  });

  if ("body" in parseResult) {
    return parseResult;
  }

  const normalizeResult = await normalizeTrustedPayload(dependencies, {
    providerId,
    parsedPayload: parseResult.parsedPayload,
    payloadHash,
    headers: input.headers,
    receivedAt,
    signatureVerificationRequired: adapter.requiresSignatureVerification
  });

  if ("body" in normalizeResult) {
    return normalizeResult;
  }

  return persistAcceptedEvent(dependencies, {
    normalizedEvent: normalizeResult,
    receivedAt
  });
};
