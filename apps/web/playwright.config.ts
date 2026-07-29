import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

const e2eServerEnv: Record<string, string> = {
  STORAGE_LOCAL_PATH: process.env.STORAGE_LOCAL_PATH ?? "/tmp/dadan-uploads",
  AUTH_RATE_LIMIT_MAX: process.env.AUTH_RATE_LIMIT_MAX ?? "100",
};

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI
    ? [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]]
    : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: isCI
    ? {
        command: "bash scripts/start-e2e-dev.sh",
        cwd: "../..",
        url: "http://localhost:3000/beta",
        reuseExistingServer: false,
        timeout: 300_000,
        env: e2eServerEnv,
      }
    : [
        {
          command: "bash scripts/start-e2e-api.sh",
          cwd: "../..",
          url: "http://127.0.0.1:4000/health/live",
          reuseExistingServer: true,
          timeout: 180_000,
          env: e2eServerEnv,
        },
        {
          command: "pnpm --filter @dadan/web dev",
          cwd: "../..",
          url: "http://127.0.0.1:3000/beta",
          reuseExistingServer: true,
          timeout: 180_000,
        },
      ],
});
