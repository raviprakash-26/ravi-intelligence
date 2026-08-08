import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use the Chromium already present in the image when its build number
        // does not match what this Playwright version would fetch. Without this
        // every run tries to download a browser it cannot reach.
        ...(process.env.CHROMIUM_EXECUTABLE_PATH
          ? { launchOptions: { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } }
          : {}),
      },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    // A cold start on a CI runner is a good deal slower than the 60s default.
    timeout: 180_000,
    env: {
      // The books module needs somewhere to put its database and a session
      // signing key. Both are pointed at throwaway values so a test run never
      // touches a real store's data.
      BOOKS_DATABASE_PATH: ".playwright/books-e2e.db",
      BOOKS_SESSION_SECRET: "e2e-only-session-secret-not-for-production-use",
    },
  },
});
