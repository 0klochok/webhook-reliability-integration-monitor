import { ConfigValidationError } from "@webhook-monitor/core";
import { describe, expect, it } from "vitest";

import { loadSimulatorConfig } from "../src/config.js";

describe("simulator configuration validation", () => {
  it("loads valid simulator config", () => {
    expect(
      loadSimulatorConfig({
        SIMULATOR_API_BASE_URL: "http://localhost:3000",
        SIMULATOR_TIMEOUT_MS: "10000",
        SIMULATOR_POLL_TIMEOUT_MS: "30000",
        SIMULATOR_POLL_INTERVAL_MS: "500",
        STRIPE_SAMPLE_WEBHOOK_SECRET: "whsec_local_test_secret"
      })
    ).toMatchObject({
      apiBaseUrl: "http://localhost:3000",
      dashboardUrl: "http://localhost:3000/dashboard",
      timeoutMs: 10_000,
      pollTimeoutMs: 30_000,
      pollIntervalMs: 500
    });
  });

  it("rejects malformed URLs and timeouts", () => {
    expect(() =>
      loadSimulatorConfig({
        SIMULATOR_API_BASE_URL: "not-a-url"
      })
    ).toThrow(ConfigValidationError);
    expect(() =>
      loadSimulatorConfig({
        SIMULATOR_TIMEOUT_MS: "0"
      })
    ).toThrow(ConfigValidationError);
  });
});
