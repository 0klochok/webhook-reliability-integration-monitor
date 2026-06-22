import type { SimulatorConfig } from "../config.js";
import { createGenericHttpDemoPayload } from "../payloads/generic-http.js";
import { executeStep, jsonPost } from "./helpers.js";
import type { Scenario, ScenarioContext, ScenarioPlan } from "./types.js";

export const createDuplicateScenarioPlan = (_config: SimulatorConfig): ScenarioPlan => {
  void _config;
  const payload = createGenericHttpDemoPayload({
    eventId: "generic_demo_duplicate",
    deliveryBehavior: "success"
  });

  return {
    id: "duplicate",
    name: "Duplicate event",
    expectedBehavior: "first request queues once; second request is duplicate_ignored",
    steps: [
      {
        label: "Duplicate scenario first request",
        providerId: "generic-http",
        externalEventId: payload.eventId,
        expectedBehavior: "accepted unless the deterministic event already exists",
        request: jsonPost("/webhooks/generic-http", payload),
        expectedHttpStatuses: [200],
        expectedDuplicate: false,
        allowExistingDuplicate: true
      },
      {
        label: "Duplicate scenario second request",
        providerId: "generic-http",
        externalEventId: payload.eventId,
        expectedBehavior: "duplicate processing is prevented",
        request: jsonPost("/webhooks/generic-http", payload),
        expectedHttpStatuses: [200],
        expectedDuplicate: true
      }
    ]
  };
};

export const duplicateScenario: Scenario = {
  id: "duplicate",
  createPlan: createDuplicateScenarioPlan,
  run: async (context: ScenarioContext) => {
    const plan = createDuplicateScenarioPlan(context.config);

    for (const step of plan.steps) {
      await executeStep(context, step);
    }
  }
};
