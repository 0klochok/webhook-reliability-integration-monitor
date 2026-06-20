CREATE TYPE "public"."delivery_attempt_status" AS ENUM('pending', 'running', 'succeeded', 'failed_retryable', 'failed_permanent');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('received', 'validated', 'rejected_invalid_signature', 'rejected_invalid_payload', 'duplicate_ignored', 'queued', 'processing', 'delivered', 'retry_scheduled', 'failed_retryable', 'dead_lettered', 'replayed');--> statement-breakpoint
CREATE TYPE "public"."manual_replay_status" AS ENUM('requested', 'queued', 'failed', 'completed');--> statement-breakpoint
CREATE TYPE "public"."provider_id" AS ENUM('stripe-sample', 'generic-http', 'mock-crm');--> statement-breakpoint
CREATE TABLE "dead_letter_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_id" uuid NOT NULL,
	"reason_code" text NOT NULL,
	"error_message" text,
	"final_attempt_number" integer,
	"payload_snapshot" jsonb,
	"dead_lettered_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"status" "delivery_attempt_status" NOT NULL,
	"target_url" text,
	"http_status_code" integer,
	"error_code" text,
	"error_message" text,
	"duration_ms" integer,
	"next_retry_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_status_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_id" uuid NOT NULL,
	"from_status" "event_status",
	"to_status" "event_status" NOT NULL,
	"reason_code" text,
	"message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manual_replays" (
	"id" uuid PRIMARY KEY NOT NULL,
	"original_event_id" uuid NOT NULL,
	"replayed_event_id" uuid,
	"requested_by" text NOT NULL,
	"reason" text,
	"status" "manual_replay_status" NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"requested_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"provider_id" "provider_id" NOT NULL,
	"external_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"current_status" "event_status" NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"idempotency_key" text,
	"payload_hash" text NOT NULL,
	"payload" jsonb NOT NULL,
	"signature_verification_required" boolean NOT NULL,
	"schema_version" text NOT NULL,
	"last_successful_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dead_letter_events" ADD CONSTRAINT "dead_letter_events_event_id_webhook_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."webhook_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_event_id_webhook_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."webhook_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_status_history" ADD CONSTRAINT "event_status_history_event_id_webhook_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."webhook_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_replays" ADD CONSTRAINT "manual_replays_original_event_id_webhook_events_id_fk" FOREIGN KEY ("original_event_id") REFERENCES "public"."webhook_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_replays" ADD CONSTRAINT "manual_replays_replayed_event_id_webhook_events_id_fk" FOREIGN KEY ("replayed_event_id") REFERENCES "public"."webhook_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dead_letter_events_event_id_unique" ON "dead_letter_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "dead_letter_events_reason_code_idx" ON "dead_letter_events" USING btree ("reason_code");--> statement-breakpoint
CREATE INDEX "dead_letter_events_dead_lettered_at_idx" ON "dead_letter_events" USING btree ("dead_lettered_at");--> statement-breakpoint
CREATE UNIQUE INDEX "delivery_attempts_event_attempt_number_unique" ON "delivery_attempts" USING btree ("event_id","attempt_number");--> statement-breakpoint
CREATE INDEX "delivery_attempts_event_id_idx" ON "delivery_attempts" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "delivery_attempts_status_idx" ON "delivery_attempts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "delivery_attempts_next_retry_at_idx" ON "delivery_attempts" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "delivery_attempts_created_at_idx" ON "delivery_attempts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "event_status_history_event_id_idx" ON "event_status_history" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_status_history_to_status_idx" ON "event_status_history" USING btree ("to_status");--> statement-breakpoint
CREATE INDEX "event_status_history_created_at_idx" ON "event_status_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "manual_replays_original_event_id_idx" ON "manual_replays" USING btree ("original_event_id");--> statement-breakpoint
CREATE INDEX "manual_replays_replayed_event_id_idx" ON "manual_replays" USING btree ("replayed_event_id");--> statement-breakpoint
CREATE INDEX "manual_replays_status_idx" ON "manual_replays" USING btree ("status");--> statement-breakpoint
CREATE INDEX "manual_replays_requested_at_idx" ON "manual_replays" USING btree ("requested_at");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_provider_external_event_id_unique" ON "webhook_events" USING btree ("provider_id","external_event_id");--> statement-breakpoint
CREATE INDEX "webhook_events_provider_id_idx" ON "webhook_events" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "webhook_events_current_status_idx" ON "webhook_events" USING btree ("current_status");--> statement-breakpoint
CREATE INDEX "webhook_events_received_at_idx" ON "webhook_events" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "webhook_events_payload_hash_idx" ON "webhook_events" USING btree ("payload_hash");--> statement-breakpoint
CREATE INDEX "webhook_events_idempotency_key_idx" ON "webhook_events" USING btree ("idempotency_key");