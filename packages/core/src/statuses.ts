import { z } from "zod";

export const eventStatuses = [
  "received",
  "validated",
  "rejected_invalid_signature",
  "rejected_invalid_payload",
  "duplicate_ignored",
  "queued",
  "processing",
  "delivered",
  "retry_scheduled",
  "failed_retryable",
  "dead_lettered",
  "replayed"
] as const;

export type EventStatus = (typeof eventStatuses)[number];

export const eventStatusSchema = z.enum(eventStatuses);

const terminalStatuses = new Set<EventStatus>([
  "rejected_invalid_signature",
  "rejected_invalid_payload",
  "duplicate_ignored",
  "delivered",
  "dead_lettered"
]);

const rejectionStatuses = new Set<EventStatus>([
  "rejected_invalid_signature",
  "rejected_invalid_payload"
]);

const retryRelatedStatuses = new Set<EventStatus>([
  "retry_scheduled",
  "failed_retryable",
  "dead_lettered",
  "replayed"
]);

export const isTerminalStatus = (status: EventStatus): boolean => terminalStatuses.has(status);

export const isRejectionStatus = (status: EventStatus): boolean => rejectionStatuses.has(status);

export const isRetryRelatedStatus = (status: EventStatus): boolean =>
  retryRelatedStatuses.has(status);
