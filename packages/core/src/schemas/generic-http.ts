import { z } from "zod";

export const genericHttpPayloadSchema = z.record(z.string(), z.unknown());

export const genericHttpEventSchema = z
  .object({
    eventId: z.string().min(1),
    eventType: z.string().min(1),
    occurredAt: z.string().datetime(),
    source: z.string().min(1),
    payload: genericHttpPayloadSchema,
    idempotencyKey: z.string().min(1).optional(),
    metadata: z.record(z.string(), z.unknown()).optional()
  })
  .strict();

export type GenericHttpEvent = z.infer<typeof genericHttpEventSchema>;
