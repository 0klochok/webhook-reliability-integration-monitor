import type { SimulatorConfig } from "../config.js";
import { createGenericHttpDemoPayload } from "../payloads/generic-http.js";
import { jsonPost, runWebhookScenario } from "./helpers.js";
import type { Scenario, ScenarioContext, ScenarioPlan } from "./types.js";

export const createSuccessScenarioPlan = (_config: SimulatorConfig): ScenarioPlan => {
  void _config;
  const payload = createGenericHttpDemoPayload({
    eventId: "generic_demo_success",
    deliveryBehavior: "success"
  });

  return {
    id: "success",
    name: "Generic HTTP success",
    expectedBehavior: "accepted, queued, and delivered by the local worker",
    finalStatuses: ["delivered"],
    steps: [
      {
        label: "Generic HTTP success",
        providerId: "generic-http",
        externalEventId: payload.eventId,
        expectedBehavior: "valid generic payload is delivered successfully",
        request: jsonPost("/webhooks/generic-http", payload),
        expectedHttpStatuses: [200],
        expectedDuplicate: false,
        allowExistingDuplicate: true
      }
    ]
  };
};

export const successScenario: Scenario = {
  id: "success",
  createPlan: createSuccessScenarioPlan,
  run: async (context: ScenarioContext) => {
    await runWebhookScenario(context, createSuccessScenarioPlan(context.config));
  }
};
