"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createUploadSignature,
  destroyAssets,
  isCloudinaryConfigured,
  verifyUploadedAsset,
} from "@/lib/cloudinary/server";
import { CACHE_TAGS } from "@/lib/data/tags";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { Prisma } from "@/generated/prisma/client";
import {
  vehicleFormSchema,
  vehicleQuickUpdateSchema,
  type VehicleFormValues,
  type VehicleImageInput,
} from "@/lib/validations/vehicle";

function invalidate(...slugs: (string | undefined)[]) {
  updateTag(CACHE_TAGS.vehicles);
  updateTag(CACHE_TAGS.taxonomy);
  for (const slug of slugs) if (slug) updateTag(CACHE_TAGS.vehicle(slug));
}

function validationError(error: z.ZodError): ActionResult<never> {
  return {
    ok: false,
    error: "Some fields need attention.",
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]>,
  };
}

/** Composes "Hyundai i20 Asta" when the admin leaves the name blank. */
async function resolveName(values: VehicleFormValues): Promise<string | null> {
  if (values.name) return values.name;
  const brand = await prisma.vehicleBrand.findUnique({
    where: { id: values.brandId },
    select: { name: true },
  });
  return brand ? [brand.name, values.model, values.variant].filter(Boolean).join(" ") : null;
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "vehicle";
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = attempt === 0 ? root : `${root}-${attempt + 1}`;
    const clash = await prisma.vehicle.findFirst({
      where: { slug: candidate, ...(excludeId && { id: { not: excludeId } }) },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

async function taxonomyExists(values: VehicleFormValues) {
  const [category, brand] = await Promise.all([
    prisma.vehicleCategory.count({ where: { id: values.categoryId } }),
    prisma.vehicleBrand.count({ where: { id: values.brandId } }),
  ]);
  return category === 1 && brand === 1;
}

/** Verifies newly uploaded photos with Cloudinary and swaps in server-trusted URLs/sizes. */
async function verifyNewImages(
  images: VehicleImageInput[],
  knownPublicIds: Set<string>,
): Promise<{ images: VehicleImageInput[] } | { error: string }> {
  const verified: VehicleImageInput[] = [];
  for (const image of images) {
    if (knownPublicIds.has(image.publicId)) {
      verified.push(image);
      continue;
    }
    if (!isCloudinaryConfigured()) return { error: "Image uploads aren't configured yet." };
    const asset = await verifyUploadedAsset(image.publicId, "vehicles");
    if ("error" in asset) return asset;
    verified.push({ ...image, ...asset });
  }
  return { images: verified };
}

function vehicleData(values: VehicleFormValues, name: string) {
  return {
    name,
    description: values.description,
    model: values.model,
    variant: values.variant ?? null,
    manufacturingYear: values.manufacturingYear,
    registrationYear: values.registrationYear ?? null,
    kilometresDriven: values.kilometresDriven,
    fuelType: values.fuelType,
    transmission: values.transmission,
    ownershipCount: values.ownershipCount,
    condition: values.condition,
    colour: values.colour ?? null,
    seatingCapacity: values.seatingCapacity ?? null,
    price: values.price ?? null,
    showPrice: values.showPrice,
    availability: values.availability,
    status: values.status,
    isFeatured: values.isFeatured,
    registrationNumber: values.registrationNumber ?? null,
    internalNotes: values.internalNotes ?? null,
  };
}

const imageRow = (image: VehicleImageInput, index: number) => ({
  url: image.url,
  publicId: image.publicId,
  width: image.width,
  height: image.height,
  bytes: image.bytes,
  altText: image.altText ?? null,
  sortOrder: index,
  isPrimary: image.isPrimary,
});

const specRow = (spec: VehicleFormValues["specifications"][number], index: number) => ({
  ...spec,
  sortOrder: index,
});

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function getVehicleUploadSignature(): Promise<
  ActionResult<ReturnType<typeof createUploadSignature>>
> {
  await requireAdmin();
  if (!isCloudinaryConfigured()) {
    return {
      ok: false,
      error: "Image uploads aren't set up yet. Add the Cloudinary keys to the environment.",
    };
  }
  return { ok: true, data: createUploadSignature("vehicles") };
}

export async function createVehicle(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = vehicleFormSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const values = parsed.data;

  if (!(await taxonomyExists(values))) {
    return { ok: false, error: "The selected category or brand no longer exists." };
  }
  const name = await resolveName(values);
  if (!name) return { ok: false, error: "The selected brand no longer exists." };

  const checked = await verifyNewImages(values.images, new Set());
  if ("error" in checked)
    return { ok: false, error: checked.error, fieldErrors: { images: [checked.error] } };

  const slug = values.slug
    ? await uniqueSlug(values.slug)
    : await uniqueSlug(`${name} ${values.manufacturingYear}`);
  const now = new Date();

  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        ...vehicleData(values, name),
        slug,
        category: { connect: { id: values.categoryId } },
        brand: { connect: { id: values.brandId } },
        publishedAt: values.status === "PUBLISHED" ? now : null,
        soldAt: values.availability === "SOLD" ? now : null,
        images: { create: checked.images.map(imageRow) },
        specifications: { create: values.specifications.map(specRow) },
      },
      select: { id: true, slug: true },
    });
    invalidate(vehicle.slug);
    return { ok: true, data: { id: vehicle.id } };
  } catch (error) {
    console.error("[vehicles] create failed", error);
    return { ok: false, error: "The vehicle couldn't be saved. Please try again." };
  }
}

export async function updateVehicle(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = vehicleFormSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const values = parsed.data;

  const existing = await prisma.vehicle.findUnique({
    where: { id },
    select: {
      slug: true,
      status: true,
      availability: true,
      publishedAt: true,
      soldAt: true,
      images: { select: { id: true, publicId: true } },
    },
  });
  if (!existing) return { ok: false, error: "This vehicle no longer exists." };
  if (!(await taxonomyExists(values))) {
    return { ok: false, error: "The selected category or brand no longer exists." };
  }
  const name = await resolveName(values);
  if (!name) return { ok: false, error: "The selected brand no longer exists." };

  const known = new Map(existing.images.map((image) => [image.publicId, image.id]));
  const checked = await verifyNewImages(values.images, new Set(known.keys()));
  if ("error" in checked)
    return { ok: false, error: checked.error, fieldErrors: { images: [checked.error] } };

  const keptIds = new Set(checked.images.map((image) => image.publicId));
  const removed = existing.images.filter((image) => !keptIds.has(image.publicId));

  let slug = existing.slug;
  if (values.slug && values.slug !== existing.slug) {
    const clash = await prisma.vehicle.count({ where: { slug: values.slug, id: { not: id } } });
    if (clash)
      return {
        ok: false,
        error: "That URL is already used by another vehicle.",
        fieldErrors: { slug: ["Already in use"] },
      };
    slug = values.slug;
  }

  const now = new Date();
  try {
    await prisma.$transaction([
      prisma.vehicleImage.deleteMany({ where: { id: { in: removed.map((image) => image.id) } } }),
      // Clear covers first so the one-primary-per-vehicle index never sees two.
      prisma.vehicleImage.updateMany({ where: { vehicleId: id }, data: { isPrimary: false } }),
      ...checked.images.map((image, index) => {
        const imageId = known.get(image.publicId);
        return imageId
          ? prisma.vehicleImage.update({
              where: { id: imageId },
              data: {
                sortOrder: index,
                isPrimary: image.isPrimary,
                altText: image.altText ?? null,
              },
            })
          : prisma.vehicleImage.create({ data: { ...imageRow(image, index), vehicleId: id } });
      }),
      prisma.vehicleSpecification.deleteMany({ where: { vehicleId: id } }),
      prisma.vehicle.update({
        where: { id },
        data: {
          ...vehicleData(values, name),
          slug,
          category: { connect: { id: values.categoryId } },
          brand: { connect: { id: values.brandId } },
          publishedAt:
            values.status === "PUBLISHED" ? (existing.publishedAt ?? now) : existing.publishedAt,
          soldAt: values.availability === "SOLD" ? (existing.soldAt ?? now) : null,
          specifications: { create: values.specifications.map(specRow) },
        },
      }),
    ]);
  } catch (error) {
    console.error("[vehicles] update failed", error);
    return {
      ok: false,
      error: isUniqueViolation(error)
        ? "A photo or URL clashes with another vehicle."
        : "Your changes couldn't be saved. Please try again.",
    };
  }

  await destroyAssets(removed.map((image) => image.publicId));
  invalidate(existing.slug, slug);
  return { ok: true, data: { id } };
}

export async function quickUpdateVehicle(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = vehicleQuickUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid update." };
  const { id, ...changes } = parsed.data;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { slug: true, publishedAt: true, soldAt: true, _count: { select: { images: true } } },
  });
  if (!vehicle) return { ok: false, error: "This vehicle no longer exists." };
  if (changes.status === "PUBLISHED" && vehicle._count.images === 0) {
    return { ok: false, error: "Add at least one photo before publishing." };
  }

  const now = new Date();
  await prisma.vehicle.update({
    where: { id },
    data: {
      ...changes,
      ...(changes.status === "PUBLISHED" && !vehicle.publishedAt && { publishedAt: now }),
      ...(changes.availability && {
        soldAt: changes.availability === "SOLD" ? (vehicle.soldAt ?? now) : null,
      }),
    },
  });
  invalidate(vehicle.slug);
  return { ok: true, data: undefined };
}

export async function deleteVehicle(id: string): Promise<ActionResult> {
  await requireAdmin();
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { slug: true, images: { select: { publicId: true } } },
  });
  if (!vehicle) return { ok: false, error: "This vehicle was already deleted." };

  // Images and specs cascade; enquiries keep their vehicleLabel and are unlinked.
  await prisma.vehicle.delete({ where: { id } });
  await destroyAssets(vehicle.images.map((image) => image.publicId));
  invalidate(vehicle.slug);
  return { ok: true, data: undefined };
}
