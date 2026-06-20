import { randomUUID } from "node:crypto";

import { eventStatuses, providerIds, type JsonValue } from "@webhook-monitor/core";
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const providerIdEnum = pgEnum("provider_id", providerIds);
export const eventStatusEnum = pgEnum("event_status", eventStatuses);

export const deliveryAttemptStatuses = [
  "pending",
  "running",
  "succeeded",
  "failed_retryable",
  "failed_permanent"
] as const;

export type DeliveryAttemptStatus = (typeof deliveryAttemptStatuses)[number];

export const deliveryAttemptStatusEnum = pgEnum("delivery_attempt_status", deliveryAttemptStatuses);

export const manualReplayStatuses = ["requested", "queued", "failed", "completed"] as const;

export type ManualReplayStatus = (typeof manualReplayStatuses)[number];

export const manualReplayStatusEnum = pgEnum("manual_replay_status", manualReplayStatuses);

const idColumn = () => uuid("id").primaryKey().$defaultFn(randomUUID);
const timestampTz = (name: string) => timestamp(name, { withTimezone: true });
const jsonObjectDefault = sql`'{}'::jsonb`;

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: idColumn(),
    providerId: providerIdEnum("provider_id").notNull(),
    externalEventId: text("external_event_id").notNull(),
    eventType: text("event_type").notNull(),
    currentStatus: eventStatusEnum("current_status").notNull(),
    occurredAt: timestampTz("occurred_at").notNull(),
    receivedAt: timestampTz("received_at").notNull(),
    idempotencyKey: text("idempotency_key"),
    payloadHash: text("payload_hash").notNull(),
    payload: jsonb("payload").$type<JsonValue>().notNull(),
    signatureVerificationRequired: boolean("signature_verification_required").notNull(),
    schemaVersion: text("schema_version").notNull(),
    lastSuccessfulAt: timestampTz("last_successful_at"),
    createdAt: timestampTz("created_at").notNull().defaultNow(),
    updatedAt: timestampTz("updated_at").notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("webhook_events_provider_external_event_id_unique").on(
      table.providerId,
      table.externalEventId
    ),
    index("webhook_events_provider_id_idx").on(table.providerId),
    index("webhook_events_current_status_idx").on(table.currentStatus),
    index("webhook_events_received_at_idx").on(table.receivedAt),
    index("webhook_events_payload_hash_idx").on(table.payloadHash),
    index("webhook_events_idempotency_key_idx").on(table.idempotencyKey)
  ]
);

export const eventStatusHistory = pgTable(
  "event_status_history",
  {
    id: idColumn(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => webhookEvents.id, { onDelete: "cascade" }),
    fromStatus: eventStatusEnum("from_status"),
    toStatus: eventStatusEnum("to_status").notNull(),
    reasonCode: text("reason_code"),
    message: text("message"),
    metadata: jsonb("metadata").$type<JsonValue>().notNull().default(jsonObjectDefault),
    createdAt: timestampTz("created_at").notNull().defaultNow()
  },
  (table) => [
    index("event_status_history_event_id_idx").on(table.eventId),
    index("event_status_history_to_status_idx").on(table.toStatus),
    index("event_status_history_created_at_idx").on(table.createdAt)
  ]
);

export const deliveryAttempts = pgTable(
  "delivery_attempts",
  {
    id: idColumn(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => webhookEvents.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull(),
    status: deliveryAttemptStatusEnum("status").notNull(),
    targetUrl: text("target_url"),
    httpStatusCode: integer("http_status_code"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    durationMs: integer("duration_ms"),
    nextRetryAt: timestampTz("next_retry_at"),
    startedAt: timestampTz("started_at"),
    completedAt: timestampTz("completed_at"),
    createdAt: timestampTz("created_at").notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("delivery_attempts_event_attempt_number_unique").on(
      table.eventId,
      table.attemptNumber
    ),
    index("delivery_attempts_event_id_idx").on(table.eventId),
    index("delivery_attempts_status_idx").on(table.status),
    index("delivery_attempts_next_retry_at_idx").on(table.nextRetryAt),
    index("delivery_attempts_created_at_idx").on(table.createdAt)
  ]
);

export const deadLetterEvents = pgTable(
  "dead_letter_events",
  {
    id: idColumn(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => webhookEvents.id, { onDelete: "cascade" }),
    reasonCode: text("reason_code").notNull(),
    errorMessage: text("error_message"),
    finalAttemptNumber: integer("final_attempt_number"),
    payloadSnapshot: jsonb("payload_snapshot").$type<JsonValue>(),
    deadLetteredAt: timestampTz("dead_lettered_at").notNull(),
    createdAt: timestampTz("created_at").notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("dead_letter_events_event_id_unique").on(table.eventId),
    index("dead_letter_events_reason_code_idx").on(table.reasonCode),
    index("dead_letter_events_dead_lettered_at_idx").on(table.deadLetteredAt)
  ]
);

export const manualReplays = pgTable(
  "manual_replays",
  {
    id: idColumn(),
    originalEventId: uuid("original_event_id")
      .notNull()
      .references(() => webhookEvents.id, { onDelete: "cascade" }),
    replayedEventId: uuid("replayed_event_id").references(() => webhookEvents.id),
    requestedBy: text("requested_by").notNull(),
    reason: text("reason"),
    status: manualReplayStatusEnum("status").notNull(),
    metadata: jsonb("metadata").$type<JsonValue>().notNull().default(jsonObjectDefault),
    requestedAt: timestampTz("requested_at").notNull(),
    completedAt: timestampTz("completed_at"),
    createdAt: timestampTz("created_at").notNull().defaultNow()
  },
  (table) => [
    index("manual_replays_original_event_id_idx").on(table.originalEventId),
    index("manual_replays_replayed_event_id_idx").on(table.replayedEventId),
    index("manual_replays_status_idx").on(table.status),
    index("manual_replays_requested_at_idx").on(table.requestedAt)
  ]
);

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
export type EventStatusHistory = typeof eventStatusHistory.$inferSelect;
export type NewEventStatusHistory = typeof eventStatusHistory.$inferInsert;
export type DeliveryAttempt = typeof deliveryAttempts.$inferSelect;
export type NewDeliveryAttempt = typeof deliveryAttempts.$inferInsert;
export type DeadLetterEvent = typeof deadLetterEvents.$inferSelect;
export type NewDeadLetterEvent = typeof deadLetterEvents.$inferInsert;
export type ManualReplay = typeof manualReplays.$inferSelect;
export type NewManualReplay = typeof manualReplays.$inferInsert;
