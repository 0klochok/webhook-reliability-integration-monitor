import type { SimulatorConfig } from "../config.js";
import { createStripeSampleDemoPayload } from "../payloads/stripe.js";
import { createInvalidStripeSampleSignedHeaders } from "../signing/stripe-sample-signing.js";
import { jsonPost, runWebhookScenario } from "./helpers.js";
import type { Scenario, ScenarioContext, ScenarioPlan } from "./types.js";

export const createInvalidSignatureScenarioPlan = (_config: SimulatorConfig): ScenarioPlan => {
  void _config;
  const payload = createStripeSampleDemoPayload("evt_demo_invalid_signature");

  return {
    id: "invalid-signature",
    name: "Invalid Stripe-style signature",
    expectedBehavior: "request rejected with 401 and persisted as rejected_invalid_signature",
    steps: [
      {
        label: "Invalid Stripe-style signature",
        providerId: "stripe-sample",
        externalEventId: payload.id,
        expectedBehavior: "signature mismatch is rejected and not queued",
        request: jsonPost(
          "/webhooks/stripe-sample",
          payload,
          createInvalidStripeSampleSignedHeaders()
        ),
        expectedHttpStatuses: [401]
      }
    ]
  };
};

export const invalidSignatureScenario: Scenario = {
  id: "invalid-signature",
  createPlan: createInvalidSignatureScenarioPlan,
  run: async (context: ScenarioContext) => {
    await runWebhookScenario(context, createInvalidSignatureScenarioPlan(context.config));
  }
};
