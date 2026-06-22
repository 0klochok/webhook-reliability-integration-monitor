import type { SimulatorConfig } from "../config.js";
import { createGenericHttpDemoPayload } from "../payloads/generic-http.js";
import { jsonPost, runWebhookScenario } from "./helpers.js";
import type { Scenario, ScenarioContext, ScenarioPlan } from "./types.js";

export const createDeadLetterScenarioPlan = (_config: SimulatorConfig): ScenarioPlan => {
  void _config;
  const payload = createGenericHttpDemoPayload({
    eventId: "generic_demo_dead_letter",
    deliveryBehavior: "always-retryable-fail"
  });

  return {
    id: "dead-letter",
    name: "Dead-letter after retry exhaustion",
    expectedBehavior: "worker exhausts retry attempts and creates a dead-letter record",
    finalStatuses: ["dead_lettered"],
    steps: [
      {
        label: "Dead-letter after retry exhaustion",
        providerId: "generic-http",
        externalEventId: payload.eventId,
        expectedBehavior: "retryable downstream failures end in dead_lettered",
        request: jsonPost("/webhooks/generic-http", payload),
        expectedHttpStatuses: [200],
        expectedDuplicate: false,
        allowExistingDuplicate: true
      }
    ]
  };
};

export const deadLetterScenario: Scenario = {
  id: "dead-letter",
  createPlan: createDeadLetterScenarioPlan,
  run: async (context: ScenarioContext) => {
    await runWebhookScenario(context, createDeadLetterScenarioPlan(context.config));
  }
};
