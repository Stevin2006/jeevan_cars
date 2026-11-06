import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateTag } from "next/cache";
import {
  createVehicle,
  deleteVehicle,
  quickUpdateVehicle,
  updateVehicle,
} from "@/actions/vehicles";
import { destroyAssets, verifyUploadedAsset } from "@/lib/cloudinary/server";
import type { VehicleFormInput } from "@/lib/validations/vehicle";
import {
  createTaxonomy,
  createVehicle as seedVehicle,
  prisma,
  resetDatabase,
  signInAsAdmin,
} from "../helpers/db";
import { resetRequest } from "../helpers/request";

// Cloudinary is an external service: simulate an accepted upload, record deletions.
vi.mock("@/lib/cloudinary/server", () => ({
  isCloudinaryConfigured: () => true,
  createUploadSignature: vi.fn(),
  verifyUploadedAsset: vi.fn(async (publicId: string) =>
    publicId.includes("too-small")
      ? { error: "Photos must be at least 400px on each side." }
      : {
          publicId,
          url: `https://res.cloudinary.com/demo/image/upload/v1/${publicId}.jpg`,
          width: 2000,
          height: 1333,
          bytes: 300_000,
        },
  ),
  destroyAssets: vi.fn(async () => undefined),
}));

let refs: Awaited<ReturnType<typeof createTaxonomy>>;

const upload = (id: string, isPrimary = false) => ({
  publicId: `jeevan-cars/vehicles/${id}`,
  // Deliberately wrong: the server must replace these with Cloudinary's values.
  url: "https://attacker.example/fake.jpg",
  width: 1,
  height: 1,
  bytes: 1,
  isPrimary,
});

function form(overrides: Partial<VehicleFormInput> = {}): VehicleFormInput {
  return {
    name: "",
    slug: "",
    categoryId: refs.suv.id,
    brandId: refs.hyundai.id,
    model: "Creta",
    variant: "SX",
    description: "Single owner, full service history, new tyres.",
    manufacturingYear: 2020,
    registrationYear: "",
    kilometresDriven: 54_200,
    fuelType: "DIESEL",
    transmission: "MANUAL",
    ownershipCount: 1,
    condition: "GOOD",
    colour: "",
    seatingCapacity: "",
    specifications: [{ group: "Features", label: "Sunroof", value: "Yes" }],
    price: 1_325_000,
    showPrice: true,
    status: "DRAFT",
    availability: "AVAILABLE",
    isFeatured: false,
    registrationNumber: "kl07ab1234",
    internalNotes: "Bought at auction",
    images: [],
    ...overrides,
  };
}

beforeEach(async () => {
  await resetDatabase();
  resetRequest();
  vi.clearAllMocks();
  refs = await createTaxonomy();
  await signInAsAdmin();
});

describe("createVehicle", () => {
  it("creates a draft with a generated name, slug and private fields", async () => {
    const result = await createVehicle(form());
    expect(result.ok).toBe(true);
    const vehicle = await prisma.vehicle.findFirstOrThrow({ include: { specifications: true } });
    expect(vehicle).toMatchObject({
      name: "Hyundai Creta SX",
      slug: "hyundai-creta-sx-2020",
      status: "DRAFT",
      publishedAt: null,
      registrationNumber: "KL07AB1234",
      internalNotes: "Bought at auction",
    });
    expect(vehicle.specifications).toHaveLength(1);
    expect(updateTag).toHaveBeenCalledWith("vehicles");
  });

  it("adds a suffix when the slug is taken", async () => {
    await createVehicle(form());
    await createVehicle(form());
    const slugs = (
      await prisma.vehicle.findMany({ select: { slug: true }, orderBy: { createdAt: "asc" } })
    ).map((v) => v.slug);
    expect(slugs).toEqual(["hyundai-creta-sx-2020", "hyundai-creta-sx-2020-2"]);
  });

  it("publishes with verified photos and trusts Cloudinary, not the browser, for URLs", async () => {
    const result = await createVehicle(
      form({ status: "PUBLISHED", availability: "SOLD", images: [upload("a"), upload("b", true)] }),
    );
    expect(result.ok).toBe(true);
    expect(verifyUploadedAsset).toHaveBeenCalledTimes(2);
    const vehicle = await prisma.vehicle.findFirstOrThrow({
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
    expect(vehicle.publishedAt).not.toBeNull();
    expect(vehicle.soldAt).not.toBeNull();
    expect(
      vehicle.images.map((image) => [
        image.isPrimary,
        image.width,
        image.url.startsWith("https://res.cloudinary.com/"),
      ]),
    ).toEqual([
      [false, 2000, true],
      [true, 2000, true],
    ]);
  });

  it("rejects a photo that fails verification", async () => {
    const result = await createVehicle(form({ images: [upload("too-small", true)] }));
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { images: [expect.stringContaining("400px")] },
    });
    expect(await prisma.vehicle.count()).toBe(0);
  });

  it("refuses to publish without photos and reports field errors", async () => {
    const result = await createVehicle(form({ status: "PUBLISHED", price: "" }));
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { images: expect.any(Array), price: expect.any(Array) },
    });
  });

  it("rejects a category that doesn't exist", async () => {
    const result = await createVehicle(form({ categoryId: "missing" }));
    expect(result.ok).toBe(false);
    expect(await prisma.vehicle.count()).toBe(0);
  });
});

describe("updateVehicle", () => {
  it("reorders photos, swaps the cover, removes one and adds one", async () => {
    const seeded = await seedVehicle({ categoryId: refs.suv.id, brandId: refs.hyundai.id }, {}, 3);
    const [first, second, third] = seeded.images;
    const keep = (image: typeof first, isPrimary: boolean) => ({
      publicId: image!.publicId,
      url: image!.url,
      width: image!.width,
      height: image!.height,
      bytes: image!.bytes,
      isPrimary,
    });

    const result = await updateVehicle(
      seeded.id,
      form({
        status: "PUBLISHED",
        images: [keep(third, true), upload("new"), keep(first, false)],
      }),
    );
    expect(result.ok).toBe(true);

    const images = await prisma.vehicleImage.findMany({
      where: { vehicleId: seeded.id },
      orderBy: { sortOrder: "asc" },
    });
    expect(images.map((image) => [image.publicId, image.isPrimary])).toEqual([
      [third!.publicId, true],
      ["jeevan-cars/vehicles/new", false],
      [first!.publicId, false],
    ]);
    expect(destroyAssets).toHaveBeenCalledWith([second!.publicId]);
    expect(verifyUploadedAsset).toHaveBeenCalledTimes(1);
  });

  it("replaces extra details and keeps publishedAt stable", async () => {
    const seeded = await seedVehicle(
      { categoryId: refs.suv.id, brandId: refs.hyundai.id },
      { publishedAt: new Date("2026-01-01") },
    );
    const keepImage = seeded.images.map((image) => ({ ...image, altText: image.altText ?? "" }));
    await updateVehicle(
      seeded.id,
      form({
        status: "PUBLISHED",
        images: keepImage,
        specifications: [{ group: "Commercial", label: "Payload", value: "750 kg" }],
      }),
    );
    const vehicle = await prisma.vehicle.findUniqueOrThrow({
      where: { id: seeded.id },
      include: { specifications: true },
    });
    expect(vehicle.publishedAt?.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(vehicle.specifications.map((spec) => spec.label)).toEqual(["Payload"]);
  });

  it("rejects a slug used by another vehicle and invalidates old and new slugs on change", async () => {
    const a = await seedVehicle({ categoryId: refs.suv.id, brandId: refs.hyundai.id });
    const b = await seedVehicle({ categoryId: refs.suv.id, brandId: refs.hyundai.id });
    const images = a.images.map((image) => ({ ...image, altText: "" }));

    const clash = await updateVehicle(a.id, form({ slug: b.slug, images }));
    expect(clash).toMatchObject({ ok: false, fieldErrors: { slug: expect.any(Array) } });

    const renamed = await updateVehicle(a.id, form({ slug: "fresh-slug", images }));
    expect(renamed.ok).toBe(true);
    expect(updateTag).toHaveBeenCalledWith(`vehicle:${a.slug}`);
    expect(updateTag).toHaveBeenCalledWith("vehicle:fresh-slug");
  });
});

describe("quick actions and deletion", () => {
  it("blocks publishing a vehicle without photos", async () => {
    const vehicle = await seedVehicle(
      { categoryId: refs.suv.id, brandId: refs.hyundai.id },
      { status: "DRAFT" },
      0,
    );
    const result = await quickUpdateVehicle({ id: vehicle.id, status: "PUBLISHED" });
    expect(result.ok).toBe(false);
  });

  it("sets and clears soldAt with availability", async () => {
    const vehicle = await seedVehicle({ categoryId: refs.suv.id, brandId: refs.hyundai.id });
    await quickUpdateVehicle({ id: vehicle.id, availability: "SOLD" });
    expect(
      (await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } })).soldAt,
    ).not.toBeNull();
    await quickUpdateVehicle({ id: vehicle.id, availability: "AVAILABLE" });
    expect(
      (await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } })).soldAt,
    ).toBeNull();
  });

  it("deletes a vehicle, its photos and specs, but keeps enquiries unlinked", async () => {
    const vehicle = await seedVehicle({ categoryId: refs.suv.id, brandId: refs.hyundai.id }, {}, 2);
    await prisma.enquiry.create({
      data: {
        name: "Buyer",
        phone: "+919876543210",
        message: "Still available?",
        source: "VEHICLE_PAGE",
        vehicleId: vehicle.id,
        vehicleLabel: "2020 Test",
      },
    });

    expect((await deleteVehicle(vehicle.id)).ok).toBe(true);
    expect(await prisma.vehicleImage.count()).toBe(0);
    expect(destroyAssets).toHaveBeenCalledWith(vehicle.images.map((image) => image.publicId));
    expect(await prisma.enquiry.findFirstOrThrow()).toMatchObject({
      vehicleId: null,
      vehicleLabel: "2020 Test",
    });
  });
});
