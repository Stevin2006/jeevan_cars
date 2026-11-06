import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      // `server-only` throws outside a React Server environment; tests run in Node.
      {
        find: "server-only",
        replacement: fileURLToPath(new URL("./tests/stubs/empty.ts", import.meta.url)),
      },
      { find: /^@\//, replacement: `${src}/` },
    ],
  },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // Integration tests share one database, so files run one at a time.
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        "postgresql://jeevan:jeevan_dev_password@localhost:5432/jeevan_cars_test?schema=public",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      AUTH_SECRET: "test-secret-test-secret-test-secret-1234",
    },
  },
});
