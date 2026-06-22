import type { SimulatorConfig } from "../config.js";
import { createStripeSampleDemoPayload } from "../payloads/stripe.js";
import { createStripeSampleSignedHeaders } from "../signing/stripe-sample-signing.js";
import { jsonPost, runWebhookScenario } from "./helpers.js";
import type { Scenario, ScenarioContext, ScenarioPlan } from "./types.js";

export const createStripeValidScenarioPlan = (config: SimulatorConfig): ScenarioPlan => {
  const payload = createStripeSampleDemoPayload("evt_demo_stripe_valid");
  const rawBody = JSON.stringify(payload);

  return {
    id: "stripe-valid",
    name: "Valid Stripe-style signed event",
    expectedBehavior: "accepted and queued after fake HMAC verification",
    steps: [
      {
        label: "Valid Stripe-style signed event",
        providerId: "stripe-sample",
        externalEventId: payload.id,
        expectedBehavior: "signature verifies and the event is queued",
        request: {
          ...jsonPost(
            "/webhooks/stripe-sample",
            payload,
            createStripeSampleSignedHeaders({
              rawBody,
              secret: config.stripeSampleWebhookSecret
            })
          ),
          body: rawBody
        },
        expectedHttpStatuses: [200],
        expectedDuplicate: false,
        allowExistingDuplicate: true
      }
    ]
  };
};

export const stripeValidScenario: Scenario = {
  id: "stripe-valid",
  createPlan: createStripeValidScenarioPlan,
  run: async (context: ScenarioContext) => {
    await runWebhookScenario(context, createStripeValidScenarioPlan(context.config));
  }
};
