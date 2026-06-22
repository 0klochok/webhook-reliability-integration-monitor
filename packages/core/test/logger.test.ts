import { describe, expect, it } from "vitest";

import { createMemoryLogger } from "../src/index.js";

describe("structured logger", () => {
  it("emits structured records with service, level, and correlation context", () => {
    const logger = createMemoryLogger({
      service: "webhook-reliability-api",
      level: "debug",
      clock: () => new Date("2026-06-20T12:00:00.000Z")
    });

    logger.info("Webhook accepted.", {
      correlationId: "demo-correlation-123",
      eventId: "11111111-1111-4111-8111-111111111111"
    });

    expect(logger.records).toEqual([
      {
        timestamp: "2026-06-20T12:00:00.000Z",
        level: "info",
        service: "webhook-reliability-api",
        message: "Webhook accepted.",
        correlationId: "demo-correlation-123",
        eventId: "11111111-1111-4111-8111-111111111111"
      }
    ]);
  });

  it("redacts secret fields before writing", () => {
    const logger = createMemoryLogger({
      service: "webhook-reliability-worker",
      level: "debug"
    });

    logger.error("Startup failed.", {
      DATABASE_URL: "postgres://user:password@localhost:5432/app",
      error: new Error("Connection failed.")
    });

    expect(JSON.stringify(logger.records)).not.toContain("password");
    expect(logger.records[0]).toMatchObject({
      level: "error",
      service: "webhook-reliability-worker",
      DATABASE_URL: "[redacted]",
      error: {
        name: "Error",
        message: "Connection failed."
      }
    });
  });

  it("supports silent loggers for tests", () => {
    const logger = createMemoryLogger({
      service: "webhook-reliability-api",
      level: "silent"
    });

    logger.error("This should not be recorded.");

    expect(logger.records).toEqual([]);
  });
});
