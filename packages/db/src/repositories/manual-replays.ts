import type { JsonValue } from "@webhook-monitor/core";
import { desc, eq } from "drizzle-orm";

import type { Database } from "../client.js";
import { manualReplays, type ManualReplay, type ManualReplayStatus } from "../schema.js";

export interface CreateManualReplayInput {
  readonly originalEventId: string;
  readonly replayedEventId?: string | null;
  readonly requestedBy: string;
  readonly reason?: string | null;
  readonly status?: ManualReplayStatus;
  readonly metadata?: JsonValue;
  readonly requestedAt?: Date;
  readonly completedAt?: Date | null;
  readonly createdAt?: Date;
}

export interface UpdateManualReplayStatusInput {
  readonly replayId: string;
  readonly status: ManualReplayStatus;
  readonly replayedEventId?: string | null;
  readonly completedAt?: Date | null;
  readonly metadata?: JsonValue;
}

export const createManualReplaysRepository = (db: Database) => ({
  getManualReplayById: async (replayId: string): Promise<ManualReplay | undefined> => {
    const [manualReplay] = await db
      .select()
      .from(manualReplays)
      .where(eq(manualReplays.id, replayId))
      .limit(1);

    return manualReplay;
  },

  createManualReplay: async (input: CreateManualReplayInput): Promise<ManualReplay> => {
    const now = input.createdAt ?? new Date();
    const [manualReplay] = await db
      .insert(manualReplays)
      .values({
        originalEventId: input.originalEventId,
        replayedEventId: input.replayedEventId ?? null,
        requestedBy: input.requestedBy,
        reason: input.reason ?? null,
        status: input.status ?? "requested",
        metadata: input.metadata,
        requestedAt: input.requestedAt ?? now,
        completedAt: input.completedAt ?? null,
        createdAt: now
      })
      .returning();

    if (!manualReplay) {
      throw new Error("Failed to create manual replay audit record.");
    }

    return manualReplay;
  },

  updateReplayStatus: async (input: UpdateManualReplayStatusInput): Promise<ManualReplay> => {
    const [manualReplay] = await db
      .update(manualReplays)
      .set({
        status: input.status,
        replayedEventId: input.replayedEventId,
        completedAt: input.completedAt,
        metadata: input.metadata
      })
      .where(eq(manualReplays.id, input.replayId))
      .returning();

    if (!manualReplay) {
      throw new Error(`Manual replay "${input.replayId}" was not found.`);
    }

    return manualReplay;
  },

  markReplayQueued: async (replayId: string, metadata?: JsonValue): Promise<ManualReplay> => {
    const [manualReplay] = await db
      .update(manualReplays)
      .set({
        status: "queued",
        metadata
      })
      .where(eq(manualReplays.id, replayId))
      .returning();

    if (!manualReplay) {
      throw new Error(`Manual replay "${replayId}" was not found.`);
    }

    return manualReplay;
  },

  markReplayCompleted: async (
    replayId: string,
    completedAt = new Date(),
    metadata?: JsonValue
  ): Promise<ManualReplay> => {
    const [manualReplay] = await db
      .update(manualReplays)
      .set({
        status: "completed",
        completedAt,
        metadata
      })
      .where(eq(manualReplays.id, replayId))
      .returning();

    if (!manualReplay) {
      throw new Error(`Manual replay "${replayId}" was not found.`);
    }

    return manualReplay;
  },

  markReplayFailed: async (
    replayId: string,
    completedAt = new Date(),
    metadata?: JsonValue
  ): Promise<ManualReplay> => {
    const [manualReplay] = await db
      .update(manualReplays)
      .set({
        status: "failed",
        completedAt,
        metadata
      })
      .where(eq(manualReplays.id, replayId))
      .returning();

    if (!manualReplay) {
      throw new Error(`Manual replay "${replayId}" was not found.`);
    }

    return manualReplay;
  },

  listReplaysForOriginalEvent: async (
    originalEventId: string
  ): Promise<ReadonlyArray<ManualReplay>> =>
    db
      .select()
      .from(manualReplays)
      .where(eq(manualReplays.originalEventId, originalEventId))
      .orderBy(desc(manualReplays.requestedAt), desc(manualReplays.createdAt))
});
