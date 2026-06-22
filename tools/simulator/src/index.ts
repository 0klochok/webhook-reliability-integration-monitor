import { loadSimulatorConfig } from "./config.js";
import { createSimulatorHttpClient } from "./http-client.js";
import { getScenario, scenarioIds } from "./scenarios/index.js";

const usage = (): string => `Usage: pnpm --filter @webhook-monitor/simulator start -- <scenario>

Scenarios:
${scenarioIds.map((id) => `  - ${id}`).join("\n")}`;

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const scenarioId = args[0] === "--" ? args[1] : args[0];

  if (!scenarioId || scenarioId === "--help" || scenarioId === "-h") {
    console.log(usage());
    return;
  }

  const scenario = getScenario(scenarioId);

  if (!scenario) {
    throw new Error(`Unknown simulator scenario "${scenarioId}".\n${usage()}`);
  }

  const config = loadSimulatorConfig();
  const http = createSimulatorHttpClient(config);

  console.log(`API base URL: ${config.apiBaseUrl}`);
  console.log(`Dashboard URL: ${config.dashboardUrl}`);

  await scenario.run({
    config,
    http
  });
};

main().catch((error: unknown) => {
  const config = loadSimulatorConfig();
  const message = error instanceof Error ? error.message : "Unknown simulator error.";
  console.error(`Simulator failed: ${message}`);

  if (config.verbose && error instanceof Error && error.stack) {
    console.error(error.stack);
  }

  process.exitCode = 1;
});
