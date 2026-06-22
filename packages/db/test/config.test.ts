import { ConfigValidationError } from "@webhook-monitor/core";
import { describe, expect, it } from "vitest";

import { resolveDatabaseUrl, validateDatabaseUrl } from "../src/index.js";

describe("database configuration", () => {
  it("validates postgres URLs", () => {
    expect(validateDatabaseUrl("postgres://user:password@localhost:5432/app")).toBe(
      "postgres://user:password@localhost:5432/app"
    );
  });

  it("rejects missing and malformed database URLs safely", () => {
    expect(() => resolveDatabaseUrl({ databaseUrl: "" })).toThrow(ConfigValidationError);
    expect(() => validateDatabaseUrl("not-a-url")).toThrow(ConfigValidationError);
    expect(() => validateDatabaseUrl("mysql://localhost:3306/app")).toThrow(ConfigValidationError);
  });

  it("redacts database URL diagnostics", () => {
    try {
      validateDatabaseUrl("not-a-url");
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigValidationError);
      expect(JSON.stringify((error as ConfigValidationError).diagnostics)).not.toContain(
        "password"
      );
    }
  });
});
