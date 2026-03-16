import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration for Infæmous Freight E2E Tests
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",

  /* Maximum time one test can run for */
  timeout: 30 * 1000,

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results.json" }],
    ["junit", { outputFile: "test-results.xml" }],
    ["list"],
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    /* API endpoint */
    apiURL: process.env.API_URL || "http://localhost:4000",

    /* Collect trace when retrying the failed test */
    trace: "on-first-retry",

    /* Screenshot on failure */
    screenshot: "only-on-failure",

    /* Video on failure */
    video: "retain-on-failure",

    /* Maximum time for actions */
    actionTimeout: 10 * 1000,

    /* Maximum time for navigation */
    navigationTimeout: 15 * 1000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* Test against mobile viewports */
    {
      name: "mobile",
      use: { ...devices["iPhone 13"] },
    },

    /* Test against branded browsers */
    {
      name: "Microsoft Edge",
      use: { ...devices["Desktop Edge"], channel: "msedge" },
    },

    {
      name: "Google Chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI
    ? undefined
    : [
        {
          command: "cd ../apps/web && pnpm dev",
          url: "http://localhost:3000",
          timeout: 120 * 1000,
          reuseExistingServer: !process.env.CI,
        },
        {
          command: "cd ../apps/api && pnpm dev",
          url: "http://localhost:4000/api/health",
          timeout: 120 * 1000,
          reuseExistingServer: !process.env.CI,
        },
      ],
});
