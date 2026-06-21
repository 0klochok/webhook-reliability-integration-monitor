import type { JsonValue } from "@webhook-monitor/core";
import { desc, eq } from "drizzle-orm";

import type { Database } from "../client.js";
import { deadLetterEvents, type DeadLetterEvent } from "../schema.js";

export interface CreateDeadLetterEventInput {
  readonly eventId: string;
  readonly reasonCode: string;
  readonly errorMessage?: string | null;
  readonly finalAttemptNumber?: number | null;
  readonly payloadSnapshot?: JsonValue | null;
  readonly deadLetteredAt?: Date;
  readonly createdAt?: Date;
}

export interface CreateOrGetDeadLetterEventResult {
  readonly inserted: boolean;
  readonly deadLetterEvent: DeadLetterEvent;
}

export const createDeadLetterEventsRepository = (db: Database) => ({
  createDeadLetterEvent: async (input: CreateDeadLetterEventInput): Promise<DeadLetterEvent> => {
    const now = input.createdAt ?? new Date();
    const [deadLetterEvent] = await db
      .insert(deadLetterEvents)
      .values({
        eventId: input.eventId,
        reasonCode: input.reasonCode,
        errorMessage: input.errorMessage ?? null,
        finalAttemptNumber: input.finalAttemptNumber ?? null,
        payloadSnapshot: input.payloadSnapshot ?? null,
        deadLetteredAt: input.deadLetteredAt ?? now,
        createdAt: now
      })
      .returning();

    if (!deadLetterEvent) {
      throw new Error("Failed to create dead-letter event.");
    }

    return deadLetterEvent;
  },

  createOrGetDeadLetterEvent: async (
    input: CreateDeadLetterEventInput
  ): Promise<CreateOrGetDeadLetterEventResult> => {
    const now = input.createdAt ?? new Date();
    const [insertedDeadLetterEvent] = await db
      .insert(deadLetterEvents)
      .values({
        eventId: input.eventId,
        reasonCode: input.reasonCode,
        errorMessage: input.errorMessage ?? null,
        finalAttemptNumber: input.finalAttemptNumber ?? null,
        payloadSnapshot: input.payloadSnapshot ?? null,
        deadLetteredAt: input.deadLetteredAt ?? now,
        createdAt: now
      })
      .onConflictDoNothing({
        target: deadLetterEvents.eventId
      })
      .returning();

    if (insertedDeadLetterEvent) {
      return {
        inserted: true,
        deadLetterEvent: insertedDeadLetterEvent
      };
    }

    const [existingDeadLetterEvent] = await db
      .select()
      .from(deadLetterEvents)
      .where(eq(deadLetterEvents.eventId, input.eventId))
      .limit(1);

    if (!existingDeadLetterEvent) {
      throw new Error("Dead-letter conflict occurred but no existing event was found.");
    }

    return {
      inserted: false,
      deadLetterEvent: existingDeadLetterEvent
    };
  },

  createOrUpdateDeadLetterEvent: async (
    input: CreateDeadLetterEventInput
  ): Promise<DeadLetterEvent> => {
    const now = input.createdAt ?? new Date();
    const deadLetteredAt = input.deadLetteredAt ?? now;
    const [deadLetterEvent] = await db
      .insert(deadLetterEvents)
      .values({
        eventId: input.eventId,
        reasonCode: input.reasonCode,
        errorMessage: input.errorMessage ?? null,
        finalAttemptNumber: input.finalAttemptNumber ?? null,
        payloadSnapshot: input.payloadSnapshot ?? null,
        deadLetteredAt,
        createdAt: now
      })
      .onConflictDoUpdate({
        target: deadLetterEvents.eventId,
        set: {
          reasonCode: input.reasonCode,
          errorMessage: input.errorMessage ?? null,
          finalAttemptNumber: input.finalAttemptNumber ?? null,
          payloadSnapshot: input.payloadSnapshot ?? null,
          deadLetteredAt
        }
      })
      .returning();

    if (!deadLetterEvent) {
      throw new Error("Failed to create or update dead-letter event.");
    }

    return deadLetterEvent;
  },

  getDeadLetterByEventId: async (eventId: string): Promise<DeadLetterEvent | undefined> => {
    const [deadLetterEvent] = await db
      .select()
      .from(deadLetterEvents)
      .where(eq(deadLetterEvents.eventId, eventId))
      .limit(1);

    return deadLetterEvent;
  },

  listDeadLetterEvents: async (limit = 50): Promise<ReadonlyArray<DeadLetterEvent>> =>
    db
      .select()
      .from(deadLetterEvents)
      .orderBy(desc(deadLetterEvents.deadLetteredAt), desc(deadLetterEvents.createdAt))
      .limit(limit)
});
