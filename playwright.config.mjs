import { defineConfig, devices } from "@playwright/test";
import { requireSafeMutationTarget } from "./tests/helpers/qa-mutation-target.mjs";

const remoteBaseURL = process.env.TEST_BASE_URL || "";
if (remoteBaseURL) requireSafeMutationTarget(remoteBaseURL);

export default defineConfig({
  testDir: "./tests",
  timeout: 90_000,
  workers: 1,
  expect: { timeout: 12_000 },
  retries: 0,
  reporter: [["line"]],
  use: {
    actionTimeout: 15_000,
    baseURL: remoteBaseURL || "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    ...devices["Galaxy S9+"],
  },
});
