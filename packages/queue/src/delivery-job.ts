import { providerIdSchema, type ProviderId } from "@webhook-monitor/core";
import { z } from "zod";

export const deliveryJobSchema = z
  .object({
    eventId: z.string().uuid(),
    providerId: providerIdSchema.optional(),
    externalEventId: z.string().min(1).optional(),
    correlationId: z.string().min(1).max(128).optional(),
    enqueuedAt: z.string().datetime(),
    replayOfEventId: z.string().uuid().optional(),
    manualReplayId: z.string().uuid().optional(),
    requestedBy: z.string().min(1).optional(),
    initialAttemptNumber: z.number().int().positive().optional()
  })
  .strict();

export type DeliveryJobData = z.infer<typeof deliveryJobSchema>;

export interface EnqueueDeliveryInput {
  readonly eventId: string;
  readonly providerId?: ProviderId;
  readonly externalEventId?: string;
  readonly correlationId?: string;
  readonly enqueuedAt?: Date | string;
  readonly replayOfEventId?: string;
  readonly manualReplayId?: string;
  readonly requestedBy?: string;
  readonly initialAttemptNumber?: number;
}

export interface EnqueueDeliveryResult {
  readonly queued: true;
  readonly queueJobId: string;
}

export interface DeliveryQueuePort {
  enqueueDelivery(input: EnqueueDeliveryInput): Promise<EnqueueDeliveryResult>;
  checkReadiness?(): Promise<void>;
  close?(): Promise<void>;
}

export const createDeliveryJobId = (eventId: string): string => `delivery-${eventId}`;

export const createReplayDeliveryJobId = (manualReplayId: string): string =>
  `delivery-replay-${manualReplayId}`;

export const createDeliveryQueueJobId = (input: {
  readonly eventId: string;
  readonly manualReplayId?: string;
}): string =>
  input.manualReplayId
    ? createReplayDeliveryJobId(input.manualReplayId)
    : createDeliveryJobId(input.eventId);

const toIsoString = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : value;

export const createDeliveryJobData = (
  input: EnqueueDeliveryInput,
  clock: () => Date = () => new Date()
): DeliveryJobData => {
  const data = {
    eventId: input.eventId,
    providerId: input.providerId,
    externalEventId: input.externalEventId,
    correlationId: input.correlationId,
    enqueuedAt: input.enqueuedAt ? toIsoString(input.enqueuedAt) : clock().toISOString(),
    replayOfEventId: input.replayOfEventId,
    manualReplayId: input.manualReplayId,
    requestedBy: input.requestedBy,
    initialAttemptNumber: input.initialAttemptNumber
  };

  return deliveryJobSchema.parse(
    Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined))
  );
};

export const parseDeliveryJobData = (input: unknown): DeliveryJobData =>
  deliveryJobSchema.parse(input);
