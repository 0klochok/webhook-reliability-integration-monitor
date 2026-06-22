import {
  ConfigValidationError,
  getOptionalEnv,
  parseIntegerEnv,
  parseNodeEnvironment,
  parseUrlEnv,
  type ConfigIssue
} from "@webhook-monitor/core";

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

export const loadSimulatorConfig = (env: NodeJS.ProcessEnv = process.env): SimulatorConfig => {
  const issues: ConfigIssue[] = [];
  const captureIssue = <TValue>(key: string, readValue: () => TValue): TValue | undefined => {
    try {
      return readValue();
    } catch (error) {
      issues.push({
        key,
        message: error instanceof Error ? error.message : "Invalid configuration value."
      });
      return undefined;
    }
  };
  const nodeEnv = captureIssue("NODE_ENV", () => parseNodeEnvironment(env.NODE_ENV));
  const apiBaseUrl = captureIssue("SIMULATOR_API_BASE_URL", () =>
    trimTrailingSlash(
      parseUrlEnv(env, "SIMULATOR_API_BASE_URL", {
        fallback: getOptionalEnv(env, "API_BASE_URL") ?? "http://localhost:3000",
        protocols: ["http:", "https:"]
      })
    )
  );
  const timeoutMs = captureIssue("SIMULATOR_TIMEOUT_MS", () =>
    parseIntegerEnv(env, "SIMULATOR_TIMEOUT_MS", 10_000, { minimum: 1 })
  );
  const pollTimeoutMs = captureIssue("SIMULATOR_POLL_TIMEOUT_MS", () =>
    parseIntegerEnv(env, "SIMULATOR_POLL_TIMEOUT_MS", 30_000, { minimum: 1 })
  );
  const pollIntervalMs = captureIssue("SIMULATOR_POLL_INTERVAL_MS", () =>
    parseIntegerEnv(env, "SIMULATOR_POLL_INTERVAL_MS", 500, { minimum: 1 })
  );
  const stripeSampleWebhookSecret = getOptionalEnv(env, "STRIPE_SAMPLE_WEBHOOK_SECRET");

  if (nodeEnv === "production" && !stripeSampleWebhookSecret) {
    issues.push({
      key: "STRIPE_SAMPLE_WEBHOOK_SECRET",
      message: "STRIPE_SAMPLE_WEBHOOK_SECRET is required in production."
    });
  }

  if (issues.length > 0) {
    throw new ConfigValidationError(issues, {
      SIMULATOR_API_BASE_URL: env.SIMULATOR_API_BASE_URL,
      SIMULATOR_TIMEOUT_MS: env.SIMULATOR_TIMEOUT_MS,
      SIMULATOR_POLL_TIMEOUT_MS: env.SIMULATOR_POLL_TIMEOUT_MS,
      SIMULATOR_POLL_INTERVAL_MS: env.SIMULATOR_POLL_INTERVAL_MS,
      STRIPE_SAMPLE_WEBHOOK_SECRET: env.STRIPE_SAMPLE_WEBHOOK_SECRET
    });
  }

  const resolvedApiBaseUrl = apiBaseUrl ?? "http://localhost:3000";

  return {
    apiBaseUrl: resolvedApiBaseUrl,
    dashboardUrl: `${resolvedApiBaseUrl}/dashboard`,
    stripeSampleWebhookSecret: stripeSampleWebhookSecret ?? "whsec_local_test_secret",
    timeoutMs: timeoutMs ?? 10_000,
    pollTimeoutMs: pollTimeoutMs ?? 30_000,
    pollIntervalMs: pollIntervalMs ?? 500,
    verbose: getOptionalEnv(env, "SIMULATOR_VERBOSE") === "true"
  };
};
