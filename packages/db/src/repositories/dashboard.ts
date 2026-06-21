import {
  eventStatusSchema,
  type EventStatus,
  type JsonObject,
  type JsonValue
} from "@webhook-monitor/core";
import { asc, desc, eq, inArray, isNotNull, notInArray, sql } from "drizzle-orm";

import type { Database } from "../client.js";
import {
  deadLetterEvents,
  deliveryAttempts,
  eventStatusHistory,
  manualReplays,
  webhookEvents,
  type DeadLetterEvent,
  type DeliveryAttempt,
  type EventStatusHistory,
  type ManualReplay,
  type WebhookEvent
} from "../schema.js";
import { WebhookEventNotFoundError } from "./webhook-events.js";

export const dashboardEventLimitDefault = 50;
export const dashboardEventLimitMax = 100;

const acceptedEventStatusesExcluded: EventStatus[] = [
  "rejected_invalid_signature",
  "rejected_invalid_payload"
];

const failedDashboardStatuses: EventStatus[] = ["failed_retryable", "dead_lettered"];

const replayableStatuses: EventStatus[] = ["dead_lettered", "failed_retryable"];
const replayableStatusSet = new Set<EventStatus>(replayableStatuses);

export type ReplayNotAllowedReasonCode = "event_not_found" | "status_not_replayable";

export class ManualReplayNotAllowedError extends Error {
  readonly eventId: string;
  readonly currentStatus?: EventStatus;
  readonly reasonCode: ReplayNotAllowedReasonCode;

  constructor(input: {
    readonly eventId: string;
    readonly currentStatus?: EventStatus;
    readonly reasonCode: ReplayNotAllowedReasonCode;
  }) {
    super(
      input.currentStatus
        ? `Manual replay is not allowed for event "${input.eventId}" while status is "${input.currentStatus}".`
        : `Manual replay is not allowed for event "${input.eventId}".`
    );
    this.name = "ManualReplayNotAllowedError";
    this.eventId = input.eventId;
    this.currentStatus = input.currentStatus;
    this.reasonCode = input.reasonCode;
  }
}

export interface DashboardEventSummary {
  readonly id: string;
  readonly providerId: WebhookEvent["providerId"];
  readonly externalEventId: string;
  readonly eventType: string;
  readonly currentStatus: EventStatus;
  readonly receivedAt: Date;
  readonly lastSuccessfulAt: Date | null;
}

export interface DashboardSummary {
  readonly totalEventVolume: number;
  readonly successRate: number;
  readonly failedEvents: number;
  readonly retryCount: number;
  readonly deadLetterCount: number;
  readonly lastSuccessfulEvent: DashboardEventSummary | null;
}

export interface DashboardEventListItem extends DashboardEventSummary {
  readonly occurredAt: Date;
  readonly attemptCount: number;
  readonly isDeadLettered: boolean;
}

export interface DashboardDeadLetterListItem {
  readonly id: string;
  readonly eventId: string;
  readonly providerId: WebhookEvent["providerId"];
  readonly externalEventId: string;
  readonly eventType: string;
  readonly currentStatus: EventStatus;
  readonly reasonCode: string;
  readonly errorMessage: string | null;
  readonly finalAttemptNumber: number | null;
  readonly deadLetteredAt: Date;
  readonly isReplayable: boolean;
}

export interface DashboardEventDetail {
  readonly event: Omit<WebhookEvent, "payload">;
  readonly statusHistory: ReadonlyArray<EventStatusHistory>;
  readonly deliveryAttempts: ReadonlyArray<DeliveryAttempt>;
  readonly deadLetterEvent: DeadLetterEvent | null;
  readonly manualReplays: ReadonlyArray<ManualReplay>;
  readonly replayEligibility: ReplayEligibility;
  readonly payloadPreview: string;
}

export interface ReplayEligibility {
  readonly eventId: string;
  readonly currentStatus?: EventStatus;
  readonly replayable: boolean;
  readonly reasonCode?: ReplayNotAllowedReasonCode;
}

export interface ListDashboardEventsInput {
  readonly status?: EventStatus;
  readonly limit?: number;
  readonly offset?: number;
}

export interface ListDashboardDeadLettersInput {
  readonly limit?: number;
  readonly offset?: number;
}

export interface CreateManualReplayRequestInput {
  readonly eventId: string;
  readonly requestedBy: string;
  readonly reason?: string | null;
  readonly requestedAt?: Date;
  readonly metadata?: JsonObject;
}

export interface CreateManualReplayRequestResult {
  readonly event: WebhookEvent;
  readonly manualReplay: ManualReplay;
  readonly initialAttemptNumber: number;
}

export interface MarkManualReplayQueuedInput {
  readonly replayId: string;
  readonly queueJobId: string;
  readonly queuedAt?: Date;
}

export interface MarkManualReplayFailedInput {
  readonly replayId: string;
  readonly errorCode: string;
  readonly errorMessage: string;
  readonly completedAt?: Date;
}

const boundedLimit = (limit: number | undefined): number => {
  if (!Number.isInteger(limit) || limit === undefined) {
    return dashboardEventLimitDefault;
  }

  return Math.min(Math.max(limit, 1), dashboardEventLimitMax);
};

const boundedOffset = (offset: number | undefined): number =>
  Number.isInteger(offset) && offset !== undefined && offset > 0 ? offset : 0;

const payloadPreview = (payload: JsonValue, maxLength = 2_000): string => {
  const serialized = JSON.stringify(payload, null, 2);

  if (serialized.length <= maxLength) {
    return serialized;
  }

  return `${serialized.slice(0, maxLength)}\n... trimmed ...`;
};

const toEventSummary = (event: WebhookEvent): DashboardEventSummary => ({
  id: event.id,
  providerId: event.providerId,
  externalEventId: event.externalEventId,
  eventType: event.eventType,
  currentStatus: event.currentStatus,
  receivedAt: event.receivedAt,
  lastSuccessfulAt: event.lastSuccessfulAt
});

const omitPayload = (event: WebhookEvent): Omit<WebhookEvent, "payload"> => {
  const { payload, ...eventWithoutPayload } = event;
  void payload;
  return eventWithoutPayload;
};

const isReplayableStatus = (status: EventStatus): boolean => replayableStatusSet.has(status);

export const parseDashboardStatusFilter = (input: string | undefined): EventStatus | undefined => {
  if (!input) {
    return undefined;
  }

  const result = eventStatusSchema.safeParse(input);
  return result.success ? result.data : undefined;
};

export const createDashboardRepository = (db: Database) => {
  const getReplayEligibility = async (eventId: string): Promise<ReplayEligibility> => {
    const [event] = await db
      .select({
        id: webhookEvents.id,
        currentStatus: webhookEvents.currentStatus
      })
      .from(webhookEvents)
      .where(eq(webhookEvents.id, eventId))
      .limit(1);

    if (!event) {
      return {
        eventId,
        replayable: false,
        reasonCode: "event_not_found"
      };
    }

    if (isReplayableStatus(event.currentStatus)) {
      return {
        eventId,
        currentStatus: event.currentStatus,
        replayable: true
      };
    }

    return {
      eventId,
      currentStatus: event.currentStatus,
      replayable: false,
      reasonCode: "status_not_replayable"
    };
  };

  return {
    getDashboardSummary: async (): Promise<DashboardSummary> => {
      const [totalRow] = await db
        .select({
          count: sql<number>`count(*)::int`
        })
        .from(webhookEvents);
      const [acceptedRow] = await db
        .select({
          count: sql<number>`count(*)::int`
        })
        .from(webhookEvents)
        .where(notInArray(webhookEvents.currentStatus, acceptedEventStatusesExcluded));
      const [deliveredRow] = await db
        .select({
          count: sql<number>`count(*)::int`
        })
        .from(webhookEvents)
        .where(eq(webhookEvents.currentStatus, "delivered"));
      const [failedRow] = await db
        .select({
          count: sql<number>`count(*)::int`
        })
        .from(webhookEvents)
        .where(inArray(webhookEvents.currentStatus, failedDashboardStatuses));
      const [retryRow] = await db
        .select({
          count: sql<number>`count(*)::int`
        })
        .from(deliveryAttempts)
        .where(sql`${deliveryAttempts.attemptNumber} > 1`);
      const [deadLetterRow] = await db
        .select({
          count: sql<number>`count(*)::int`
        })
        .from(deadLetterEvents);
      const [lastSuccessfulEvent] = await db
        .select()
        .from(webhookEvents)
        .where(isNotNull(webhookEvents.lastSuccessfulAt))
        .orderBy(desc(webhookEvents.lastSuccessfulAt), desc(webhookEvents.receivedAt))
        .limit(1);

      const acceptedEvents = acceptedRow?.count ?? 0;
      const deliveredEvents = deliveredRow?.count ?? 0;

      return {
        totalEventVolume: totalRow?.count ?? 0,
        successRate: acceptedEvents === 0 ? 0 : deliveredEvents / acceptedEvents,
        failedEvents: failedRow?.count ?? 0,
        retryCount: retryRow?.count ?? 0,
        deadLetterCount: deadLetterRow?.count ?? 0,
        lastSuccessfulEvent: lastSuccessfulEvent ? toEventSummary(lastSuccessfulEvent) : null
      };
    },

    listDashboardEvents: async (
      input: ListDashboardEventsInput = {}
    ): Promise<ReadonlyArray<DashboardEventListItem>> => {
      const rows = await db
        .select({
          id: webhookEvents.id,
          providerId: webhookEvents.providerId,
          externalEventId: webhookEvents.externalEventId,
          eventType: webhookEvents.eventType,
          currentStatus: webhookEvents.currentStatus,
          occurredAt: webhookEvents.occurredAt,
          receivedAt: webhookEvents.receivedAt,
          lastSuccessfulAt: webhookEvents.lastSuccessfulAt,
          attemptCount: sql<number>`count(${deliveryAttempts.id})::int`,
          deadLetterId: deadLetterEvents.id
        })
        .from(webhookEvents)
        .leftJoin(deliveryAttempts, eq(deliveryAttempts.eventId, webhookEvents.id))
        .leftJoin(deadLetterEvents, eq(deadLetterEvents.eventId, webhookEvents.id))
        .where(input.status ? eq(webhookEvents.currentStatus, input.status) : undefined)
        .groupBy(webhookEvents.id, deadLetterEvents.id)
        .orderBy(desc(webhookEvents.receivedAt), desc(webhookEvents.createdAt))
        .limit(boundedLimit(input.limit))
        .offset(boundedOffset(input.offset));

      return rows.map((row) => ({
        id: row.id,
        providerId: row.providerId,
        externalEventId: row.externalEventId,
        eventType: row.eventType,
        currentStatus: row.currentStatus,
        occurredAt: row.occurredAt,
        receivedAt: row.receivedAt,
        lastSuccessfulAt: row.lastSuccessfulAt,
        attemptCount: row.attemptCount,
        isDeadLettered: row.deadLetterId !== null
      }));
    },

    getEventDetail: async (eventId: string): Promise<DashboardEventDetail | null> => {
      const [event] = await db
        .select()
        .from(webhookEvents)
        .where(eq(webhookEvents.id, eventId))
        .limit(1);

      if (!event) {
        return null;
      }

      const [statusHistory, attempts, deadLetterRows, replayRows, replayEligibility] =
        await Promise.all([
          db
            .select()
            .from(eventStatusHistory)
            .where(eq(eventStatusHistory.eventId, eventId))
            .orderBy(asc(eventStatusHistory.createdAt), asc(eventStatusHistory.id)),
          db
            .select()
            .from(deliveryAttempts)
            .where(eq(deliveryAttempts.eventId, eventId))
            .orderBy(asc(deliveryAttempts.attemptNumber), asc(deliveryAttempts.createdAt)),
          db.select().from(deadLetterEvents).where(eq(deadLetterEvents.eventId, eventId)).limit(1),
          db
            .select()
            .from(manualReplays)
            .where(eq(manualReplays.originalEventId, eventId))
            .orderBy(desc(manualReplays.requestedAt), desc(manualReplays.createdAt)),
          getReplayEligibility(eventId)
        ]);

      return {
        event: omitPayload(event),
        statusHistory,
        deliveryAttempts: attempts,
        deadLetterEvent: deadLetterRows[0] ?? null,
        manualReplays: replayRows,
        replayEligibility,
        payloadPreview: payloadPreview(event.payload)
      };
    },

    listDashboardDeadLetters: async (
      input: ListDashboardDeadLettersInput = {}
    ): Promise<ReadonlyArray<DashboardDeadLetterListItem>> => {
      const rows = await db
        .select({
          id: deadLetterEvents.id,
          eventId: deadLetterEvents.eventId,
          providerId: webhookEvents.providerId,
          externalEventId: webhookEvents.externalEventId,
          eventType: webhookEvents.eventType,
          currentStatus: webhookEvents.currentStatus,
          reasonCode: deadLetterEvents.reasonCode,
          errorMessage: deadLetterEvents.errorMessage,
          finalAttemptNumber: deadLetterEvents.finalAttemptNumber,
          deadLetteredAt: deadLetterEvents.deadLetteredAt
        })
        .from(deadLetterEvents)
        .innerJoin(webhookEvents, eq(webhookEvents.id, deadLetterEvents.eventId))
        .orderBy(desc(deadLetterEvents.deadLetteredAt), desc(deadLetterEvents.createdAt))
        .limit(boundedLimit(input.limit))
        .offset(boundedOffset(input.offset));

      return rows.map((row) => ({
        ...row,
        isReplayable: isReplayableStatus(row.currentStatus)
      }));
    },

    getReplayEligibility,

    createManualReplayRequest: async (
      input: CreateManualReplayRequestInput
    ): Promise<CreateManualReplayRequestResult> =>
      db.transaction(async (tx) => {
        const [event] = await tx
          .select()
          .from(webhookEvents)
          .where(eq(webhookEvents.id, input.eventId))
          .limit(1);

        if (!event) {
          throw new WebhookEventNotFoundError(input.eventId);
        }

        if (!isReplayableStatus(event.currentStatus)) {
          throw new ManualReplayNotAllowedError({
            eventId: event.id,
            currentStatus: event.currentStatus,
            reasonCode: "status_not_replayable"
          });
        }

        const requestedAt = input.requestedAt ?? new Date();
        const [manualReplay] = await tx
          .insert(manualReplays)
          .values({
            originalEventId: event.id,
            requestedBy: input.requestedBy,
            reason: input.reason ?? null,
            status: "requested",
            metadata: input.metadata ?? {
              source: "local_dashboard"
            },
            requestedAt,
            createdAt: requestedAt
          })
          .returning();

        if (!manualReplay) {
          throw new Error("Failed to create manual replay request.");
        }

        await tx.insert(eventStatusHistory).values({
          eventId: event.id,
          fromStatus: event.currentStatus,
          toStatus: "replayed",
          reasonCode: "manual_replay_requested",
          message: "Manual replay was requested from the local dashboard.",
          metadata: {
            manualReplayId: manualReplay.id,
            requestedBy: input.requestedBy,
            reason: input.reason ?? null
          },
          createdAt: requestedAt
        });

        const [latestAttempt] = await tx
          .select({
            attemptNumber: deliveryAttempts.attemptNumber
          })
          .from(deliveryAttempts)
          .where(eq(deliveryAttempts.eventId, event.id))
          .orderBy(desc(deliveryAttempts.attemptNumber), desc(deliveryAttempts.createdAt))
          .limit(1);
        const initialAttemptNumber = (latestAttempt?.attemptNumber ?? 0) + 1;

        return {
          event,
          manualReplay,
          initialAttemptNumber
        };
      }),

    markManualReplayQueued: async (input: MarkManualReplayQueuedInput): Promise<ManualReplay> => {
      const queuedAt = input.queuedAt ?? new Date();
      const [manualReplay] = await db
        .update(manualReplays)
        .set({
          status: "queued",
          metadata: {
            queueJobId: input.queueJobId,
            queuedAt: queuedAt.toISOString()
          }
        })
        .where(eq(manualReplays.id, input.replayId))
        .returning();

      if (!manualReplay) {
        throw new Error(`Manual replay "${input.replayId}" was not found.`);
      }

      return manualReplay;
    },

    markManualReplayFailed: async (input: MarkManualReplayFailedInput): Promise<ManualReplay> => {
      const completedAt = input.completedAt ?? new Date();
      const [manualReplay] = await db
        .update(manualReplays)
        .set({
          status: "failed",
          completedAt,
          metadata: {
            errorCode: input.errorCode,
            errorMessage: input.errorMessage
          }
        })
        .where(eq(manualReplays.id, input.replayId))
        .returning();

      if (!manualReplay) {
        throw new Error(`Manual replay "${input.replayId}" was not found.`);
      }

      return manualReplay;
    }
  };
};
