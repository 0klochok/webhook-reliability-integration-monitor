import { describe, expect, it } from "vitest";

import { createGenericHttpEventFixture } from "../src/test-fixtures/generic-http.js";
import { createMockCrmEventFixture } from "../src/test-fixtures/mock-crm.js";
import { createStripeSampleEventFixture } from "../src/test-fixtures/stripe-sample.js";
import {
  genericHttpEventSchema,
  mockCrmEventSchema,
  stripeSampleEventSchema
} from "../src/schemas/index.js";

describe("stripe sample event schema", () => {
  it("accepts a valid sample payload", () => {
    expect(stripeSampleEventSchema.safeParse(createStripeSampleEventFixture()).success).toBe(true);
  });

  it("rejects a missing id", () => {
    const payload: Record<string, unknown> = { ...createStripeSampleEventFixture() };
    Reflect.deleteProperty(payload, "id");

    expect(stripeSampleEventSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects an unsupported type", () => {
    const payload = {
      ...createStripeSampleEventFixture(),
      type: "invoice.paid"
    };

    expect(stripeSampleEventSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects a malformed data.object", () => {
    const payload = {
      ...createStripeSampleEventFixture(),
      data: {
        object: {
          id: "pi_local_123"
        }
      }
    };

    expect(stripeSampleEventSchema.safeParse(payload).success).toBe(false);
  });
});

describe("generic HTTP event schema", () => {
  it("accepts a valid sample payload", () => {
    expect(genericHttpEventSchema.safeParse(createGenericHttpEventFixture()).success).toBe(true);
  });

  it("rejects a missing eventId", () => {
    const payload: Record<string, unknown> = { ...createGenericHttpEventFixture() };
    Reflect.deleteProperty(payload, "eventId");

    expect(genericHttpEventSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects an invalid occurredAt value", () => {
    const payload = {
      ...createGenericHttpEventFixture(),
      occurredAt: "not-a-date"
    };

    expect(genericHttpEventSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects a non-object payload", () => {
    const payload = {
      ...createGenericHttpEventFixture(),
      payload: "not-an-object"
    };

    expect(genericHttpEventSchema.safeParse(payload).success).toBe(false);
  });
});

describe("mock CRM event schema", () => {
  it("accepts a valid sample payload", () => {
    expect(mockCrmEventSchema.safeParse(createMockCrmEventFixture()).success).toBe(true);
  });

  it("rejects an unsupported action", () => {
    const payload = {
      ...createMockCrmEventFixture(),
      action: "company.created"
    };

    expect(mockCrmEventSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects a missing record.id", () => {
    const payload = {
      ...createMockCrmEventFixture(),
      record: {
        type: "contact",
        attributes: {
          email: "demo@example.test"
        }
      }
    };

    expect(mockCrmEventSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects an invalid occurredAt value", () => {
    const payload = {
      ...createMockCrmEventFixture(),
      occurredAt: "not-a-date"
    };

    expect(mockCrmEventSchema.safeParse(payload).success).toBe(false);
  });
});
