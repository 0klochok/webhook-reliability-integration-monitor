import type { EventStatus, JsonValue, NormalizedEvent } from "@webhook-monitor/core";
import { and, asc, desc, eq } from "drizzle-orm";

import type { Database } from "../client.js";
import {
  eventStatusHistory,
  webhookEvents,
  type EventStatusHistory,
  type NewWebhookEvent,
  type WebhookEvent
} from "../schema.js";

export class WebhookEventNotFoundError extends Error {
  constructor(eventId: string) {
    super(`Webhook event "${eventId}" was not found.`);
    this.name = "WebhookEventNotFoundError";
  }
}

export interface StatusHistoryDetails {
  readonly reasonCode?: string | null;
  readonly message?: string | null;
  readonly metadata?: JsonValue;
  readonly createdAt?: Date;
}

export interface CreateWebhookEventInput {
  readonly normalizedEvent: NormalizedEvent;
  readonly currentStatus?: EventStatus;
  readonly lastSuccessfulAt?: Date | null;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface CreateWebhookEventWithInitialStatusInput extends CreateWebhookEventInput {
  readonly initialHistory?: StatusHistoryDetails;
}

export interface AppendStatusHistoryInput extends StatusHistoryDetails {
  readonly eventId: string;
  readonly fromStatus?: EventStatus | null;
  readonly toStatus: EventStatus;
}

export interface TransitionWebhookEventStatusInput extends StatusHistoryDetails {
  readonly eventId: string;
  readonly toStatus: EventStatus;
  readonly changedAt?: Date;
}

export interface IdempotentCreateWebhookEventResult {
  readonly inserted: boolean;
  readonly event: WebhookEvent;
}

export interface TransitionWebhookEventStatusResult {
  readonly event: WebhookEvent;
  readonly history: EventStatusHistory;
}

const toWebhookEventInsert = (input: CreateWebhookEventInput): NewWebhookEvent => {
  const now = input.createdAt ?? new Date();
  const normalizedEvent = input.normalizedEvent;
  const currentStatus = input.currentStatus ?? "received";

  return {
    providerId: normalizedEvent.providerId,
    externalEventId: normalizedEvent.externalEventId,
    eventType: normalizedEvent.eventType,
    currentStatus,
    occurredAt: normalizedEvent.occurredAt,
    receivedAt: normalizedEvent.receivedAt,
    idempotencyKey: normalizedEvent.idempotencyKey,
    payloadHash: normalizedEvent.payloadHash,
    payload: normalizedEvent.payload,
    signatureVerificationRequired: normalizedEvent.signatureVerificationRequired,
    schemaVersion: normalizedEvent.schemaVersion,
    lastSuccessfulAt: input.lastSuccessfulAt ?? null,
    createdAt: now,
    updatedAt: input.updatedAt ?? now
  };
};

const expectSingleWebhookEvent = (
  event: WebhookEvent | undefined,
  eventId: string
): WebhookEvent => {
  if (!event) {
    throw new WebhookEventNotFoundError(eventId);
  }

  return event;
};

export const createWebhookEventRepository = (db: Database) => {
  const getById = async (id: string): Promise<WebhookEvent | undefined> => {
    const [event] = await db.select().from(webhookEvents).where(eq(webhookEvents.id, id)).limit(1);
    return event;
  };

  const getByProviderAndExternalEventId = async (
    providerId: NormalizedEvent["providerId"],
    externalEventId: string
  ): Promise<WebhookEvent | undefined> => {
    const [event] = await db
      .select()
      .from(webhookEvents)
      .where(
        and(
          eq(webhookEvents.providerId, providerId),
          eq(webhookEvents.externalEventId, externalEventId)
        )
      )
      .limit(1);

    return event;
  };

  const appendStatusHistory = async (
    input: AppendStatusHistoryInput
  ): Promise<EventStatusHistory> => {
    const [history] = await db
      .insert(eventStatusHistory)
      .values({
        eventId: input.eventId,
        fromStatus: input.fromStatus ?? null,
        toStatus: input.toStatus,
        reasonCode: input.reasonCode ?? null,
        message: input.message ?? null,
        metadata: input.metadata,
        createdAt: input.createdAt ?? new Date()
      })
      .returning();

    if (!history) {
      throw new Error("Failed to append event status history.");
    }

    return history;
  };

  return {
    create: async (input: CreateWebhookEventInput): Promise<WebhookEvent> => {
      const [event] = await db
        .insert(webhookEvents)
        .values(toWebhookEventInsert(input))
        .returning();

      if (!event) {
        throw new Error("Failed to create webhook event.");
      }

      return event;
    },

    createWithInitialStatusHistory: async (
      input: CreateWebhookEventWithInitialStatusInput
    ): Promise<TransitionWebhookEventStatusResult> =>
      db.transaction(async (tx) => {
        const [event] = await tx
          .insert(webhookEvents)
          .values(toWebhookEventInsert(input))
          .returning();

        if (!event) {
          throw new Error("Failed to create webhook event.");
        }

        const [history] = await tx
          .insert(eventStatusHistory)
          .values({
            eventId: event.id,
            fromStatus: null,
            toStatus: event.currentStatus,
            reasonCode: input.initialHistory?.reasonCode ?? null,
            message: input.initialHistory?.message ?? null,
            metadata: input.initialHistory?.metadata,
            createdAt: input.initialHistory?.createdAt ?? event.createdAt
          })
          .returning();

        if (!history) {
          throw new Error("Failed to create initial event status history.");
        }

        return { event, history };
      }),

    createIdempotent: async (
      input: CreateWebhookEventInput
    ): Promise<IdempotentCreateWebhookEventResult> => {
      const [insertedEvent] = await db
        .insert(webhookEvents)
        .values(toWebhookEventInsert(input))
        .onConflictDoNothing({
          target: [webhookEvents.providerId, webhookEvents.externalEventId]
        })
        .returning();

      if (insertedEvent) {
        return { inserted: true, event: insertedEvent };
      }

      const existingEvent = await getByProviderAndExternalEventId(
        input.normalizedEvent.providerId,
        input.normalizedEvent.externalEventId
      );

      if (!existingEvent) {
        throw new Error("Idempotent create conflict occurred but no existing event was found.");
      }

      return { inserted: false, event: existingEvent };
    },

    getById,

    getByProviderAndExternalEventId,

    listRecent: async (limit = 20): Promise<ReadonlyArray<WebhookEvent>> =>
      db.select().from(webhookEvents).orderBy(desc(webhookEvents.receivedAt)).limit(limit),

    updateCurrentStatus: async (
      eventId: string,
      currentStatus: EventStatus,
      updatedAt = new Date()
    ): Promise<WebhookEvent> => {
      const [event] = await db
        .update(webhookEvents)
        .set({
          currentStatus,
          updatedAt,
          lastSuccessfulAt: currentStatus === "delivered" ? updatedAt : undefined
        })
        .where(eq(webhookEvents.id, eventId))
        .returning();

      return expectSingleWebhookEvent(event, eventId);
    },

    appendStatusHistory,

    transitionStatus: async (
      input: TransitionWebhookEventStatusInput
    ): Promise<TransitionWebhookEventStatusResult> =>
      db.transaction(async (tx) => {
        const [existingEvent] = await tx
          .select()
          .from(webhookEvents)
          .where(eq(webhookEvents.id, input.eventId))
          .limit(1);

        const fromEvent = expectSingleWebhookEvent(existingEvent, input.eventId);
        const changedAt = input.changedAt ?? new Date();
        const [event] = await tx
          .update(webhookEvents)
          .set({
            currentStatus: input.toStatus,
            updatedAt: changedAt,
            lastSuccessfulAt:
              input.toStatus === "delivered" ? changedAt : fromEvent.lastSuccessfulAt
          })
          .where(eq(webhookEvents.id, input.eventId))
          .returning();

        const [history] = await tx
          .insert(eventStatusHistory)
          .values({
            eventId: input.eventId,
            fromStatus: fromEvent.currentStatus,
            toStatus: input.toStatus,
            reasonCode: input.reasonCode ?? null,
            message: input.message ?? null,
            metadata: input.metadata,
            createdAt: changedAt
          })
          .returning();

        if (!event || !history) {
          throw new Error("Failed to transition webhook event status.");
        }

        return { event, history };
      }),

    isDuplicate: async (
      providerId: NormalizedEvent["providerId"],
      externalEventId: string
    ): Promise<boolean> => {
      const existingEvent = await getByProviderAndExternalEventId(providerId, externalEventId);
      return existingEvent !== undefined;
    },

    listStatusHistory: async (eventId: string): Promise<ReadonlyArray<EventStatusHistory>> =>
      db
        .select()
        .from(eventStatusHistory)
        .where(eq(eventStatusHistory.eventId, eventId))
        .orderBy(asc(eventStatusHistory.createdAt), asc(eventStatusHistory.id))
  };
};
