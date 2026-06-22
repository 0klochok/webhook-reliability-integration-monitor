import { ConfigValidationError } from "@webhook-monitor/core";
import { describe, expect, it } from "vitest";

import { loadWorkerConfig } from "../src/config.js";

const validEnv = {
  NODE_ENV: "development",
  DATABASE_URL:
    "postgres://webhook_monitor:webhook_monitor_password@localhost:5432/webhook_monitor",
  REDIS_URL: "redis://localhost:6379",
  WORKER_CONCURRENCY: "2",
  DELIVERY_MAX_ATTEMPTS: "3",
  DELIVERY_INITIAL_DELAY_MS: "1000",
  DELIVERY_BACKOFF_MULTIPLIER: "2",
  DELIVERY_MAX_DELAY_MS: "30000",
  MOCK_DOWNSTREAM_MODE: "payload-driven",
  MOCK_DOWNSTREAM_URL: "http://localhost:3000/mock-downstream/deliver",
  LOG_LEVEL: "info"
};

describe("worker configuration validation", () => {
  it("loads valid worker configuration", () => {
    expect(loadWorkerConfig(validEnv)).toMatchObject({
      nodeEnv: "development",
      databaseUrl: validEnv.DATABASE_URL,
      redisUrl: validEnv.REDIS_URL,
      concurrency: 2,
      serviceName: "webhook-reliability-worker",
      logLevel: "info"
    });
  });

  it("fails when DATABASE_URL is missing", () => {
    expect(() =>
      loadWorkerConfig({
        ...validEnv,
        DATABASE_URL: undefined
      })
    ).toThrow(ConfigValidationError);
  });

  it("fails when REDIS_URL is malformed", () => {
    expect(() =>
      loadWorkerConfig({
        ...validEnv,
        REDIS_URL: "not-a-url"
      })
    ).toThrow(ConfigValidationError);
  });

  it("fails when numeric worker settings are malformed", () => {
    expect(() =>
      loadWorkerConfig({
        ...validEnv,
        WORKER_CONCURRENCY: "0"
      })
    ).toThrow(ConfigValidationError);
    expect(() =>
      loadWorkerConfig({
        ...validEnv,
        DELIVERY_BACKOFF_MULTIPLIER: "0"
      })
    ).toThrow(ConfigValidationError);
  });
});
