import type { EventStatus } from "@webhook-monitor/core";

const statusLabels = {
  received: "Received",
  validated: "Validated",
  rejected_invalid_signature: "Rejected invalid signature",
  rejected_invalid_payload: "Rejected invalid payload",
  duplicate_ignored: "Duplicate ignored",
  queued: "Queued",
  processing: "Processing",
  delivered: "Delivered",
  retry_scheduled: "Retry scheduled",
  failed_retryable: "Failed retryable",
  dead_lettered: "Dead-lettered",
  replayed: "Replayed"
} satisfies Record<EventStatus, string>;

export const formatStatus = (status: EventStatus): string => statusLabels[status];

export const formatDateTime = (date: Date | null | undefined): string =>
  date ? date.toISOString() : "None";

export const formatNullable = (value: string | number | null | undefined): string =>
  value === null || value === undefined || value === "" ? "None" : String(value);

export const formatSuccessRate = (successRate: number): string =>
  `${Math.round(successRate * 1000) / 10}%`;
