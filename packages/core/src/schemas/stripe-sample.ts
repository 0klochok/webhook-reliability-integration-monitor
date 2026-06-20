import { z } from "zod";

export const stripeSampleEventTypes = [
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "customer.created"
] as const;

export type StripeSampleEventType = (typeof stripeSampleEventTypes)[number];

export const stripeSampleEventTypeSchema = z.enum(stripeSampleEventTypes);

export const stripeSampleDataObjectSchema = z
  .object({
    id: z.string().min(1),
    object: z.string().min(1),
    amount: z.number().int().nonnegative().optional(),
    currency: z.string().length(3).optional(),
    customer: z.string().min(1).optional(),
    metadata: z.record(z.string(), z.string()).optional()
  })
  .passthrough();

export const stripeSampleEventSchema = z
  .object({
    id: z.string().startsWith("evt_"),
    object: z.literal("event"),
    type: stripeSampleEventTypeSchema,
    created: z.number().int().positive(),
    livemode: z.boolean(),
    data: z.object({
      object: stripeSampleDataObjectSchema
    })
  })
  .passthrough();

export type StripeSampleDataObject = z.infer<typeof stripeSampleDataObjectSchema>;
export type StripeSampleEvent = z.infer<typeof stripeSampleEventSchema>;
