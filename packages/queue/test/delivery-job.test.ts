import { describe, expect, it } from "vitest";

import {
  createDeliveryJobData,
  createDeliveryJobId,
  deliveryJobSchema,
  parseDeliveryJobData
} from "../src/index.js";

describe("delivery job contract", () => {
  it("accepts valid delivery job data and creates a stable job id", () => {
    const eventId = "11111111-1111-4111-8111-111111111111";
    const data = createDeliveryJobData({
      eventId,
      providerId: "generic-http",
      externalEventId: "generic-event-1",
      enqueuedAt: "2026-06-20T12:00:00.000Z"
    });

    expect(data).toEqual({
      eventId,
      providerId: "generic-http",
      externalEventId: "generic-event-1",
      enqueuedAt: "2026-06-20T12:00:00.000Z"
    });
    expect(createDeliveryJobId(eventId)).toBe(`delivery-${eventId}`);
    expect(parseDeliveryJobData(data)).toEqual(data);
  });

  it("rejects invalid delivery job data", () => {
    const result = deliveryJobSchema.safeParse({
      eventId: "not-a-uuid",
      providerId: "not-a-provider",
      enqueuedAt: "not-a-date"
    });

    expect(result.success).toBe(false);
  });
});
