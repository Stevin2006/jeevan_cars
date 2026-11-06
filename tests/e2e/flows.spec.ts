import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Credentials created by scripts/e2e-prepare.sh for the throwaway e2e database.
const ADMIN = { email: "e2e-admin@jeevancars.test", password: "e2e-password-not-secret" };

async function signIn(page: Page, next = "/admin/dashboard") {
  await page.goto(`/admin/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(next.replace(/[?]/g, "\\?")));
}

test.describe.configure({ mode: "serial" });

test("unauthenticated visitors are sent to sign in, then back", async ({ page }) => {
  await page.goto("/admin/vehicles");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fvehicles/);

  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password", { exact: true }).fill("wrong password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("That email and password combination isn't right.")).toBeVisible();

  await page.getByLabel("Password", { exact: true }).fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/vehicles$/);
  await expect(page.getByRole("heading", { name: "Vehicles", level: 1 })).toBeVisible();
});

test("a customer enquiry reaches the admin and can be worked", async ({ page, browser }) => {
  // Customer side (separate context, no admin cookie).
  const customer = await browser.newPage();
  await customer.goto("/vehicles/hyundai-i20-asta-1-2-2019");
  await customer.getByLabel("Your name").fill("Priya E2E");
  await customer.getByLabel("Mobile number").fill("91234 56789");
  await customer.waitForTimeout(2_800); // the form rejects instant (bot-like) submissions
  await customer.getByRole("button", { name: "Send enquiry" }).click();
  await expect(customer.getByText("Thanks, Priya — we’ve got it.")).toBeVisible();
  await customer.close();

  await signIn(page, "/admin/enquiries");
  const row = page.getByRole("row", { name: /Priya E2E/ });
  await expect(row).toContainText("2019 Hyundai i20 Asta 1.2");
  await row.getByRole("link", { name: "Priya E2E" }).click();
  await expect(page).toHaveURL(/\/admin\/enquiries\/\w+$/);

  await page.getByLabel("Status", { exact: true }).selectOption("CONTACTED");
  await page.getByLabel("Notes").fill("Called back, test drive booked.");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Enquiry updated")).toBeVisible();
});

test("admin creates a draft, publishes stock changes and sees them on the site", async ({
  page,
}) => {
  await signIn(page, "/admin/vehicles/new");

  await page.getByLabel("Category").selectOption({ label: "SUVs" });
  await page.getByLabel("Brand").selectOption({ label: "Kia" });
  await page.getByLabel("Model").fill("Sonet");
  await page
    .getByLabel("Description")
    .fill("Low-mileage Sonet with full service history and new tyres.");
  await page.getByLabel("Manufacturing year").fill("2022");
  await page.getByLabel("Kilometres driven").fill("18500");
  await page.getByLabel("Fuel").selectOption("PETROL");
  await page.getByLabel("Transmission").selectOption("DCT");
  await page.getByLabel("Selling price (₹)").fill("1050000");
  await page.getByRole("button", { name: "Create draft" }).click();

  await expect(page).toHaveURL(/\/admin\/vehicles\/\w+\/edit/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("2022 Kia Sonet");

  // Drafts stay off the public site.
  const draft = await page.request.get("/vehicles/kia-sonet-2022");
  expect(await draft.text()).toContain("Vehicle not found");

  // Mark an existing published vehicle as sold from the list.
  await page.goto("/admin/vehicles?q=Swift");
  await page.getByRole("button", { name: /Actions for .*Swift/ }).click();
  await page.getByRole("menuitem", { name: "Sold" }).click();
  await expect(page.getByText("Marked as sold")).toBeVisible();

  const publicPage = await page.request.get("/vehicles/maruti-suzuki-swift-vxi-2020");
  expect(await publicPage.text()).toContain("This vehicle has been sold.");

  // Clean up the draft through the UI.
  await page.goto("/admin/vehicles?q=Sonet");
  await page.getByRole("button", { name: /Actions for 2022 Kia Sonet/ }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete vehicle" }).click();
  await expect(page.getByText("2022 Kia Sonet deleted")).toBeVisible();
});

test("admin pages have no serious accessibility violations", async ({ page }) => {
  await signIn(page);
  const paths = [
    "/admin/dashboard",
    "/admin/vehicles",
    "/admin/vehicles/new",
    "/admin/categories",
    "/admin/enquiries",
    "/admin/settings",
  ];
  const problems: string[] = [];
  for (const path of paths) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    for (const violation of violations) {
      if (violation.impact === "serious" || violation.impact === "critical") {
        problems.push(`${path}: ${violation.id} → ${violation.nodes[0]?.target.join(" ")}`);
      }
    }
  }
  expect(problems).toEqual([]);
});

test("signing out ends the session", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/admin\/login/);
});
