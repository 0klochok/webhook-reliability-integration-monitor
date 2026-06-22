import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const rootPackageJsonPath = fileURLToPath(new URL("../../../package.json", import.meta.url));
const packageJson = JSON.parse(readFileSync(rootPackageJsonPath, "utf8")) as {
  readonly scripts: Record<string, string>;
};

describe("root simulator scripts", () => {
  it("declares all documented simulator and demo scripts", () => {
    const expectedScripts = [
      "simulator:stripe-valid",
      "simulator:success",
      "simulator:duplicate",
      "simulator:invalid-signature",
      "simulator:invalid-payload",
      "simulator:mock-crm-success",
      "simulator:retry-success",
      "simulator:dead-letter",
      "simulator:permanent-failure",
      "simulator:manual-replay",
      "simulator:all",
      "demo:reset",
      "demo:seed",
      "demo:run"
    ];

    for (const script of expectedScripts) {
      expect(packageJson.scripts[script]).toEqual(expect.any(String));
    }
  });
});
