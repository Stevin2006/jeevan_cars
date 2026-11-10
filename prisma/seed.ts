/**
 * Seeds the base taxonomy and the SiteSettings singleton.
 * Idempotent (upserts only) and safe to run against production: it never
 * overwrites values the admin has already edited.
 */
import "dotenv/config";
import { createPrismaClient } from "@/lib/db/create-client";
import { slugify } from "@/lib/slug";
import { DEALERSHIP_CONTACT } from "./dealership";

const CATEGORIES: { name: string; description: string }[] = [
  { name: "Hatchbacks", description: "Compact, efficient city cars." },
  { name: "Sedans", description: "Comfortable saloons with generous boot space." },
  { name: "SUVs", description: "Commanding road presence and versatility." },
  { name: "MUVs", description: "Spacious multi-utility family vehicles." },
  { name: "Luxury Cars", description: "Premium pre-owned cars from luxury marques." },
  { name: "Tempo Travellers", description: "Passenger vans for groups and tours." },
  { name: "Mini Trucks", description: "Small commercial carriers for last-mile loads." },
  { name: "Pickup Trucks", description: "Rugged load carriers for business and work." },
  {
    name: "Commercial Vehicles",
    description: "Buses, trucks and other commercial fleet vehicles.",
  },
];

const BRANDS = [
  "Maruti Suzuki",
  "Hyundai",
  "Tata Motors",
  "Mahindra",
  "Toyota",
  "Honda",
  "Kia",
  "Renault",
  "Nissan",
  "Ford",
  "Volkswagen",
  "Skoda",
  "MG",
  "Jeep",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Force Motors",
  "Ashok Leyland",
  "Eicher",
  "Isuzu",
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  const prisma = createPrismaClient(databaseUrl);

  try {
    for (const [index, category] of CATEGORIES.entries()) {
      await prisma.vehicleCategory.upsert({
        where: { slug: slugify(category.name) },
        update: {},
        create: { ...category, slug: slugify(category.name), sortOrder: index },
      });
    }

    for (const name of BRANDS) {
      await prisma.vehicleBrand.upsert({
        where: { slug: slugify(name) },
        update: {},
        create: { name, slug: slugify(name) },
      });
    }

    // Only fills a brand-new database; edits made in Admin › Settings are kept.
    await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, ...DEALERSHIP_CONTACT },
    });

    const [categories, brands] = await Promise.all([
      prisma.vehicleCategory.count(),
      prisma.vehicleBrand.count(),
    ]);
    console.log(`Seed complete: ${categories} categories, ${brands} brands, site settings ready.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
