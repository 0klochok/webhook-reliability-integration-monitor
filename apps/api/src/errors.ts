import {
  ConfigValidationError,
  OperationalError,
  getErrorDefinition,
  type AppErrorCode
} from "@webhook-monitor/core";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export type ApiErrorCode = AppErrorCode;

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode: ContentfulStatusCode;
  readonly publicMessage: string;
  readonly eventId?: string;
  readonly issues?: readonly string[];

  constructor(input: {
    readonly code: ApiErrorCode;
    readonly statusCode?: ContentfulStatusCode;
    readonly publicMessage?: string;
    readonly eventId?: string;
    readonly issues?: readonly string[];
    readonly cause?: unknown;
  }) {
    const definition = getErrorDefinition(input.code);
    const publicMessage = input.publicMessage ?? definition.publicMessage;

    super(publicMessage, { cause: input.cause });
    this.name = "ApiError";
    this.code = input.code;
    this.statusCode = input.statusCode ?? (definition.statusCode as ContentfulStatusCode);
    this.publicMessage = publicMessage;
    this.eventId = input.eventId;
    this.issues = input.issues;
  }
}

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof OperationalError) {
    return new ApiError({
      code: error.code,
      statusCode: error.statusCode as ContentfulStatusCode,
      publicMessage: error.publicMessage,
      cause: error
    });
  }

  if (error instanceof ConfigValidationError) {
    return new ApiError({
      code: "config_invalid",
      statusCode: 500,
      publicMessage: "Runtime configuration is invalid.",
      issues: error.issues.map((issue) => `${issue.key}: ${issue.message}`),
      cause: error
    });
  }

  return new ApiError({
    code: "internal_error",
    statusCode: 500
  });
};
