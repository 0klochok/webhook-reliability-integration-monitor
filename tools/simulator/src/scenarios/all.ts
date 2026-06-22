import { assertCleanDashboard } from "./helpers.js";
import { deadLetterScenario } from "./dead-letter.js";
import { duplicateScenario } from "./duplicate.js";
import { invalidGenericPayloadScenario } from "./invalid-generic-payload.js";
import { invalidSignatureScenario } from "./invalid-signature.js";
import { manualReplayScenario } from "./manual-replay.js";
import { mockCrmSuccessScenario } from "./mock-crm-success.js";
import { permanentFailureScenario } from "./permanent-failure.js";
import { retrySuccessScenario } from "./retry-success.js";
import { stripeValidScenario } from "./stripe-valid.js";
import { successScenario } from "./success.js";
import type { SimulatorConfig } from "../config.js";
import type { Scenario, ScenarioContext, ScenarioPlan } from "./types.js";

const scenarios = [
  stripeValidScenario,
  successScenario,
  duplicateScenario,
  invalidSignatureScenario,
  invalidGenericPayloadScenario,
  mockCrmSuccessScenario,
  retrySuccessScenario,
  deadLetterScenario,
  permanentFailureScenario,
  manualReplayScenario
] as const;

export const createAllScenarioPlan = (config: SimulatorConfig): ScenarioPlan => ({
  id: "all",
  name: "All Phase 6 simulator scenarios",
  expectedBehavior: "run the repeatable local demo sequence against a clean database",
  steps: scenarios.flatMap((scenario) => scenario.createPlan(config).steps)
});

export const allScenario: Scenario = {
  id: "all",
  createPlan: createAllScenarioPlan,
  run: async (context: ScenarioContext) => {
    await assertCleanDashboard(context);

    for (const scenario of scenarios) {
      await scenario.run(context);
    }
  }
};
