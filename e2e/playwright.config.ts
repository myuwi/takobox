import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.TAKOBOX_E2E_BASE_URL;
const baseURL = externalBaseUrl ?? "http://127.0.0.1:8081";

export default defineConfig({
  testDir: "./specs",
  outputDir: "./.artifacts/results",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,

  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder: ".artifacts/report",
        open: "never",
      },
    ],
  ],

  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: externalBaseUrl
    ? undefined
    : {
        command: "bash stack.sh",
        url: `${baseURL}/api/settings`,
        reuseExistingServer: false,
        timeout: 15 * 60 * 1000,
        gracefulShutdown: {
          signal: "SIGTERM",
          timeout: 30_000,
        },
        stdout: "pipe",
      },
});
