import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PAGES = ["/", "/vehicles", "/vehicles/honda-city-vx-cvt-2019", "/about", "/contact"];

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("public pages", () => {
  for (const path of PAGES) {
    test(`${path} renders with SEO basics, no errors, no overflow`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
      await page.addInitScript(() => {
        document.addEventListener("securitypolicyviolation", (event) =>
          console.error(`CSP violation: ${event.violatedDirective} ${event.blockedURI}`),
        );
      });

      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page).toHaveTitle(/Jeevan Cars/);
      expect(await page.locator('meta[name="description"]').getAttribute("content")).toBeTruthy();
      await page.waitForLoadState("networkidle");
      await expectNoHorizontalScroll(page);
      expect(errors).toEqual([]);
    });
  }

  test("pages have no serious accessibility violations", async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations
        .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
        .map(
          (violation) =>
            `${path}: ${violation.id} (${violation.nodes.length}) ${violation.nodes[0]?.target.join(" ")}`,
        );
      expect(serious).toEqual([]);
    }
  });
});

test.describe("catalogue", () => {
  test("filters update the URL and results, chips remove filters", async ({ page, isMobile }) => {
    await page.goto("/vehicles");
    if (isMobile) await page.getByRole("button", { name: /filter vehicles/i }).click();

    await page.getByLabel("Category").selectOption("suvs");
    await expect(page).toHaveURL(/category=suvs/);
    await expect(page.locator("#results-heading")).toContainText("2 vehicles match");
    await expect(page).toHaveTitle(/Used SUVs for sale/);

    await page.getByLabel("Sort by").selectOption("price_asc");
    await expect(page).toHaveURL(/sort=price_asc/);
    await expect(page.locator("article h3").first()).toHaveText("Mahindra XUV500");

    await page.getByRole("link", { name: /SUVs Remove filter/ }).click();
    await expect(page).not.toHaveURL(/category=/);
  });

  test("shows an empty state and keeps shareable URLs", async ({ page }) => {
    await page.goto("/vehicles?priceMax=100000");
    await expect(page.getByText("No vehicles match those filters")).toBeVisible();
    await page.goto("/vehicles?fuel=NOT_A_FUEL&page=-4");
    await expect(page.locator("#results-heading")).toContainText("in stock");
  });
});

test.describe("vehicle detail", () => {
  test("gallery, price, WhatsApp link and structured data", async ({ page }) => {
    await page.goto("/vehicles/honda-city-vx-cvt-2019");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Honda City");
    await expect(page.getByText("₹9,40,000").first()).toBeVisible();

    await expect(page.getByText("1 / 2")).toBeVisible();
    await page.getByRole("button", { name: "Show photo 2" }).click();
    await expect(page.getByText("2 / 2")).toBeVisible();

    const whatsapp = await page
      .getByRole("link", { name: "WhatsApp" })
      .first()
      .getAttribute("href");
    expect(decodeURIComponent(whatsapp ?? "")).toContain("2019 Honda City VX CVT");

    const jsonLd = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').first().textContent()) ?? "{}",
    );
    expect(jsonLd).toMatchObject({
      "@type": "Car",
      offers: { price: 940000, priceCurrency: "INR" },
    });
  });

  test("hidden prices never reach the page", async ({ page }) => {
    const response = await page.goto("/vehicles/mercedes-benz-c-class-c-220d-progressive-2017");
    const html = (await response?.text()) ?? "";
    expect(html).not.toMatch(/2650000|26,50,000/);
    await expect(page.getByText("Contact for Price").first()).toBeVisible();
  });

  test("sold vehicles stay reachable with a notice; drafts 404", async ({ page }) => {
    await page.goto("/vehicles/maruti-suzuki-ciaz-alpha-1-5-2017");
    await expect(page.getByText("This vehicle has been sold.")).toBeVisible();
    await page.goto("/vehicles/kia-seltos-htx-1-5-2021");
    await expect(page.getByRole("heading", { name: "Wrong turn." })).toBeVisible();
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
  });
});

test.describe("navigation", () => {
  test("mobile menu opens, traps focus and closes with Escape", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile only");
    await page.goto("/");
    await page.waitForLoadState("networkidle"); // tap only once React has hydrated
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Menu" });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("button", { name: "Close menu" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  });

  test("unknown URLs return a 404 page", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("link", { name: "Browse vehicles" })).toBeVisible();
  });
});

test.describe("SEO files", () => {
  test("sitemap lists published vehicles only; robots blocks admin", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/vehicles/honda-city-vx-cvt-2019");
    expect(sitemap).not.toContain("kia-seltos"); // draft
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Disallow: \/admin/);
  });

  test("security headers are present", async ({ request }) => {
    const response = await request.get("/");
    expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-powered-by"]).toBeUndefined();
  });
});
