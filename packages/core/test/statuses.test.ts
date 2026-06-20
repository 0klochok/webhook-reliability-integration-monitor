import { describe, expect, it } from "vitest";

import {
  eventStatuses,
  isRejectionStatus,
  isRetryRelatedStatus,
  isTerminalStatus
} from "../src/statuses.js";

describe("event statuses", () => {
  it("includes the expected status values", () => {
    expect(eventStatuses).toEqual([
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
    ]);
  });

  it("identifies terminal statuses", () => {
    expect(isTerminalStatus("delivered")).toBe(true);
    expect(isTerminalStatus("dead_lettered")).toBe(true);
    expect(isTerminalStatus("duplicate_ignored")).toBe(true);
    expect(isTerminalStatus("queued")).toBe(false);
  });

  it("identifies rejection statuses", () => {
    expect(isRejectionStatus("rejected_invalid_signature")).toBe(true);
    expect(isRejectionStatus("rejected_invalid_payload")).toBe(true);
    expect(isRejectionStatus("failed_retryable")).toBe(false);
  });

  it("identifies retry-related statuses", () => {
    expect(isRetryRelatedStatus("retry_scheduled")).toBe(true);
    expect(isRetryRelatedStatus("failed_retryable")).toBe(true);
    expect(isRetryRelatedStatus("dead_lettered")).toBe(true);
    expect(isRetryRelatedStatus("received")).toBe(false);
  });
});
