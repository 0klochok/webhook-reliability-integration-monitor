import type { SimulatorConfig } from "../config.js";
import { createGenericHttpDemoPayload } from "../payloads/generic-http.js";
import { jsonPost, pollEventStatus, postManualReplay, runWebhookScenario } from "./helpers.js";
import type { Scenario, ScenarioContext, ScenarioPlan } from "./types.js";

export const createManualReplayScenarioPlan = (_config: SimulatorConfig): ScenarioPlan => {
  void _config;
  const payload = createGenericHttpDemoPayload({
    eventId: "generic_demo_manual_replay",
    deliveryBehavior: "fail-until-manual-replay-success"
  });

  return {
    id: "manual-replay",
    name: "Manual replay",
    expectedBehavior: "event dead-letters, replay is queued, replay delivery succeeds",
    steps: [
      {
        label: "Create replayable failure",
        providerId: "generic-http",
        externalEventId: payload.eventId,
        expectedBehavior: "normal delivery fails until the event is dead-lettered",
        request: jsonPost("/webhooks/generic-http", payload),
        expectedHttpStatuses: [200],
        expectedDuplicate: false,
        allowExistingDuplicate: true
      }
    ],
    finalStatuses: ["dead_lettered"]
  };
};

export const manualReplayScenario: Scenario = {
  id: "manual-replay",
  createPlan: createManualReplayScenarioPlan,
  run: async (context: ScenarioContext) => {
    const result = await runWebhookScenario(
      context,
      createManualReplayScenarioPlan(context.config)
    );

    if (!result.eventId || result.duplicate) {
      return;
    }

    await postManualReplay(context, result.eventId);
    await pollEventStatus(context, result.eventId, ["delivered"]);
  }
};
