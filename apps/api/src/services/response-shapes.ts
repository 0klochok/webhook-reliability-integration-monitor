import type { ApiErrorCode } from "../errors.js";

export interface WebhookSuccessResponse {
  readonly ok: true;
  readonly eventId: string;
  readonly providerId: string;
  readonly externalEventId: string;
  readonly status: "queued" | "duplicate_ignored";
  readonly duplicate: boolean;
}

export interface ApiErrorResponse {
  readonly ok: false;
  readonly error: {
    readonly code: ApiErrorCode;
    readonly message: string;
    readonly issues?: readonly string[];
  };
  readonly eventId?: string;
  readonly correlationId?: string;
}

export const createWebhookSuccessResponse = (
  input: WebhookSuccessResponse
): WebhookSuccessResponse => input;

export const createErrorResponse = (input: {
  readonly code: ApiErrorCode;
  readonly message: string;
  readonly eventId?: string;
  readonly correlationId?: string;
  readonly issues?: readonly string[];
}): ApiErrorResponse => ({
  ok: false,
  error: {
    code: input.code,
    message: input.message,
    issues: input.issues
  },
  eventId: input.eventId,
  correlationId: input.correlationId
});
