import { createHash } from "node:crypto";
import { z } from "zod";

import { providerIdSchema } from "./providers.js";

export const normalizedEventSchemaVersion = "v1" as const;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema)
  ])
);

export const payloadHashSchema = z.string().regex(/^[a-f0-9]{64}$/);

export const normalizedEventSchema = z
  .object({
    providerId: providerIdSchema,
    externalEventId: z.string().min(1),
    eventType: z.string().min(1),
    occurredAt: z.date(),
    receivedAt: z.date(),
    idempotencyKey: z.string().min(1),
    payload: jsonValueSchema,
    payloadHash: payloadHashSchema,
    signatureVerificationRequired: z.boolean(),
    schemaVersion: z.literal(normalizedEventSchemaVersion)
  })
  .strict();

export type NormalizedEvent = z.infer<typeof normalizedEventSchema>;

const sortJsonValue = (value: JsonValue): JsonValue => {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }

  if (value !== null && typeof value === "object") {
    const sortedEntries = Object.entries(value)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, entryValue]) => [key, sortJsonValue(entryValue)] as const);

    return Object.fromEntries(sortedEntries) as JsonObject;
  }

  return value;
};

export const createPayloadHash = (payload: JsonValue): string =>
  createHash("sha256")
    .update(JSON.stringify(sortJsonValue(payload)))
    .digest("hex");
