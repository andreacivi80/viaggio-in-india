import { defineConfig, devices } from "@playwright/test";
import { requireSafeMutationTarget } from "./tests/helpers/qa-mutation-target.mjs";

const remoteBaseURL = process.env.TEST_BASE_URL || "";
if (remoteBaseURL) requireSafeMutationTarget(remoteBaseURL);

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.mjs",
  timeout: 120_000,
  workers: 1,
  retries: 0,
  reporter: [["line"]],
  use: {
    baseURL: remoteBaseURL || "http://127.0.0.1:4186",
    actionTimeout: 20_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "Samsung-S20-FE",
      use: {
        ...devices["Galaxy S9+"],
        viewport: { width: 412, height: 915 },
        userAgent: "Mozilla/5.0 (Linux; Android 13; SM-G780G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Mobile Safari/537.36",
      },
    },
    {
      name: "Samsung-vecchio",
      use: {
        ...devices["Galaxy S9+"],
        viewport: { width: 360, height: 740 },
        userAgent: "Mozilla/5.0 (Linux; Android 9; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.0.0 Mobile Safari/537.36",
      },
    },
    {
      name: "iPhone-piccolo",
      use: { ...devices["iPhone SE"] },
    },
  ],
  webServer: remoteBaseURL ? undefined : {
    command: "npx vite preview --host 127.0.0.1 --port 4186",
    url: "http://127.0.0.1:4186",
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
