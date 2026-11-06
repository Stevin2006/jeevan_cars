import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import type { Prisma } from "@/generated/prisma/client";

export { prisma };

const TABLES = [
  "VehicleImage",
  "VehicleSpecification",
  "Enquiry",
  "Vehicle",
  "VehicleCategory",
  "VehicleBrand",
  "AdminSession",
  "Admin",
  "SiteSettings",
  "RateLimit",
];

export async function resetDatabase() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE ${TABLES.map((table) => `"${table}"`).join(", ")} RESTART IDENTITY CASCADE`,
  );
}

export const ADMIN_PASSWORD = "correct horse battery staple";

export async function createAdmin(email = "admin@example.test") {
  return prisma.admin.create({
    data: { email, name: "Test Admin", passwordHash: await hashPassword(ADMIN_PASSWORD) },
  });
}

/** Creates an admin and a live session cookie in the fake request. */
export async function signInAsAdmin() {
  const admin = await createAdmin();
  await createSession(admin.id, { ipHash: "test", userAgent: "vitest" });
  return admin;
}

export async function createTaxonomy() {
  const [suv, sedan, hyundai, honda] = await Promise.all([
    prisma.vehicleCategory.create({ data: { name: "SUVs", slug: "suvs", sortOrder: 0 } }),
    prisma.vehicleCategory.create({ data: { name: "Sedans", slug: "sedans", sortOrder: 1 } }),
    prisma.vehicleBrand.create({ data: { name: "Hyundai", slug: "hyundai" } }),
    prisma.vehicleBrand.create({ data: { name: "Honda", slug: "honda" } }),
  ]);
  return { suv, sedan, hyundai, honda };
}

let counter = 0;

export async function createVehicle(
  refs: { categoryId: string; brandId: string },
  overrides: Partial<Prisma.VehicleUncheckedCreateInput> = {},
  imageCount = 1,
) {
  counter += 1;
  return prisma.vehicle.create({
    data: {
      name: `Test Vehicle ${counter}`,
      slug: `test-vehicle-${counter}`,
      description: "A well looked-after test vehicle with full history.",
      model: "Model",
      manufacturingYear: 2020,
      kilometresDriven: 40_000,
      fuelType: "PETROL",
      transmission: "MANUAL",
      price: 500_000,
      showPrice: true,
      status: "PUBLISHED",
      availability: "AVAILABLE",
      ...refs,
      ...overrides,
      images: {
        create: Array.from({ length: imageCount }, (_, index) => ({
          url: `https://res.cloudinary.com/demo/image/upload/v1/test/${counter}-${index}.jpg`,
          publicId: `sample/test-${counter}-${index}`,
          width: 1600,
          height: 1067,
          bytes: 200_000,
          sortOrder: index,
          isPrimary: index === 0,
        })),
      },
    },
    include: { images: true },
  });
}
