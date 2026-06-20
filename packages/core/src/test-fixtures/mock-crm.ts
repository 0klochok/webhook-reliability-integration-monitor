import type { MockCrmEvent } from "../schemas/mock-crm.js";

export const createMockCrmEventFixture = (): MockCrmEvent => ({
  eventId: "crm-local-event-1",
  action: "contact.created",
  occurredAt: "2026-06-20T12:00:00.000Z",
  crmAccountId: "crm_account_local_123",
  actorId: "crm_user_local_123",
  idempotencyKey: "crm-local-idempotency-1",
  record: {
    id: "contact_local_123",
    type: "contact",
    attributes: {
      email: "demo@example.test",
      lifecycleStage: "lead"
    }
  }
});
