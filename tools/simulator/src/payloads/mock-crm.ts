import type { MockCrmEvent } from "@webhook-monitor/core";

import type { GenericDemoDeliveryBehavior } from "./generic-http.js";

export const createMockCrmDemoPayload = (
  eventId = "crm_demo_success",
  deliveryBehavior: GenericDemoDeliveryBehavior = "success"
): MockCrmEvent => ({
  eventId,
  action: "contact.created",
  occurredAt: "2026-06-20T12:00:00.000Z",
  crmAccountId: "crm_account_local_demo",
  actorId: "crm_user_local_demo",
  idempotencyKey: eventId,
  record: {
    id: "contact_local_demo",
    type: "contact",
    attributes: {
      email: "demo@example.test",
      lifecycleStage: "lead",
      deliveryBehavior
    }
  }
});
