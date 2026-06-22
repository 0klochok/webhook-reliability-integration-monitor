import { ConfigValidationError } from "@webhook-monitor/core";
import { describe, expect, it } from "vitest";

import { loadApiConfig } from "../src/config.js";

const validEnv = {
  NODE_ENV: "development",
  API_HOST: "localhost",
  API_PORT: "3000",
  DATABASE_URL:
    "postgres://webhook_monitor:webhook_monitor_password@localhost:5432/webhook_monitor",
  REDIS_URL: "redis://localhost:6379",
  STRIPE_SAMPLE_WEBHOOK_SECRET: "whsec_local_test_secret",
  WEBHOOK_MAX_BODY_BYTES: "1048576",
  WEBHOOK_RATE_LIMIT_WINDOW_MS: "60000",
  WEBHOOK_RATE_LIMIT_MAX_REQUESTS: "120",
  LOG_LEVEL: "info"
};

describe("API configuration validation", () => {
  it("loads valid configuration", () => {
    expect(loadApiConfig(validEnv)).toMatchObject({
      nodeEnv: "development",
      host: "localhost",
      port: 3000,
      databaseUrl: validEnv.DATABASE_URL,
      redisUrl: validEnv.REDIS_URL,
      webhookMaxBodyBytes: 1_048_576,
      webhookRateLimitWindowMs: 60_000,
      webhookRateLimitMaxRequests: 120,
      logLevel: "info"
    });
  });

  it("fails when DATABASE_URL is missing", () => {
    expect(() =>
      loadApiConfig({
        ...validEnv,
        DATABASE_URL: undefined
      })
    ).toThrow(ConfigValidationError);
  });

  it("fails when API_PORT is malformed", () => {
    expect(() =>
      loadApiConfig({
        ...validEnv,
        API_PORT: "not-a-port"
      })
    ).toThrow(ConfigValidationError);
  });

  it("fails when REDIS_URL is malformed", () => {
    expect(() =>
      loadApiConfig({
        ...validEnv,
        REDIS_URL: "not-a-url"
      })
    ).toThrow(ConfigValidationError);
  });

  it("requires webhook secret in production without exposing diagnostics", () => {
    try {
      loadApiConfig({
        ...validEnv,
        NODE_ENV: "production",
        STRIPE_SAMPLE_WEBHOOK_SECRET: undefined
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigValidationError);
      expect(JSON.stringify((error as ConfigValidationError).diagnostics)).not.toContain(
        "whsec_local_test_secret"
      );
    }
  });
});
