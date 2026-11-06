import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/data/tags";
import type { Prisma } from "@/generated/prisma/client";
import type { FuelType, Transmission } from "@/generated/prisma/enums";

const inStock = {
  status: "PUBLISHED",
  availability: { in: ["AVAILABLE", "RESERVED"] },
} satisfies Prisma.VehicleWhereInput;

export type CategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  vehicleCount: number;
};

/** Active categories with the number of in-stock vehicles in each. */
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.taxonomy, CACHE_TAGS.vehicles);

  const categories = await prisma.vehicleCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      _count: { select: { vehicles: { where: inStock } } },
    },
  });
  return categories.map(({ _count, ...category }) => ({
    ...category,
    vehicleCount: _count.vehicles,
  }));
}

export type CatalogueFacets = {
  categories: { name: string; slug: string; count: number }[];
  brands: { name: string; slug: string; count: number }[];
  fuelTypes: FuelType[];
  transmissions: Transmission[];
  yearRange: { min: number; max: number } | null;
};

/** Filter options that actually match in-stock inventory, so no filter leads nowhere. */
export async function getCatalogueFacets(): Promise<CatalogueFacets> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.taxonomy, CACHE_TAGS.vehicles);

  const [categories, brands, fuels, transmissions, years] = await Promise.all([
    prisma.vehicleCategory.findMany({
      where: { isActive: true, vehicles: { some: inStock } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { name: true, slug: true, _count: { select: { vehicles: { where: inStock } } } },
    }),
    prisma.vehicleBrand.findMany({
      where: { isActive: true, vehicles: { some: inStock } },
      orderBy: { name: "asc" },
      select: { name: true, slug: true, _count: { select: { vehicles: { where: inStock } } } },
    }),
    prisma.vehicle.findMany({
      where: inStock,
      distinct: ["fuelType"],
      select: { fuelType: true },
      orderBy: { fuelType: "asc" },
    }),
    prisma.vehicle.findMany({
      where: inStock,
      distinct: ["transmission"],
      select: { transmission: true },
      orderBy: { transmission: "asc" },
    }),
    prisma.vehicle.aggregate({
      where: inStock,
      _min: { manufacturingYear: true },
      _max: { manufacturingYear: true },
    }),
  ]);

  const toOption = ({
    _count,
    ...rest
  }: {
    name: string;
    slug: string;
    _count: { vehicles: number };
  }) => ({
    ...rest,
    count: _count.vehicles,
  });

  return {
    categories: categories.map(toOption),
    brands: brands.map(toOption),
    fuelTypes: fuels.map((row) => row.fuelType),
    transmissions: transmissions.map((row) => row.transmission),
    yearRange:
      years._min.manufacturingYear && years._max.manufacturingYear
        ? { min: years._min.manufacturingYear, max: years._max.manufacturingYear }
        : null,
  };
}

export async function getCategorySitemapEntries() {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.taxonomy);

  return prisma.vehicleCategory.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });
}
