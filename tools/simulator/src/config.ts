export interface SimulatorConfig {
  readonly apiBaseUrl: string;
  readonly dashboardUrl: string;
  readonly stripeSampleWebhookSecret: string;
  readonly timeoutMs: number;
  readonly pollTimeoutMs: number;
  readonly pollIntervalMs: number;
  readonly verbose: boolean;
}

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const getOptionalEnv = (env: NodeJS.ProcessEnv, key: string): string | undefined => {
  const value = env[key]?.trim();
  return value ? value : undefined;
};

const parsePositiveInteger = (env: NodeJS.ProcessEnv, key: string, fallback: number): number => {
  const value = getOptionalEnv(env, key);

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${key} must be a positive integer.`);
  }

  return parsed;
};

export const loadSimulatorConfig = (env: NodeJS.ProcessEnv = process.env): SimulatorConfig => {
  const apiBaseUrl = trimTrailingSlash(
    getOptionalEnv(env, "SIMULATOR_API_BASE_URL") ??
      getOptionalEnv(env, "API_BASE_URL") ??
      "http://localhost:3000"
  );

  return {
    apiBaseUrl,
    dashboardUrl: `${apiBaseUrl}/dashboard`,
    stripeSampleWebhookSecret:
      getOptionalEnv(env, "STRIPE_SAMPLE_WEBHOOK_SECRET") ?? "whsec_local_test_secret",
    timeoutMs: parsePositiveInteger(env, "SIMULATOR_TIMEOUT_MS", 10_000),
    pollTimeoutMs: parsePositiveInteger(env, "SIMULATOR_POLL_TIMEOUT_MS", 30_000),
    pollIntervalMs: parsePositiveInteger(env, "SIMULATOR_POLL_INTERVAL_MS", 500),
    verbose: getOptionalEnv(env, "SIMULATOR_VERBOSE") === "true"
  };
};
