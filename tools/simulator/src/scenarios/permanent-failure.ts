import type { SimulatorConfig } from "../config.js";
import { createGenericHttpDemoPayload } from "../payloads/generic-http.js";
import { jsonPost, runWebhookScenario } from "./helpers.js";
import type { Scenario, ScenarioContext, ScenarioPlan } from "./types.js";

export const createPermanentFailureScenarioPlan = (_config: SimulatorConfig): ScenarioPlan => {
  void _config;
  const payload = createGenericHttpDemoPayload({
    eventId: "generic_demo_permanent_failure",
    deliveryBehavior: "permanent-fail"
  });

  return {
    id: "permanent-failure",
    name: "Permanent failure",
    expectedBehavior: "worker marks a non-retryable downstream failure dead_lettered",
    finalStatuses: ["dead_lettered"],
    steps: [
      {
        label: "Permanent failure",
        providerId: "generic-http",
        externalEventId: payload.eventId,
        expectedBehavior: "permanent downstream failure dead-letters without retrying",
        request: jsonPost("/webhooks/generic-http", payload),
        expectedHttpStatuses: [200],
        expectedDuplicate: false,
        allowExistingDuplicate: true
      }
    ]
  };
};

export const permanentFailureScenario: Scenario = {
  id: "permanent-failure",
  createPlan: createPermanentFailureScenarioPlan,
  run: async (context: ScenarioContext) => {
    await runWebhookScenario(context, createPermanentFailureScenarioPlan(context.config));
  }
};
