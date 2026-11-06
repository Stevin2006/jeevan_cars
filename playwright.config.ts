import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Only Cloudinary keys are taken from .env; the upload spec skips without them.
const local = loadEnv({ quiet: true, processEnv: {} }).parsed ?? {};
const cloudinary = Object.fromEntries(
  [
    "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "CLOUDINARY_FOLDER",
  ]
    .map((key) => [key, process.env[key] ?? local[key]])
    .filter((entry): entry is [string, string] => Boolean(entry[1])),
);

// Let the upload spec (in worker processes) see whether keys are available.
Object.assign(process.env, cloudinary);

const PORT = 3100;
const env = {
  DATABASE_URL:
    "postgresql://jeevan:jeevan_dev_password@localhost:5432/jeevan_cars_e2e?schema=public",
  NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
  AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-123456",
  NEXT_DIST_DIR: ".next-e2e",
  ALLOW_SAMPLE_IMAGES: "true",
  ...cloudinary,
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
