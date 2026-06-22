import { ConfigValidationError } from "@webhook-monitor/core";
import { describe, expect, it } from "vitest";

import { resolveRedisUrl, validateRedisUrl } from "../src/index.js";

describe("queue connection configuration", () => {
  it("validates redis URLs", () => {
    expect(resolveRedisUrl({ redisUrl: "redis://localhost:6379" })).toBe("redis://localhost:6379");
  });

  it("rejects malformed redis URLs safely", () => {
    expect(() => validateRedisUrl("not-a-url")).toThrow(ConfigValidationError);
    expect(() => validateRedisUrl("http://localhost:6379")).toThrow(ConfigValidationError);
  });
});
