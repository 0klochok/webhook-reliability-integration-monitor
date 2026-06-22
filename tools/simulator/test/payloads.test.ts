import {
  genericHttpEventSchema,
  mockCrmEventSchema,
  stripeSampleEventSchema
} from "@webhook-monitor/core";
import { describe, expect, it } from "vitest";

import {
  createGenericHttpDemoPayload,
  createInvalidGenericHttpDemoPayload
} from "../src/payloads/generic-http.js";
import { createMockCrmDemoPayload } from "../src/payloads/mock-crm.js";
import { createStripeSampleDemoPayload } from "../src/payloads/stripe.js";

describe("simulator payload builders", () => {
  it("creates a valid Stripe sample payload", () => {
    expect(stripeSampleEventSchema.safeParse(createStripeSampleDemoPayload()).success).toBe(true);
  });

  it("creates a valid generic success payload", () => {
    const payload = createGenericHttpDemoPayload({
      eventId: "generic_demo_success",
      deliveryBehavior: "success"
    });

    expect(genericHttpEventSchema.safeParse(payload).success).toBe(true);
    expect(payload.payload.deliveryBehavior).toBe("success");
  });

  it("uses identical external event ids for duplicate payloads", () => {
    const first = createGenericHttpDemoPayload({
      eventId: "generic_demo_duplicate",
      deliveryBehavior: "success"
    });
    const second = createGenericHttpDemoPayload({
      eventId: "generic_demo_duplicate",
      deliveryBehavior: "success"
    });

    expect(first.eventId).toBe(second.eventId);
    expect(first.idempotencyKey).toBe(second.idempotencyKey);
  });

  it("creates an invalid generic payload that fails the core schema", () => {
    expect(genericHttpEventSchema.safeParse(createInvalidGenericHttpDemoPayload()).success).toBe(
      false
    );
  });

  it("creates a valid mock CRM payload", () => {
    expect(mockCrmEventSchema.safeParse(createMockCrmDemoPayload()).success).toBe(true);
  });

  it("sets deterministic retry/dead-letter/permanent failure behaviors", () => {
    const retry = createGenericHttpDemoPayload({
      eventId: "generic_demo_retry_success",
      deliveryBehavior: "fail-once-then-success"
    });
    const deadLetter = createGenericHttpDemoPayload({
      eventId: "generic_demo_dead_letter",
      deliveryBehavior: "always-retryable-fail"
    });
    const permanentFailure = createGenericHttpDemoPayload({
      eventId: "generic_demo_permanent_failure",
      deliveryBehavior: "permanent-fail"
    });

    expect(retry.payload.deliveryBehavior).toBe("fail-once-then-success");
    expect(deadLetter.payload.deliveryBehavior).toBe("always-retryable-fail");
    expect(permanentFailure.payload.deliveryBehavior).toBe("permanent-fail");
  });
});
