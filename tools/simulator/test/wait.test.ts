import { describe, expect, it } from "vitest";

import { pollUntil } from "../src/wait.js";

describe("polling helper", () => {
  it("returns success when expected final status appears", async () => {
    let calls = 0;

    await expect(
      pollUntil({
        timeoutMs: 100,
        intervalMs: 1,
        fetchValue: async () => {
          calls += 1;
          return calls >= 2 ? "delivered" : "queued";
        },
        isExpected: (value) => value === "delivered",
        describeValue: (value) => value,
        sleep: async () => undefined
      })
    ).resolves.toBe("delivered");
  });

  it("times out with a clear error and does not loop forever", async () => {
    await expect(
      pollUntil({
        timeoutMs: -1,
        intervalMs: 1,
        fetchValue: async () => "queued",
        isExpected: (value) => value === "delivered",
        describeValue: (value) => value,
        sleep: async () => undefined
      })
    ).rejects.toThrow("Timed out");
  });
});
