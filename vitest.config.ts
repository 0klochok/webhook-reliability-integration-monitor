import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["{apps,packages,tools}/**/*.{test,spec}.ts"],
    passWithNoTests: true
  }
});
