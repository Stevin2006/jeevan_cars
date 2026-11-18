import { describe, expect, it } from "vitest";
import { serverEnvSchema, withDefaults } from "@/lib/env";

describe("env defaults", () => {
  it("uses the Vercel production domain when no site URL is set", () => {
    expect(
      withDefaults({ VERCEL_PROJECT_PRODUCTION_URL: "jeevan-cars.vercel.app" })
        .NEXT_PUBLIC_SITE_URL,
    ).toBe("https://jeevan-cars.vercel.app");
  });

  it("keeps an explicit site URL (e.g. a custom domain)", () => {
    expect(
      withDefaults({
        NEXT_PUBLIC_SITE_URL: "https://jeevancars.in",
        VERCEL_PROJECT_PRODUCTION_URL: "jeevan-cars.vercel.app",
      }).NEXT_PUBLIC_SITE_URL,
    ).toBe("https://jeevancars.in");
  });

  it("leaves the environment alone off Vercel", () => {
    expect(withDefaults({}).NEXT_PUBLIC_SITE_URL).toBeUndefined();
  });
});

describe("server env validation", () => {
  const base = {
    NODE_ENV: "production",
    AUTH_SECRET: "x".repeat(40),
    NEXT_PUBLIC_SITE_URL: "https://jeevan-cars.vercel.app",
    DATABASE_URL:
      "postgresql://user:pw@ep-example-pooler.c-15.us-east-1.aws.neon.tech/neondb?sslmode=verify-full",
  };
  const problems = (env: Record<string, string>) => {
    const result = serverEnvSchema.safeParse(env);
    return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
  };

  it("accepts a Neon database on Vercel", () => {
    expect(problems({ ...base, VERCEL: "1" })).toEqual([]);
  });

  it("rejects a localhost database or site URL copied into Vercel", () => {
    expect(
      problems({
        ...base,
        VERCEL: "1",
        DATABASE_URL: "postgresql://jeevan:pw@localhost:5432/jeevan_cars?schema=public",
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      }),
    ).toEqual(["DATABASE_URL", "NEXT_PUBLIC_SITE_URL"]);
    expect(
      problems({ ...base, VERCEL: "1", DATABASE_URL: "postgresql://u:p@127.0.0.1:5432/db" }),
    ).toEqual(["DATABASE_URL"]);
  });

  it("still allows localhost for local production builds off Vercel", () => {
    expect(
      problems({
        ...base,
        DATABASE_URL: "postgresql://jeevan:pw@localhost:5432/jeevan_cars",
        NEXT_PUBLIC_SITE_URL: "http://localhost:3100",
      }),
    ).toEqual([]);
  });

  it("requires https for a real production domain", () => {
    expect(problems({ ...base, NEXT_PUBLIC_SITE_URL: "http://jeevancars.in" })).toEqual([
      "NEXT_PUBLIC_SITE_URL",
    ]);
  });
});
