export type ErrorLogLevel = "debug" | "info" | "warn" | "error";

export type AppErrorCode =
  | "unsupported_provider"
  | "invalid_signature"
  | "invalid_json"
  | "invalid_payload"
  | "payload_too_large"
  | "rate_limited"
  | "duplicate_event"
  | "persistence_error"
  | "database_unavailable"
  | "database_connection_failed"
  | "database_migration_required"
  | "queue_unavailable"
  | "queue_connection_failed"
  | "queue_enqueue_failed"
  | "queue_shutdown_failed"
  | "worker_startup_failed"
  | "worker_shutdown_failed"
  | "downstream_retryable_failure"
  | "downstream_permanent_failure"
  | "replay_not_allowed"
  | "replay_enqueue_failed"
  | "config_invalid"
  | "secret_missing"
  | "internal_error"
  | "misconfigured_signature_secret"
  | "invalid_event_id"
  | "invalid_status_filter"
  | "not_found";

export interface ErrorDefinition {
  readonly code: AppErrorCode;
  readonly statusCode: number;
  readonly publicMessage: string;
  readonly retryable: boolean;
  readonly logLevel: ErrorLogLevel;
}

export const errorDefinitions = {
  unsupported_provider: {
    code: "unsupported_provider",
    statusCode: 404,
    publicMessage: "Unsupported webhook provider.",
    retryable: false,
    logLevel: "warn"
  },
  invalid_signature: {
    code: "invalid_signature",
    statusCode: 401,
    publicMessage: "Webhook signature verification failed.",
    retryable: false,
    logLevel: "warn"
  },
  invalid_json: {
    code: "invalid_json",
    statusCode: 400,
    publicMessage: "Webhook request body must be valid JSON.",
    retryable: false,
    logLevel: "warn"
  },
  invalid_payload: {
    code: "invalid_payload",
    statusCode: 400,
    publicMessage: "Webhook payload failed provider schema validation.",
    retryable: false,
    logLevel: "warn"
  },
  payload_too_large: {
    code: "payload_too_large",
    statusCode: 413,
    publicMessage: "Webhook request body is too large.",
    retryable: false,
    logLevel: "warn"
  },
  rate_limited: {
    code: "rate_limited",
    statusCode: 429,
    publicMessage: "Too many webhook requests. Try again later.",
    retryable: true,
    logLevel: "warn"
  },
  duplicate_event: {
    code: "duplicate_event",
    statusCode: 200,
    publicMessage: "Duplicate webhook event was ignored.",
    retryable: false,
    logLevel: "info"
  },
  persistence_error: {
    code: "persistence_error",
    statusCode: 500,
    publicMessage: "The webhook event could not be persisted.",
    retryable: true,
    logLevel: "error"
  },
  database_unavailable: {
    code: "database_unavailable",
    statusCode: 503,
    publicMessage: "Database dependency is unavailable.",
    retryable: true,
    logLevel: "error"
  },
  database_connection_failed: {
    code: "database_connection_failed",
    statusCode: 503,
    publicMessage: "Database connection failed.",
    retryable: true,
    logLevel: "error"
  },
  database_migration_required: {
    code: "database_migration_required",
    statusCode: 503,
    publicMessage: "Database schema is not ready.",
    retryable: true,
    logLevel: "error"
  },
  queue_unavailable: {
    code: "queue_unavailable",
    statusCode: 503,
    publicMessage: "Queue dependency is unavailable.",
    retryable: true,
    logLevel: "error"
  },
  queue_connection_failed: {
    code: "queue_connection_failed",
    statusCode: 503,
    publicMessage: "Queue connection failed.",
    retryable: true,
    logLevel: "error"
  },
  queue_enqueue_failed: {
    code: "queue_enqueue_failed",
    statusCode: 503,
    publicMessage: "The webhook event could not be queued for delivery.",
    retryable: true,
    logLevel: "error"
  },
  queue_shutdown_failed: {
    code: "queue_shutdown_failed",
    statusCode: 500,
    publicMessage: "Queue shutdown failed.",
    retryable: true,
    logLevel: "error"
  },
  worker_startup_failed: {
    code: "worker_startup_failed",
    statusCode: 503,
    publicMessage: "Worker startup failed.",
    retryable: true,
    logLevel: "error"
  },
  worker_shutdown_failed: {
    code: "worker_shutdown_failed",
    statusCode: 500,
    publicMessage: "Worker shutdown failed.",
    retryable: true,
    logLevel: "error"
  },
  downstream_retryable_failure: {
    code: "downstream_retryable_failure",
    statusCode: 502,
    publicMessage: "Downstream delivery failed retryably.",
    retryable: true,
    logLevel: "warn"
  },
  downstream_permanent_failure: {
    code: "downstream_permanent_failure",
    statusCode: 502,
    publicMessage: "Downstream delivery failed permanently.",
    retryable: false,
    logLevel: "error"
  },
  replay_not_allowed: {
    code: "replay_not_allowed",
    statusCode: 409,
    publicMessage: "Manual replay is not allowed for the current event status.",
    retryable: false,
    logLevel: "warn"
  },
  replay_enqueue_failed: {
    code: "replay_enqueue_failed",
    statusCode: 503,
    publicMessage: "Manual replay could not be queued for delivery.",
    retryable: true,
    logLevel: "error"
  },
  config_invalid: {
    code: "config_invalid",
    statusCode: 500,
    publicMessage: "Runtime configuration is invalid.",
    retryable: false,
    logLevel: "error"
  },
  secret_missing: {
    code: "secret_missing",
    statusCode: 500,
    publicMessage: "Required secret configuration is missing.",
    retryable: false,
    logLevel: "error"
  },
  internal_error: {
    code: "internal_error",
    statusCode: 500,
    publicMessage: "The service could not complete the request.",
    retryable: true,
    logLevel: "error"
  },
  misconfigured_signature_secret: {
    code: "misconfigured_signature_secret",
    statusCode: 503,
    publicMessage: "Webhook signature verification is not configured for this provider.",
    retryable: false,
    logLevel: "error"
  },
  invalid_event_id: {
    code: "invalid_event_id",
    statusCode: 400,
    publicMessage: "Event ID must be a valid UUID.",
    retryable: false,
    logLevel: "warn"
  },
  invalid_status_filter: {
    code: "invalid_status_filter",
    statusCode: 400,
    publicMessage: "Unsupported event status filter.",
    retryable: false,
    logLevel: "warn"
  },
  not_found: {
    code: "not_found",
    statusCode: 404,
    publicMessage: "The requested resource was not found.",
    retryable: false,
    logLevel: "warn"
  }
} satisfies Record<AppErrorCode, ErrorDefinition>;

export const getErrorDefinition = (code: AppErrorCode): ErrorDefinition => errorDefinitions[code];

export class OperationalError extends Error {
  readonly code: AppErrorCode;
  readonly publicMessage: string;
  readonly statusCode: number;
  readonly retryable: boolean;
  readonly logLevel: ErrorLogLevel;

  constructor(input: {
    readonly code: AppErrorCode;
    readonly message?: string;
    readonly publicMessage?: string;
    readonly cause?: unknown;
  }) {
    const definition = getErrorDefinition(input.code);
    super(input.message ?? input.publicMessage ?? definition.publicMessage, { cause: input.cause });
    this.name = "OperationalError";
    this.code = input.code;
    this.publicMessage = input.publicMessage ?? definition.publicMessage;
    this.statusCode = definition.statusCode;
    this.retryable = definition.retryable;
    this.logLevel = definition.logLevel;
  }
}
