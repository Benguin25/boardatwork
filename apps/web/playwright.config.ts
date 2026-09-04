import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // One local retry absorbs resource-contention flakes from running the
  // production server under multiple parallel workers in a constrained
  // sandbox; a real failure still fails after the retry.
  retries: process.env.CI ? 2 : 1,
  reporter: [["list"]],
  // The visual baselines double as the reviewable "current screens" in
  // docs/design/current, so they live there rather than beside the spec.
  snapshotPathTemplate: "../../docs/design/current/{arg}{ext}",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath:
            process.env.PLAYWRIGHT_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium",
        },
      },
    },
  ],
  webServer: {
    command: "npm run build && npm run start -- -p 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
