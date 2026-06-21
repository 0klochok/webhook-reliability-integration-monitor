import { describe, expect, it } from "vitest";

import {
  NonRetryableDeliveryError,
  createDeliveryBackoffStrategy,
  createRetryPolicyFromEnv,
  deliveryBackoffStrategyName
} from "../src/index.js";

describe("delivery retry options", () => {
  it("maps environment values into a core retry policy", () => {
    const policy = createRetryPolicyFromEnv({
      DELIVERY_MAX_ATTEMPTS: "4",
      DELIVERY_INITIAL_DELAY_MS: "250",
      DELIVERY_BACKOFF_MULTIPLIER: "3",
      DELIVERY_MAX_DELAY_MS: "1000"
    });

    expect(policy).toMatchObject({
      maxAttempts: 4,
      initialDelayMs: 250,
      backoffMultiplier: 3,
      maxDelayMs: 1000
    });
  });

  it("creates deterministic capped exponential backoff delays", () => {
    const policy = createRetryPolicyFromEnv({
      DELIVERY_MAX_ATTEMPTS: "5",
      DELIVERY_INITIAL_DELAY_MS: "100",
      DELIVERY_BACKOFF_MULTIPLIER: "3",
      DELIVERY_MAX_DELAY_MS: "500"
    });
    const strategy = createDeliveryBackoffStrategy(policy);

    expect(strategy(1, deliveryBackoffStrategyName)).toBe(100);
    expect(strategy(2, deliveryBackoffStrategyName)).toBe(300);
    expect(strategy(3, deliveryBackoffStrategyName)).toBe(500);
  });

  it("returns -1 for non-retryable delivery errors", () => {
    const strategy = createDeliveryBackoffStrategy();

    expect(
      strategy(1, deliveryBackoffStrategyName, new NonRetryableDeliveryError("Permanent failure."))
    ).toBe(-1);
  });
});
