import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "e2e-results",
  testMatch: ["**/*.test.mjs"],
});
