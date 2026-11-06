import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateEnquiry } from "@/actions/admin-enquiries";
import { submitEnquiry } from "@/actions/enquiries";
import { updateSiteSettings } from "@/actions/settings";
import { deleteTaxonomy, saveTaxonomy } from "@/actions/taxonomy";
import { createTaxonomy, createVehicle, prisma, resetDatabase, signInAsAdmin } from "../helpers/db";
import { resetRequest } from "../helpers/request";

vi.mock("@/lib/cloudinary/server", () => ({
  isCloudinaryConfigured: () => true,
  createUploadSignature: vi.fn(),
  verifyUploadedAsset: vi.fn(async (publicId: string) => ({
    publicId,
    url: `https://res.cloudinary.com/demo/image/upload/v1/${publicId}.jpg`,
    width: 2400,
    height: 1000,
    bytes: 500_000,
  })),
  destroyAssets: vi.fn(async () => undefined),
}));

const enquiry = (overrides: Record<string, unknown> = {}) => ({
  name: "Asha Menon",
  phone: "98765 43210",
  email: "",
  message: "Is the Creta still available for a test drive?",
  source: "CONTACT_PAGE",
  website: "",
  elapsedMs: 8000,
  ...overrides,
});

beforeEach(async () => {
  await resetDatabase();
  resetRequest();
});

describe("public enquiries", () => {
  it("stores a normalised enquiry with a hashed IP", async () => {
    expect(await submitEnquiry(enquiry())).toEqual({ ok: true, data: undefined });
    const saved = await prisma.enquiry.findFirstOrThrow();
    expect(saved).toMatchObject({
      phone: "+919876543210",
      email: null,
      status: "NEW",
      source: "CONTACT_PAGE",
    });
    expect(saved.ipHash).toMatch(/^[0-9a-f]{64}$/);
    expect(saved.ipHash).not.toContain("203.0.113.10");
  });

  it("silently drops honeypot submissions", async () => {
    expect((await submitEnquiry(enquiry({ website: "http://spam.example" }))).ok).toBe(true);
    expect(await prisma.enquiry.count()).toBe(0);
  });

  it("rejects submissions sent too quickly", async () => {
    expect((await submitEnquiry(enquiry({ elapsedMs: 300 }))).ok).toBe(false);
    expect(await prisma.enquiry.count()).toBe(0);
  });

  it("limits each IP to 5 enquiries per window", async () => {
    for (let i = 0; i < 5; i++) expect((await submitEnquiry(enquiry())).ok).toBe(true);
    expect(await submitEnquiry(enquiry())).toMatchObject({
      ok: false,
      error: expect.stringContaining("several"),
    });
    resetRequest("203.0.113.99");
    expect((await submitEnquiry(enquiry())).ok).toBe(true);
    expect(await prisma.enquiry.count()).toBe(6);
  });

  it("links published vehicles only, with a label snapshot", async () => {
    const refs = await createTaxonomy();
    const live = await createVehicle(
      { categoryId: refs.suv.id, brandId: refs.hyundai.id },
      { name: "Hyundai Creta SX" },
    );
    const draft = await createVehicle(
      { categoryId: refs.suv.id, brandId: refs.hyundai.id },
      { status: "DRAFT" },
    );

    await submitEnquiry(enquiry({ source: "VEHICLE_PAGE", vehicleId: live.id }));
    resetRequest("203.0.113.11");
    await submitEnquiry(enquiry({ source: "VEHICLE_PAGE", vehicleId: draft.id }));

    const rows = await prisma.enquiry.findMany({ orderBy: { createdAt: "asc" } });
    expect(rows.map((row) => [row.vehicleId, row.vehicleLabel])).toEqual([
      [live.id, "2020 Hyundai Creta SX"],
      [null, null],
    ]);
  });

  it("returns field errors for invalid input", async () => {
    const result = await submitEnquiry(enquiry({ phone: "123", message: "hi" }));
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { phone: expect.any(Array), message: expect.any(Array) },
    });
  });
});

describe("enquiry management", () => {
  it("updates status, notes and a follow-up date stored at noon IST", async () => {
    await signInAsAdmin();
    const row = await prisma.enquiry.create({
      data: { name: "A", phone: "+919876543210", message: "Hello there", source: "CONTACT_PAGE" },
    });
    const result = await updateEnquiry({
      id: row.id,
      status: "FOLLOW_UP",
      adminNotes: " Call Sat ",
      followUpAt: "2026-11-14",
    });
    expect(result.ok).toBe(true);
    const updated = await prisma.enquiry.findUniqueOrThrow({ where: { id: row.id } });
    expect(updated.status).toBe("FOLLOW_UP");
    expect(updated.adminNotes).toBe("Call Sat");
    expect(updated.followUpAt?.toISOString()).toBe("2026-11-14T06:30:00.000Z");
  });
});

describe("categories and brands", () => {
  beforeEach(signInAsAdmin);

  it("creates with an automatic slug and rejects duplicate names case-insensitively", async () => {
    expect(
      (await saveTaxonomy("category", { name: "Electric Vehicles", sortOrder: 3, isActive: true }))
        .ok,
    ).toBe(true);
    expect(await prisma.vehicleCategory.findFirstOrThrow()).toMatchObject({
      slug: "electric-vehicles",
      sortOrder: 3,
    });
    const duplicate = await saveTaxonomy("category", {
      name: "electric vehicles",
      sortOrder: 0,
      isActive: true,
    });
    expect(duplicate).toMatchObject({ ok: false, fieldErrors: { name: expect.any(Array) } });
  });

  it("ignores category-only fields for brands", async () => {
    await saveTaxonomy("brand", {
      name: "Tata Motors",
      description: "ignored",
      sortOrder: 9,
      isActive: false,
    });
    expect(await prisma.vehicleBrand.findFirstOrThrow()).toMatchObject({
      name: "Tata Motors",
      slug: "tata-motors",
      isActive: false,
    });
  });

  it("refuses to delete a category or brand that vehicles use", async () => {
    const refs = await createTaxonomy();
    await createVehicle({ categoryId: refs.suv.id, brandId: refs.hyundai.id });
    expect((await deleteTaxonomy("category", refs.suv.id)).ok).toBe(false);
    expect((await deleteTaxonomy("brand", refs.hyundai.id)).ok).toBe(false);
    expect((await deleteTaxonomy("category", refs.sedan.id)).ok).toBe(true);
    expect((await deleteTaxonomy("brand", refs.honda.id)).ok).toBe(true);
    expect(await prisma.vehicleCategory.count()).toBe(1);
  });
});

describe("site settings", () => {
  beforeEach(signInAsAdmin);

  const settings = (overrides: Record<string, unknown> = {}) => ({
    businessName: "Jeevan Cars",
    phone: "+91 98765 43210",
    whatsappNumber: "9876543210",
    postalCode: "682001",
    hero: null,
    ...overrides,
  });

  it("creates the singleton and keeps an unchanged hero image", async () => {
    await prisma.siteSettings.create({
      data: { id: 1, heroImageUrl: "https://images.example/hero.jpg", heroImagePublicId: null },
    });
    const result = await updateSiteSettings(
      settings({ hero: { publicId: "external/x", url: "https://images.example/hero.jpg" } }),
    );
    expect(result.ok).toBe(true);
    expect(await prisma.siteSettings.findUniqueOrThrow({ where: { id: 1 } })).toMatchObject({
      heroImageUrl: "https://images.example/hero.jpg",
      postalCode: "682001",
      tagline: null,
    });
  });

  it("verifies a newly uploaded hero and clears it on removal", async () => {
    await updateSiteSettings(
      settings({
        hero: { publicId: "jeevan-cars/site/hero", url: "https://attacker.example/x.jpg" },
      }),
    );
    expect((await prisma.siteSettings.findUniqueOrThrow({ where: { id: 1 } })).heroImageUrl).toBe(
      "https://res.cloudinary.com/demo/image/upload/v1/jeevan-cars/site/hero.jpg",
    );
    await updateSiteSettings(settings({ hero: null }));
    expect(
      (await prisma.siteSettings.findUniqueOrThrow({ where: { id: 1 } })).heroImageUrl,
    ).toBeNull();
  });

  it("rejects a non-Google map embed", async () => {
    const result = await updateSiteSettings(
      settings({ mapEmbedUrl: "https://evil.example/embed" }),
    );
    expect(result).toMatchObject({ ok: false, fieldErrors: { mapEmbedUrl: expect.any(Array) } });
  });
});
