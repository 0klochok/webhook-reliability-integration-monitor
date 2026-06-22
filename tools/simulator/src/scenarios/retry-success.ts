import type { SimulatorConfig } from "../config.js";
import { createGenericHttpDemoPayload } from "../payloads/generic-http.js";
import { jsonPost, runWebhookScenario } from "./helpers.js";
import type { Scenario, ScenarioContext, ScenarioPlan } from "./types.js";

export const createRetrySuccessScenarioPlan = (_config: SimulatorConfig): ScenarioPlan => {
  void _config;
  const payload = createGenericHttpDemoPayload({
    eventId: "generic_demo_retry_success",
    deliveryBehavior: "fail-once-then-success"
  });

  return {
    id: "retry-success",
    name: "Retry success",
    expectedBehavior: "worker records a retryable failure and then delivers on retry",
    finalStatuses: ["delivered"],
    steps: [
      {
        label: "Retry success",
        providerId: "generic-http",
        externalEventId: payload.eventId,
        expectedBehavior: "first downstream attempt fails, retry succeeds",
        request: jsonPost("/webhooks/generic-http", payload),
        expectedHttpStatuses: [200],
        expectedDuplicate: false,
        allowExistingDuplicate: true
      }
    ]
  };
};

export const retrySuccessScenario: Scenario = {
  id: "retry-success",
  createPlan: createRetrySuccessScenarioPlan,
  run: async (context: ScenarioContext) => {
    await runWebhookScenario(context, createRetrySuccessScenarioPlan(context.config));
  }
};
