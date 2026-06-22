import { describe, expect, it } from "vitest";

import {
  createDeliveryJobData,
  createDeliveryQueueJobId,
  createDeliveryJobId,
  createReplayDeliveryJobId,
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
    expect(createDeliveryQueueJobId({ eventId })).toBe(`delivery-${eventId}`);
    expect(parseDeliveryJobData(data)).toEqual(data);
  });

  it("accepts replay metadata and creates a replay-specific stable job id", () => {
    const eventId = "11111111-1111-4111-8111-111111111111";
    const manualReplayId = "22222222-2222-4222-8222-222222222222";
    const data = createDeliveryJobData({
      eventId,
      providerId: "generic-http",
      externalEventId: "generic-event-1",
      enqueuedAt: "2026-06-20T12:00:00.000Z",
      replayOfEventId: eventId,
      manualReplayId,
      requestedBy: "local-operator",
      initialAttemptNumber: 4
    });

    expect(data).toMatchObject({
      eventId,
      replayOfEventId: eventId,
      manualReplayId,
      requestedBy: "local-operator",
      initialAttemptNumber: 4
    });
    expect(createReplayDeliveryJobId(manualReplayId)).toBe(`delivery-replay-${manualReplayId}`);
    expect(createDeliveryQueueJobId(data)).toBe(`delivery-replay-${manualReplayId}`);
  });

  it("accepts optional correlation metadata without changing stable job ids", () => {
    const eventId = "11111111-1111-4111-8111-111111111111";
    const data = createDeliveryJobData({
      eventId,
      providerId: "generic-http",
      externalEventId: "generic-event-1",
      correlationId: "demo-correlation-123",
      enqueuedAt: "2026-06-20T12:00:00.000Z"
    });

    expect(data).toMatchObject({
      eventId,
      correlationId: "demo-correlation-123"
    });
    expect(createDeliveryQueueJobId(data)).toBe(`delivery-${eventId}`);
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
