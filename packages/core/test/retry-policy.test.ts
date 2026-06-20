import { describe, expect, it } from "vitest";

import {
  calculateRetryDelayMs,
  defaultRetryPolicy,
  isRetryableHttpStatus,
  retryPolicySchema,
  shouldRetryAttempt
} from "../src/retry-policy.js";

describe("retry policy", () => {
  it("defines a valid default policy", () => {
    expect(retryPolicySchema.safeParse(defaultRetryPolicy).success).toBe(true);
    expect(defaultRetryPolicy.maxAttempts).toBe(3);
    expect(defaultRetryPolicy.deadLetterAfterMaxAttempts).toBe(true);
  });

  it("increases retry delay with attempts", () => {
    expect(calculateRetryDelayMs(1, defaultRetryPolicy)).toBe(100);
    expect(calculateRetryDelayMs(2, defaultRetryPolicy)).toBe(200);
    expect(calculateRetryDelayMs(3, defaultRetryPolicy)).toBe(400);
  });

  it("does not exceed maxDelayMs", () => {
    expect(
      calculateRetryDelayMs(10, {
        ...defaultRetryPolicy,
        maxDelayMs: 250
      })
    ).toBe(250);
  });

  it("honors max attempt behavior", () => {
    expect(shouldRetryAttempt(1, defaultRetryPolicy)).toBe(true);
    expect(shouldRetryAttempt(2, defaultRetryPolicy)).toBe(true);
    expect(shouldRetryAttempt(3, defaultRetryPolicy)).toBe(false);
  });

  it("identifies retryable HTTP status codes", () => {
    expect(isRetryableHttpStatus(500, defaultRetryPolicy)).toBe(true);
    expect(isRetryableHttpStatus(429, defaultRetryPolicy)).toBe(true);
    expect(isRetryableHttpStatus(400, defaultRetryPolicy)).toBe(false);
  });
});
