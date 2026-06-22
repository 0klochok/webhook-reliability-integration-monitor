import { describe, expect, it } from "vitest";

import {
  ConfigValidationError,
  OperationalError,
  getErrorDefinition,
  parseIntegerEnv
} from "../src/index.js";

describe("error taxonomy", () => {
  it("maps known error codes to HTTP status and safe messages", () => {
    expect(getErrorDefinition("rate_limited")).toMatchObject({
      statusCode: 429,
      publicMessage: "Too many webhook requests. Try again later.",
      retryable: true,
      logLevel: "warn"
    });
    expect(getErrorDefinition("queue_unavailable")).toMatchObject({
      statusCode: 503,
      retryable: true,
      logLevel: "error"
    });
  });

  it("creates operational errors from taxonomy defaults", () => {
    const error = new OperationalError({ code: "database_unavailable" });

    expect(error).toMatchObject({
      code: "database_unavailable",
      statusCode: 503,
      publicMessage: "Database dependency is unavailable.",
      retryable: true
    });
  });

  it("reports malformed config values without exposing secret diagnostics", () => {
    expect(() => parseIntegerEnv({ API_PORT: "not-a-port" }, "API_PORT", 3000)).toThrow(
      "API_PORT must be an integer"
    );

    const error = new ConfigValidationError(
      [{ key: "DATABASE_URL", message: "DATABASE_URL is required." }],
      {
        DATABASE_URL: "postgres://user:password@localhost:5432/app",
        providerId: "generic-http"
      }
    );

    expect(error.code).toBe("config_invalid");
    expect(JSON.stringify(error.diagnostics)).not.toContain("password");
    expect(error.diagnostics.providerId).toBe("generic-http");
  });
});
