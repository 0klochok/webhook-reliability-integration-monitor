import type { GenericHttpEvent } from "../schemas/generic-http.js";

export const createGenericHttpEventFixture = (): GenericHttpEvent => ({
  eventId: "generic-local-event-1",
  eventType: "order.fulfilled",
  occurredAt: "2026-06-20T12:00:00.000Z",
  source: "local-demo",
  idempotencyKey: "generic-local-idempotency-1",
  payload: {
    orderId: "order_local_123",
    total: 2499,
    currency: "usd"
  },
  metadata: {
    environment: "local"
  }
});
