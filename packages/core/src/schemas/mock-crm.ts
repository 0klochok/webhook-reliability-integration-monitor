import { z } from "zod";

export const mockCrmActions = ["contact.created", "contact.updated", "deal.stage_changed"] as const;

export type MockCrmAction = (typeof mockCrmActions)[number];

export const mockCrmActionSchema = z.enum(mockCrmActions);

export const mockCrmRecordTypes = ["contact", "deal"] as const;

export type MockCrmRecordType = (typeof mockCrmRecordTypes)[number];

export const mockCrmRecordTypeSchema = z.enum(mockCrmRecordTypes);

export const mockCrmRecordSchema = z.object({
  id: z.string().min(1),
  type: mockCrmRecordTypeSchema,
  attributes: z.record(z.string(), z.unknown())
});

export const mockCrmEventSchema = z
  .object({
    eventId: z.string().min(1),
    action: mockCrmActionSchema,
    occurredAt: z.string().datetime(),
    crmAccountId: z.string().min(1),
    record: mockCrmRecordSchema,
    actorId: z.string().min(1).optional(),
    idempotencyKey: z.string().min(1).optional()
  })
  .strict();

export type MockCrmRecord = z.infer<typeof mockCrmRecordSchema>;
export type MockCrmEvent = z.infer<typeof mockCrmEventSchema>;
