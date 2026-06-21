import {
  calculateRetryDelayMs,
  isTerminalStatus,
  type EventStatus,
  type JsonObject,
  type JsonValue,
  type RetryPolicy
} from "@webhook-monitor/core";
import type {
  createDeadLetterEventsRepository,
  createDeliveryAttemptsRepository,
  createManualReplaysRepository,
  createWebhookEventRepository,
  WebhookEvent
} from "@webhook-monitor/db";
import type { DeliveryJobData } from "@webhook-monitor/queue";

import {
  MissingWebhookEventError,
  PermanentMockDeliveryError,
  RetryableMockDeliveryError
} from "./errors.js";
import type {
  MockDownstreamClient,
  MockDownstreamDeliveryResult
} from "./mock-downstream-client.js";

export type WebhookEventRepository = ReturnType<typeof createWebhookEventRepository>;
export type DeliveryAttemptsRepository = ReturnType<typeof createDeliveryAttemptsRepository>;
export type DeadLetterEventsRepository = ReturnType<typeof createDeadLetterEventsRepository>;
export type ManualReplaysRepository = ReturnType<typeof createManualReplaysRepository>;

export interface DeliveryProcessorDependencies {
  readonly webhookEvents: WebhookEventRepository;
  readonly deliveryAttempts: DeliveryAttemptsRepository;
  readonly deadLetterEvents: DeadLetterEventsRepository;
  readonly manualReplays: ManualReplaysRepository;
  readonly downstreamClient: MockDownstreamClient;
  readonly retryPolicy: RetryPolicy;
  readonly targetUrl: string;
  readonly clock?: () => Date;
}

export interface DeliveryProcessorJob {
  readonly id?: string;
  readonly data: DeliveryJobData;
  readonly attemptsMade: number;
}

export type DeliveryProcessorResult =
  | {
      readonly outcome: "delivered";
      readonly eventId: string;
      readonly attemptNumber: number;
    }
  | {
      readonly outcome: "skipped_terminal_status" | "duplicate_attempt_ignored";
      readonly eventId: string;
      readonly status?: EventStatus;
      readonly attemptNumber?: number;
    };

const getJobAttemptNumber = (job: DeliveryProcessorJob): number => job.attemptsMade + 1;

const isReplayJob = (job: DeliveryProcessorJob): boolean => job.data.manualReplayId !== undefined;

const getAttemptNumber = async (
  dependencies: DeliveryProcessorDependencies,
  job: DeliveryProcessorJob,
  eventId: string
): Promise<number> => {
  if (!isReplayJob(job)) {
    return getJobAttemptNumber(job);
  }

  if (job.data.initialAttemptNumber) {
    return job.data.initialAttemptNumber + job.attemptsMade;
  }

  const latestAttempt = await dependencies.deliveryAttempts.getLatestAttemptForEvent(eventId);
  return (latestAttempt?.attemptNumber ?? 0) + 1;
};

const getDurationMs = (startedAt: Date, completedAt: Date): number =>
  Math.max(0, completedAt.getTime() - startedAt.getTime());

const toFailureMessage = (result: Extract<MockDownstreamDeliveryResult, { ok: false }>): string =>
  result.errorMessage;

const createFailureMetadata = (input: {
  readonly job: DeliveryProcessorJob;
  readonly attemptNumber: number;
  readonly jobAttemptNumber: number;
  readonly result: Extract<MockDownstreamDeliveryResult, { ok: false }>;
}): JsonObject => ({
  queueJobId: input.job.id ?? null,
  attemptNumber: input.attemptNumber,
  jobAttemptNumber: input.jobAttemptNumber,
  manualReplayId: input.job.data.manualReplayId ?? null,
  httpStatusCode: input.result.httpStatusCode,
  errorCode: input.result.errorCode
});

const createSuccessMetadata = (input: {
  readonly job: DeliveryProcessorJob;
  readonly attemptNumber: number;
  readonly jobAttemptNumber: number;
  readonly httpStatusCode: number;
}): JsonObject => ({
  queueJobId: input.job.id ?? null,
  attemptNumber: input.attemptNumber,
  jobAttemptNumber: input.jobAttemptNumber,
  manualReplayId: input.job.data.manualReplayId ?? null,
  httpStatusCode: input.httpStatusCode
});

const markManualReplayCompleted = async (
  dependencies: DeliveryProcessorDependencies,
  input: {
    readonly job: DeliveryProcessorJob;
    readonly completedAt: Date;
    readonly attemptNumber: number;
  }
): Promise<void> => {
  if (!input.job.data.manualReplayId) {
    return;
  }

  await dependencies.manualReplays.markReplayCompleted(
    input.job.data.manualReplayId,
    input.completedAt,
    {
      queueJobId: input.job.id ?? null,
      attemptNumber: input.attemptNumber
    }
  );
};

const markManualReplayFailed = async (
  dependencies: DeliveryProcessorDependencies,
  input: {
    readonly job: DeliveryProcessorJob;
    readonly completedAt: Date;
    readonly attemptNumber: number;
    readonly errorCode: string;
    readonly errorMessage: string;
  }
): Promise<void> => {
  if (!input.job.data.manualReplayId) {
    return;
  }

  await dependencies.manualReplays.markReplayFailed(
    input.job.data.manualReplayId,
    input.completedAt,
    {
      queueJobId: input.job.id ?? null,
      attemptNumber: input.attemptNumber,
      errorCode: input.errorCode,
      errorMessage: input.errorMessage
    }
  );
};

const deadLetterEvent = async (
  dependencies: DeliveryProcessorDependencies,
  input: {
    readonly event: WebhookEvent;
    readonly attemptNumber: number;
    readonly reasonCode: string;
    readonly errorMessage: string;
    readonly deadLetteredAt: Date;
    readonly metadata: JsonValue;
  }
): Promise<void> => {
  await dependencies.deadLetterEvents.createOrUpdateDeadLetterEvent({
    eventId: input.event.id,
    reasonCode: input.reasonCode,
    errorMessage: input.errorMessage,
    finalAttemptNumber: input.attemptNumber,
    payloadSnapshot: input.event.payload,
    deadLetteredAt: input.deadLetteredAt,
    createdAt: input.deadLetteredAt
  });

  await dependencies.webhookEvents.transitionStatus({
    eventId: input.event.id,
    toStatus: "dead_lettered",
    reasonCode: input.reasonCode,
    message: "Webhook event was moved to the dead-letter list.",
    metadata: input.metadata,
    changedAt: input.deadLetteredAt
  });
};

const handleSuccess = async (
  dependencies: DeliveryProcessorDependencies,
  input: {
    readonly event: WebhookEvent;
    readonly job: DeliveryProcessorJob;
    readonly attemptId: string;
    readonly attemptNumber: number;
    readonly jobAttemptNumber: number;
    readonly startedAt: Date;
    readonly result: Extract<MockDownstreamDeliveryResult, { ok: true }>;
  }
): Promise<DeliveryProcessorResult> => {
  const completedAt = dependencies.clock?.() ?? new Date();

  await dependencies.deliveryAttempts.updateDeliveryAttemptResult({
    attemptId: input.attemptId,
    status: "succeeded",
    httpStatusCode: input.result.httpStatusCode,
    durationMs: getDurationMs(input.startedAt, completedAt),
    completedAt
  });

  await dependencies.webhookEvents.transitionStatus({
    eventId: input.event.id,
    toStatus: "delivered",
    reasonCode: "delivery_succeeded",
    message: "Webhook event was delivered to the mock downstream target.",
    metadata: createSuccessMetadata({
      job: input.job,
      attemptNumber: input.attemptNumber,
      jobAttemptNumber: input.jobAttemptNumber,
      httpStatusCode: input.result.httpStatusCode
    }),
    changedAt: completedAt
  });

  await markManualReplayCompleted(dependencies, {
    job: input.job,
    completedAt,
    attemptNumber: input.attemptNumber
  });

  return {
    outcome: "delivered",
    eventId: input.event.id,
    attemptNumber: input.attemptNumber
  };
};

const handleRetryableFailure = async (
  dependencies: DeliveryProcessorDependencies,
  input: {
    readonly event: WebhookEvent;
    readonly job: DeliveryProcessorJob;
    readonly attemptId: string;
    readonly attemptNumber: number;
    readonly jobAttemptNumber: number;
    readonly startedAt: Date;
    readonly result: Extract<MockDownstreamDeliveryResult, { ok: false; retryable: true }>;
  }
): Promise<never> => {
  const completedAt = dependencies.clock?.() ?? new Date();
  const hasAttemptsRemaining = input.jobAttemptNumber < dependencies.retryPolicy.maxAttempts;
  const nextRetryAt = hasAttemptsRemaining
    ? new Date(
        completedAt.getTime() +
          calculateRetryDelayMs(input.jobAttemptNumber, dependencies.retryPolicy)
      )
    : null;

  await dependencies.deliveryAttempts.updateDeliveryAttemptResult({
    attemptId: input.attemptId,
    status: "failed_retryable",
    httpStatusCode: input.result.httpStatusCode,
    errorCode: input.result.errorCode,
    errorMessage: input.result.errorMessage,
    durationMs: getDurationMs(input.startedAt, completedAt),
    nextRetryAt,
    completedAt
  });

  if (hasAttemptsRemaining) {
    await dependencies.webhookEvents.transitionStatus({
      eventId: input.event.id,
      toStatus: "retry_scheduled",
      reasonCode: "delivery_retry_scheduled",
      message: "Mock downstream delivery failed retryably and will be retried.",
      metadata: {
        ...createFailureMetadata(input),
        nextRetryAt: nextRetryAt?.toISOString() ?? null
      },
      changedAt: completedAt
    });

    throw new RetryableMockDeliveryError(toFailureMessage(input.result));
  }

  await deadLetterEvent(dependencies, {
    event: input.event,
    attemptNumber: input.attemptNumber,
    reasonCode: "max_attempts_exhausted",
    errorMessage: input.result.errorMessage,
    deadLetteredAt: completedAt,
    metadata: createFailureMetadata(input)
  });

  await markManualReplayFailed(dependencies, {
    job: input.job,
    completedAt,
    attemptNumber: input.attemptNumber,
    errorCode: input.result.errorCode,
    errorMessage: input.result.errorMessage
  });

  throw new RetryableMockDeliveryError(input.result.errorMessage, "max_attempts_exhausted");
};

const handlePermanentFailure = async (
  dependencies: DeliveryProcessorDependencies,
  input: {
    readonly event: WebhookEvent;
    readonly job: DeliveryProcessorJob;
    readonly attemptId: string;
    readonly attemptNumber: number;
    readonly jobAttemptNumber: number;
    readonly startedAt: Date;
    readonly result: Extract<MockDownstreamDeliveryResult, { ok: false; retryable: false }>;
  }
): Promise<never> => {
  const completedAt = dependencies.clock?.() ?? new Date();

  await dependencies.deliveryAttempts.updateDeliveryAttemptResult({
    attemptId: input.attemptId,
    status: "failed_permanent",
    httpStatusCode: input.result.httpStatusCode,
    errorCode: input.result.errorCode,
    errorMessage: input.result.errorMessage,
    durationMs: getDurationMs(input.startedAt, completedAt),
    completedAt
  });

  await deadLetterEvent(dependencies, {
    event: input.event,
    attemptNumber: input.attemptNumber,
    reasonCode: "permanent_delivery_failure",
    errorMessage: input.result.errorMessage,
    deadLetteredAt: completedAt,
    metadata: createFailureMetadata(input)
  });

  await markManualReplayFailed(dependencies, {
    job: input.job,
    completedAt,
    attemptNumber: input.attemptNumber,
    errorCode: input.result.errorCode,
    errorMessage: input.result.errorMessage
  });

  throw new PermanentMockDeliveryError(input.result.errorMessage);
};

export const processDeliveryJob = async (
  dependencies: DeliveryProcessorDependencies,
  job: DeliveryProcessorJob
): Promise<DeliveryProcessorResult> => {
  const event = await dependencies.webhookEvents.getById(job.data.eventId);

  if (!event) {
    throw new MissingWebhookEventError(job.data.eventId);
  }

  if (
    isTerminalStatus(event.currentStatus) &&
    !(isReplayJob(job) && event.currentStatus === "dead_lettered")
  ) {
    return {
      outcome: "skipped_terminal_status",
      eventId: event.id,
      status: event.currentStatus
    };
  }

  const attemptNumber = await getAttemptNumber(dependencies, job, event.id);
  const jobAttemptNumber = getJobAttemptNumber(job);
  const startedAt = dependencies.clock?.() ?? new Date();
  const attemptResult = await dependencies.deliveryAttempts.createOrGetDeliveryAttempt({
    eventId: event.id,
    attemptNumber,
    status: "running",
    targetUrl: dependencies.targetUrl,
    startedAt,
    createdAt: startedAt
  });

  if (!attemptResult.inserted) {
    return {
      outcome: "duplicate_attempt_ignored",
      eventId: event.id,
      status: event.currentStatus,
      attemptNumber
    };
  }

  await dependencies.webhookEvents.transitionStatus({
    eventId: event.id,
    toStatus: "processing",
    reasonCode: "delivery_attempt_started",
    message: "Worker started mock downstream delivery.",
    metadata: {
      queueJobId: job.id ?? null,
      attemptNumber,
      jobAttemptNumber,
      manualReplayId: job.data.manualReplayId ?? null,
      targetUrl: dependencies.targetUrl
    },
    changedAt: startedAt
  });

  const deliveryResult = await dependencies.downstreamClient.deliver({
    event,
    attemptNumber,
    targetUrl: dependencies.targetUrl
  });

  if (deliveryResult.ok) {
    return handleSuccess(dependencies, {
      event,
      job,
      attemptId: attemptResult.attempt.id,
      attemptNumber,
      jobAttemptNumber,
      startedAt,
      result: deliveryResult
    });
  }

  if (deliveryResult.retryable) {
    return handleRetryableFailure(dependencies, {
      event,
      job,
      attemptId: attemptResult.attempt.id,
      attemptNumber,
      jobAttemptNumber,
      startedAt,
      result: deliveryResult
    });
  }

  return handlePermanentFailure(dependencies, {
    event,
    job,
    attemptId: attemptResult.attempt.id,
    attemptNumber,
    jobAttemptNumber,
    startedAt,
    result: deliveryResult
  });
};
