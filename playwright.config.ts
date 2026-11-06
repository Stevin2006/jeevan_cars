import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const env = {
  DATABASE_URL:
    "postgresql://jeevan:jeevan_dev_password@localhost:5432/jeevan_cars_e2e?schema=public",
  NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
  AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-123456",
  NEXT_DIST_DIR: ".next-e2e",
};

/**
 * End-to-end tests against a production build on an isolated database.
 * Run `npm run test:e2e`, which recreates the database first.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 45_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], channel: "chrome" },
      testMatch: /public\.spec\.ts/,
    },
  ],
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    timeout: 300_000,
    reuseExistingServer: false,
    env,
  },
});
