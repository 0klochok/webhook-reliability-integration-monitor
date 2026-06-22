import type { GenericHttpEvent } from "@webhook-monitor/core";

export type GenericDemoDeliveryBehavior =
  | "success"
  | "fail-once-then-success"
  | "fail-twice-then-success"
  | "always-retryable-fail"
  | "permanent-fail"
  | "fail-until-manual-replay-success";

export interface CreateGenericHttpDemoPayloadInput {
  readonly eventId: string;
  readonly deliveryBehavior: GenericDemoDeliveryBehavior;
  readonly eventType?: string;
}

export const createGenericHttpDemoPayload = (
  input: CreateGenericHttpDemoPayloadInput
): GenericHttpEvent => ({
  eventId: input.eventId,
  eventType: input.eventType ?? "order.fulfilled",
  occurredAt: "2026-06-20T12:00:00.000Z",
  source: "phase-6-local-simulator",
  idempotencyKey: input.eventId,
  payload: {
    orderId: `${input.eventId}_order`,
    total: 2499,
    currency: "usd",
    deliveryBehavior: input.deliveryBehavior
  },
  metadata: {
    environment: "local-demo",
    scenario: input.eventId
  }
});

export const createInvalidGenericHttpDemoPayload = (): Record<string, unknown> => ({
  eventId: "generic_demo_invalid_payload",
  occurredAt: "not-a-date",
  payload: {
    deliveryBehavior: "success"
  }
});
