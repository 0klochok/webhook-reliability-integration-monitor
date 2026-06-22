import type { SimulatorConfig } from "../config.js";
import { createInvalidGenericHttpDemoPayload } from "../payloads/generic-http.js";
import { jsonPost, runWebhookScenario } from "./helpers.js";
import type { Scenario, ScenarioContext, ScenarioPlan } from "./types.js";

export const createInvalidGenericPayloadScenarioPlan = (_config: SimulatorConfig): ScenarioPlan => {
  void _config;
  const payload = createInvalidGenericHttpDemoPayload();

  return {
    id: "invalid-payload",
    name: "Invalid generic HTTP payload",
    expectedBehavior: "request rejected with 400 and persisted as rejected_invalid_payload",
    steps: [
      {
        label: "Invalid generic HTTP payload",
        providerId: "generic-http",
        externalEventId: String(payload.eventId),
        expectedBehavior: "schema validation fails and the event is not queued",
        request: jsonPost("/webhooks/generic-http", payload),
        expectedHttpStatuses: [400]
      }
    ]
  };
};

export const invalidGenericPayloadScenario: Scenario = {
  id: "invalid-payload",
  createPlan: createInvalidGenericPayloadScenarioPlan,
  run: async (context: ScenarioContext) => {
    await runWebhookScenario(context, createInvalidGenericPayloadScenarioPlan(context.config));
  }
};
