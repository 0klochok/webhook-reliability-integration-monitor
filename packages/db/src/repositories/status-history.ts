import type { EventStatus, JsonValue } from "@webhook-monitor/core";
import { asc, eq } from "drizzle-orm";

import type { Database } from "../client.js";
import { eventStatusHistory, type EventStatusHistory } from "../schema.js";

export interface AppendStatusTransitionInput {
  readonly eventId: string;
  readonly fromStatus?: EventStatus | null;
  readonly toStatus: EventStatus;
  readonly reasonCode?: string | null;
  readonly message?: string | null;
  readonly metadata?: JsonValue;
  readonly createdAt?: Date;
}

export const createStatusHistoryRepository = (db: Database) => ({
  appendStatusTransition: async (
    input: AppendStatusTransitionInput
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
  },

  listStatusHistoryForEvent: async (eventId: string): Promise<ReadonlyArray<EventStatusHistory>> =>
    db
      .select()
      .from(eventStatusHistory)
      .where(eq(eventStatusHistory.eventId, eventId))
      .orderBy(asc(eventStatusHistory.createdAt), asc(eventStatusHistory.id))
});
