import { expect, test } from "@playwright/test";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";

// Behave like a returning visitor so the homepage preloader (covered in
// preloader.spec.ts) doesn't sit over the page under test.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("jc-preloader-seen", "1"));
});

const ADMIN = { email: "e2e-admin@jeevancars.test", password: "e2e-password-not-secret" };
const configured = Boolean(process.env.CLOUDINARY_API_SECRET);

async function photo(colour: string) {
  return sharp({ create: { width: 1600, height: 1067, channels: 3, background: colour } })
    .jpeg()
    .toBuffer();
}

test.describe("Cloudinary photo uploads", () => {
  test.skip(!configured, "Cloudinary keys not configured");

  test("upload, choose a cover, publish, then delete with cleanup", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/admin/login?next=%2Fadmin%2Fvehicles%2Fnew");
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Password", { exact: true }).fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/vehicles\/new$/);
    await page.waitForLoadState("networkidle");

    await page.locator('input[type="file"]').setInputFiles([
      { name: "front.jpg", mimeType: "image/jpeg", buffer: await photo("#2a3038") },
      { name: "interior.jpg", mimeType: "image/jpeg", buffer: await photo("#8a5300") },
    ]);
    await expect(page.getByLabel("Description for photo 2")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("2/30 photos")).toBeVisible();

    await page.getByRole("button", { name: "Use photo 2 as cover" }).click();
    await page.getByLabel("Description for photo 2").fill("Interior");

    await page.getByLabel("Category").selectOption({ label: "SUVs" });
    await page.getByLabel("Brand").selectOption({ label: "MG" });
    await page.getByLabel("Model").fill("Hector");
    await page
      .getByLabel("Description", { exact: true })
      .fill("Upload test vehicle with verified Cloudinary photos.");
    await page.getByLabel("Manufacturing year").fill("2021");
    await page.getByLabel("Kilometres driven").fill("30500");
    await page.getByLabel("Fuel").selectOption("PETROL");
    await page.getByLabel("Transmission").selectOption("CVT");
    await page.getByLabel("Selling price (₹)").fill("1450000");
    await page.getByText("Published", { exact: true }).click();
    await page.getByRole("button", { name: "Create and publish" }).click();
    await expect(page).toHaveURL(/\/admin\/vehicles\/\w+\/edit$/, { timeout: 30_000 });

    // Public page serves the cover straight from Cloudinary with transformations.
    await page.goto("/vehicles/mg-hector-2021");
    const cover = page.getByRole("img", { name: "Interior" }).first();
    await expect(cover).toBeVisible();
    const src = (await cover.getAttribute("src")) ?? "";
    expect(src).toMatch(/^https:\/\/res\.cloudinary\.com\/.+\/image\/upload\/f_auto,q_/);
    const publicId = /\/upload\/[^/]+\/v\d+\/(.+)\.\w+$/.exec(src)?.[1];
    expect(publicId).toMatch(/^[\w-]+\/vehicles\//);

    // Deleting the vehicle removes its photos from Cloudinary too.
    await page.goto("/admin/vehicles?q=Hector");
    await page.getByRole("button", { name: /Actions for 2021 MG Hector/ }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete vehicle" }).click();
    await expect(page.getByText("2021 MG Hector deleted")).toBeVisible();

    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    await expect(cloudinary.api.resource(publicId ?? "")).rejects.toMatchObject({
      error: { http_code: 404 },
    });
  });
});
