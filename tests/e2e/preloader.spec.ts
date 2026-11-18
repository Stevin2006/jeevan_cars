import { expect, test } from "@playwright/test";

const overlay = "#site-preloader";
const state = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.getAttribute("data-preloading"));

test.describe("homepage preloader", () => {
  test("shows the badge on a first visit, then reveals the page", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator(overlay)).toBeVisible();
    await expect(page.getByRole("status", { name: "Loading Jeevan Cars" })).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe("hidden");

    // Leaves within the 3 s cap plus the exit transition.
    await expect(page.locator(overlay)).toBeHidden({ timeout: 6_000 });
    expect(await state(page)).toBeNull();
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe("hidden");
    await expect(page.getByRole("link", { name: "Explore vehicles" }).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("shows once per session: not on reload or on returning to Home", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(overlay)).toBeHidden({ timeout: 6_000 });

    await page.reload();
    expect(await state(page)).toBeNull();
    await expect(page.locator(overlay)).toBeHidden();

    await page.goto("/vehicles");
    await page.getByRole("link", { name: "Home" }).first().click();
    await expect(page).toHaveURL(/\/$/);
    expect(await state(page)).toBeNull();
  });

  test("never shows on other pages", async ({ page }) => {
    await page.goto("/vehicles", { waitUntil: "commit" });
    expect(await state(page)).toBeNull();
    await expect(page.locator(overlay)).toHaveCount(0);
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("is skipped entirely", async ({ page }) => {
      await page.goto("/", { waitUntil: "commit" });
      expect(await state(page)).toBeNull();
      await expect(page.locator(overlay)).toBeHidden();
    });
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });
    test("leaves the page fully visible", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator(overlay)).toBeHidden();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });
});
