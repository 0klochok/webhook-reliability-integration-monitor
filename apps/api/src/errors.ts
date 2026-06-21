import type { ContentfulStatusCode } from "hono/utils/http-status";

export type ApiErrorCode =
  | "unsupported_provider"
  | "invalid_signature"
  | "invalid_json"
  | "invalid_payload"
  | "persistence_error"
  | "queue_enqueue_failed"
  | "misconfigured_signature_secret"
  | "not_found"
  | "internal_error";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode: ContentfulStatusCode;
  readonly publicMessage: string;
  readonly eventId?: string;
  readonly issues?: readonly string[];

  constructor(input: {
    readonly code: ApiErrorCode;
    readonly statusCode: ContentfulStatusCode;
    readonly publicMessage: string;
    readonly eventId?: string;
    readonly issues?: readonly string[];
    readonly cause?: unknown;
  }) {
    super(input.publicMessage, { cause: input.cause });
    this.name = "ApiError";
    this.code = input.code;
    this.statusCode = input.statusCode;
    this.publicMessage = input.publicMessage;
    this.eventId = input.eventId;
    this.issues = input.issues;
  }
}

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  return new ApiError({
    code: "internal_error",
    statusCode: 500,
    publicMessage: "The API could not complete the request."
  });
};
