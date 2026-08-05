import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  webServer: {
    command: "node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173/",
    reuseExistingServer: false,
    timeout: 60_000,
  },
  testDir: "./tests",
  timeout: 90_000,
  workers: 1,
  expect: { timeout: 12_000 },
  retries: 0,
  reporter: [["line"]],
  use: {
    actionTimeout: 15_000,
    baseURL: process.env.TEST_BASE_URL || "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    ...devices["Galaxy S9+"],
  },
});
