import { providerIdSchema, type ProviderId } from "@webhook-monitor/core";
import { z } from "zod";

export const deliveryJobSchema = z
  .object({
    eventId: z.string().uuid(),
    providerId: providerIdSchema.optional(),
    externalEventId: z.string().min(1).optional(),
    enqueuedAt: z.string().datetime(),
    replayOfEventId: z.string().uuid().optional()
  })
  .strict();

export type DeliveryJobData = z.infer<typeof deliveryJobSchema>;

export interface EnqueueDeliveryInput {
  readonly eventId: string;
  readonly providerId?: ProviderId;
  readonly externalEventId?: string;
  readonly enqueuedAt?: Date | string;
  readonly replayOfEventId?: string;
}

export interface EnqueueDeliveryResult {
  readonly queued: true;
  readonly queueJobId: string;
}

export interface DeliveryQueuePort {
  enqueueDelivery(input: EnqueueDeliveryInput): Promise<EnqueueDeliveryResult>;
}

export const createDeliveryJobId = (eventId: string): string => `delivery-${eventId}`;

const toIsoString = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : value;

export const createDeliveryJobData = (
  input: EnqueueDeliveryInput,
  clock: () => Date = () => new Date()
): DeliveryJobData =>
  deliveryJobSchema.parse({
    eventId: input.eventId,
    providerId: input.providerId,
    externalEventId: input.externalEventId,
    enqueuedAt: input.enqueuedAt ? toIsoString(input.enqueuedAt) : clock().toISOString(),
    replayOfEventId: input.replayOfEventId
  });

export const parseDeliveryJobData = (input: unknown): DeliveryJobData =>
  deliveryJobSchema.parse(input);
