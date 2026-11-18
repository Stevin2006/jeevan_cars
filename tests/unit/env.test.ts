import { describe, expect, it } from "vitest";
import { withDefaults } from "@/lib/env";

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
