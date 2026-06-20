import { asc, desc, eq } from "drizzle-orm";

import type { Database } from "../client.js";
import { deliveryAttempts, type DeliveryAttempt, type DeliveryAttemptStatus } from "../schema.js";

export interface CreateDeliveryAttemptInput {
  readonly eventId: string;
  readonly attemptNumber: number;
  readonly status?: DeliveryAttemptStatus;
  readonly targetUrl?: string | null;
  readonly httpStatusCode?: number | null;
  readonly errorCode?: string | null;
  readonly errorMessage?: string | null;
  readonly durationMs?: number | null;
  readonly nextRetryAt?: Date | null;
  readonly startedAt?: Date | null;
  readonly completedAt?: Date | null;
  readonly createdAt?: Date;
}

export interface UpdateDeliveryAttemptResultInput {
  readonly attemptId: string;
  readonly status: DeliveryAttemptStatus;
  readonly httpStatusCode?: number | null;
  readonly errorCode?: string | null;
  readonly errorMessage?: string | null;
  readonly durationMs?: number | null;
  readonly nextRetryAt?: Date | null;
  readonly startedAt?: Date | null;
  readonly completedAt?: Date | null;
}

export const createDeliveryAttemptsRepository = (db: Database) => ({
  createDeliveryAttempt: async (input: CreateDeliveryAttemptInput): Promise<DeliveryAttempt> => {
    const [attempt] = await db
      .insert(deliveryAttempts)
      .values({
        eventId: input.eventId,
        attemptNumber: input.attemptNumber,
        status: input.status ?? "pending",
        targetUrl: input.targetUrl ?? null,
        httpStatusCode: input.httpStatusCode ?? null,
        errorCode: input.errorCode ?? null,
        errorMessage: input.errorMessage ?? null,
        durationMs: input.durationMs ?? null,
        nextRetryAt: input.nextRetryAt ?? null,
        startedAt: input.startedAt ?? null,
        completedAt: input.completedAt ?? null,
        createdAt: input.createdAt ?? new Date()
      })
      .returning();

    if (!attempt) {
      throw new Error("Failed to create delivery attempt.");
    }

    return attempt;
  },

  updateDeliveryAttemptResult: async (
    input: UpdateDeliveryAttemptResultInput
  ): Promise<DeliveryAttempt> => {
    const [attempt] = await db
      .update(deliveryAttempts)
      .set({
        status: input.status,
        httpStatusCode: input.httpStatusCode,
        errorCode: input.errorCode,
        errorMessage: input.errorMessage,
        durationMs: input.durationMs,
        nextRetryAt: input.nextRetryAt,
        startedAt: input.startedAt,
        completedAt: input.completedAt
      })
      .where(eq(deliveryAttempts.id, input.attemptId))
      .returning();

    if (!attempt) {
      throw new Error(`Delivery attempt "${input.attemptId}" was not found.`);
    }

    return attempt;
  },

  listAttemptsForEvent: async (eventId: string): Promise<ReadonlyArray<DeliveryAttempt>> =>
    db
      .select()
      .from(deliveryAttempts)
      .where(eq(deliveryAttempts.eventId, eventId))
      .orderBy(asc(deliveryAttempts.attemptNumber), asc(deliveryAttempts.createdAt)),

  getLatestAttemptForEvent: async (eventId: string): Promise<DeliveryAttempt | undefined> => {
    const [attempt] = await db
      .select()
      .from(deliveryAttempts)
      .where(eq(deliveryAttempts.eventId, eventId))
      .orderBy(desc(deliveryAttempts.attemptNumber), desc(deliveryAttempts.createdAt))
      .limit(1);

    return attempt;
  }
});
