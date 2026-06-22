import type { SimulatorConfig } from "../config.js";
import { createMockCrmDemoPayload } from "../payloads/mock-crm.js";
import { jsonPost, runWebhookScenario } from "./helpers.js";
import type { Scenario, ScenarioContext, ScenarioPlan } from "./types.js";

export const createMockCrmSuccessScenarioPlan = (_config: SimulatorConfig): ScenarioPlan => {
  void _config;
  const payload = createMockCrmDemoPayload("crm_demo_success", "success");

  return {
    id: "mock-crm-success",
    name: "Mock CRM success",
    expectedBehavior: "accepted, queued, and delivered by the local worker",
    finalStatuses: ["delivered"],
    steps: [
      {
        label: "Mock CRM success",
        providerId: "mock-crm",
        externalEventId: payload.eventId,
        expectedBehavior: "valid CRM payload is delivered successfully",
        request: jsonPost("/webhooks/mock-crm", payload),
        expectedHttpStatuses: [200],
        expectedDuplicate: false,
        allowExistingDuplicate: true
      }
    ]
  };
};

export const mockCrmSuccessScenario: Scenario = {
  id: "mock-crm-success",
  createPlan: createMockCrmSuccessScenarioPlan,
  run: async (context: ScenarioContext) => {
    await runWebhookScenario(context, createMockCrmSuccessScenarioPlan(context.config));
  }
};
