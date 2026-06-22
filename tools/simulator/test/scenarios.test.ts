import {
  fakeStripeSampleSignatureVerifier,
  stripeSampleSignatureHeaderName
} from "@webhook-monitor/core";
import { describe, expect, it } from "vitest";

import { loadSimulatorConfig } from "../src/config.js";
import { createManualReplayRequest } from "../src/scenarios/helpers.js";
import { createDeadLetterScenarioPlan } from "../src/scenarios/dead-letter.js";
import { createDuplicateScenarioPlan } from "../src/scenarios/duplicate.js";
import { createInvalidSignatureScenarioPlan } from "../src/scenarios/invalid-signature.js";
import { createManualReplayScenarioPlan } from "../src/scenarios/manual-replay.js";
import { createMockCrmSuccessScenarioPlan } from "../src/scenarios/mock-crm-success.js";
import { createPermanentFailureScenarioPlan } from "../src/scenarios/permanent-failure.js";
import { createRetrySuccessScenarioPlan } from "../src/scenarios/retry-success.js";
import { createStripeValidScenarioPlan } from "../src/scenarios/stripe-valid.js";
import { createSuccessScenarioPlan } from "../src/scenarios/success.js";

const config = loadSimulatorConfig({} as NodeJS.ProcessEnv);

describe("scenario request construction", () => {
  it("targets expected endpoints and provider ids", () => {
    const plans = [
      createStripeValidScenarioPlan(config),
      createSuccessScenarioPlan(config),
      createMockCrmSuccessScenarioPlan(config),
      createRetrySuccessScenarioPlan(config),
      createDeadLetterScenarioPlan(config),
      createPermanentFailureScenarioPlan(config),
      createManualReplayScenarioPlan(config)
    ];

    expect(plans.map((plan) => plan.steps[0]?.request.path)).toEqual([
      "/webhooks/stripe-sample",
      "/webhooks/generic-http",
      "/webhooks/mock-crm",
      "/webhooks/generic-http",
      "/webhooks/generic-http",
      "/webhooks/generic-http",
      "/webhooks/generic-http"
    ]);
    expect(plans.map((plan) => plan.steps[0]?.providerId)).toEqual([
      "stripe-sample",
      "generic-http",
      "mock-crm",
      "generic-http",
      "generic-http",
      "generic-http",
      "generic-http"
    ]);
  });

  it("does not accidentally create a valid signature for the invalid-signature scenario", () => {
    const step = createInvalidSignatureScenarioPlan(config).steps[0];
    expect(step?.request.headers?.[stripeSampleSignatureHeaderName]).toBeDefined();

    const verification = fakeStripeSampleSignatureVerifier.verify({
      providerId: "stripe-sample",
      rawBody: step?.request.body ?? "",
      headers: step?.request.headers ?? {},
      secret: config.stripeSampleWebhookSecret,
      now: new Date(1_787_225_600 * 1000),
      timestampToleranceSeconds: 300
    });

    expect(verification.verified).toBe(false);
  });

  it("sends duplicate requests with the same external event id", () => {
    const plan = createDuplicateScenarioPlan(config);

    expect(plan.steps).toHaveLength(2);
    expect(plan.steps[0]?.externalEventId).toBe("generic_demo_duplicate");
    expect(plan.steps[1]?.externalEventId).toBe("generic_demo_duplicate");
    expect(plan.steps[0]?.request.body).toBe(plan.steps[1]?.request.body);
  });

  it("constructs manual replay JSON route requests", () => {
    expect(createManualReplayRequest("11111111-1111-4111-8111-111111111111")).toEqual({
      method: "POST",
      path: "/api/dashboard/events/11111111-1111-4111-8111-111111111111/replay"
    });
  });
});
