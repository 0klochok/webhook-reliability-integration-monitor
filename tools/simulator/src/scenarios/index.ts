import { allScenario } from "./all.js";
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
import type { Scenario, ScenarioId } from "./types.js";

export const scenarios = {
  "stripe-valid": stripeValidScenario,
  success: successScenario,
  duplicate: duplicateScenario,
  "invalid-signature": invalidSignatureScenario,
  "invalid-payload": invalidGenericPayloadScenario,
  "mock-crm-success": mockCrmSuccessScenario,
  "retry-success": retrySuccessScenario,
  "dead-letter": deadLetterScenario,
  "permanent-failure": permanentFailureScenario,
  "manual-replay": manualReplayScenario,
  all: allScenario
} satisfies Record<ScenarioId, Scenario>;

export const scenarioIds = Object.keys(scenarios) as ScenarioId[];

export const getScenario = (id: string): Scenario | undefined =>
  scenarios[id as ScenarioId] as Scenario | undefined;
