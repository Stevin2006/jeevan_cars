import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/data/tags";
import type { Prisma } from "@/generated/prisma/client";
import { CATALOGUE_PAGE_SIZE, type CatalogueParams } from "@/lib/validations/catalogue-params";

/*
 * Public vehicle reads. Every query goes through `publicVehicleWhere` and the
 * select objects below, which never include registrationNumber or
 * internalNotes, and never return a price the admin chose to hide.
 */

const publicVehicleWhere = { status: "PUBLISHED" } satisfies Prisma.VehicleWhereInput;
const inStockWhere = {
  ...publicVehicleWhere,
  availability: { in: ["AVAILABLE", "RESERVED"] },
} satisfies Prisma.VehicleWhereInput;

const imageSelect = {
  url: true,
  width: true,
  height: true,
  altText: true,
} satisfies Prisma.VehicleImageSelect;

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  model: true,
  variant: true,
  manufacturingYear: true,
  kilometresDriven: true,
  fuelType: true,
  transmission: true,
  ownershipCount: true,
  price: true,
  showPrice: true,
  availability: true,
  isFeatured: true,
  createdAt: true,
  brand: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  images: {
    select: imageSelect,
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    take: 1,
  },
} satisfies Prisma.VehicleSelect;

const detailSelect = {
  ...cardSelect,
  description: true,
  registrationYear: true,
  condition: true,
  colour: true,
  seatingCapacity: true,
  publishedAt: true,
  updatedAt: true,
  categoryId: true,
  brandId: true,
  images: {
    select: { id: true, ...imageSelect },
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
  },
  specifications: {
    select: { id: true, group: true, label: true, value: true },
    orderBy: { sortOrder: "asc" },
  },
} satisfies Prisma.VehicleSelect;

type CardRow = Prisma.VehicleGetPayload<{ select: typeof cardSelect }>;
type DetailRow = Prisma.VehicleGetPayload<{ select: typeof detailSelect }>;

export type VehicleImageData = {
  url: string;
  width: number;
  height: number;
  altText: string | null;
};

export type VehicleCardData = Omit<CardRow, "price" | "images"> & {
  price: number | null;
  image: VehicleImageData | null;
};

export type VehicleDetailData = Omit<DetailRow, "price"> & { price: number | null };

/** Decimal → number, and strip the price entirely when it is not public. */
function publicPrice(row: { price: Prisma.Decimal | null; showPrice: boolean }) {
  return row.showPrice && row.price !== null ? row.price.toNumber() : null;
}

function toCard({ images, ...row }: CardRow): VehicleCardData {
  return { ...row, price: publicPrice(row), image: images[0] ?? null };
}

export async function getFeaturedVehicles(limit = 6): Promise<VehicleCardData[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.vehicles);

  const rows = await prisma.vehicle.findMany({
    where: { ...inStockWhere, isFeatured: true },
    select: cardSelect,
    orderBy: [{ availability: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
  return rows.map(toCard);
}

export async function getRecentVehicles(limit = 8): Promise<VehicleCardData[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.vehicles);

  const rows = await prisma.vehicle.findMany({
    where: inStockWhere,
    select: cardSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toCard);
}

function buildCatalogueWhere(params: CatalogueParams): Prisma.VehicleWhereInput {
  const and: Prisma.VehicleWhereInput[] = [inStockWhere];

  if (params.q) {
    const contains = { contains: params.q, mode: "insensitive" } as const;
    and.push({
      OR: [
        { name: contains },
        { model: contains },
        { variant: contains },
        { brand: { name: contains } },
        { category: { name: contains } },
      ],
    });
  }
  if (params.category) and.push({ category: { slug: params.category } });
  if (params.brand) and.push({ brand: { slug: params.brand } });
  if (params.fuel) and.push({ fuelType: params.fuel });
  if (params.transmission) and.push({ transmission: params.transmission });
  if (params.ownership) {
    const owners = Number(params.ownership);
    and.push({ ownershipCount: owners >= 3 ? { gte: 3 } : owners });
  }
  if (params.yearMin) and.push({ manufacturingYear: { gte: params.yearMin } });
  if (params.yearMax) and.push({ manufacturingYear: { lte: params.yearMax } });
  // Price filters only ever match publicly priced vehicles.
  if (params.priceMin !== undefined || params.priceMax !== undefined) {
    and.push({
      showPrice: true,
      price: {
        ...(params.priceMin !== undefined && { gte: params.priceMin }),
        ...(params.priceMax !== undefined && { lte: params.priceMax }),
      },
    });
  }
  return { AND: and };
}

function buildCatalogueOrder(
  sort: CatalogueParams["sort"],
): Prisma.VehicleOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ createdAt: "asc" }];
    case "price_asc":
      return [
        { showPrice: "desc" },
        { price: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ];
    case "price_desc":
      return [
        { showPrice: "desc" },
        { price: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ];
    default:
      return [{ createdAt: "desc" }];
  }
}

export type CatalogueResult = {
  vehicles: VehicleCardData[];
  total: number;
  page: number;
  pageCount: number;
};

export async function searchVehicles(params: CatalogueParams): Promise<CatalogueResult> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.vehicles);

  const where = buildCatalogueWhere(params);
  const [total, rows] = await Promise.all([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({
      where,
      select: cardSelect,
      orderBy: buildCatalogueOrder(params.sort),
      skip: (params.page - 1) * CATALOGUE_PAGE_SIZE,
      take: CATALOGUE_PAGE_SIZE,
    }),
  ]);

  return {
    vehicles: rows.map(toCard),
    total,
    page: params.page,
    pageCount: Math.max(1, Math.ceil(total / CATALOGUE_PAGE_SIZE)),
  };
}

/** Published vehicle by slug, including sold ones so shared links keep working. */
export async function getVehicleBySlug(slug: string): Promise<VehicleDetailData | null> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.vehicles, CACHE_TAGS.vehicle(slug));

  const row = await prisma.vehicle.findFirst({
    where: { ...publicVehicleWhere, slug },
    select: detailSelect,
  });
  return row ? { ...row, price: publicPrice(row) } : null;
}

export async function getRelatedVehicles(
  vehicle: { id: string; categoryId: string; brandId: string },
  limit = 4,
): Promise<VehicleCardData[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.vehicles);

  // Same category first, topped up with the same brand.
  const sameCategory = await prisma.vehicle.findMany({
    where: { ...inStockWhere, id: { not: vehicle.id }, categoryId: vehicle.categoryId },
    select: cardSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  if (sameCategory.length >= limit) return sameCategory.map(toCard);

  const sameBrand = await prisma.vehicle.findMany({
    where: {
      ...inStockWhere,
      id: { notIn: [vehicle.id, ...sameCategory.map((row) => row.id)] },
      brandId: vehicle.brandId,
    },
    select: cardSelect,
    orderBy: { createdAt: "desc" },
    take: limit - sameCategory.length,
  });
  return [...sameCategory, ...sameBrand].map(toCard);
}

export type InventoryStats = { inStock: number; categories: number; brands: number };

export async function getInventoryStats(): Promise<InventoryStats> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.vehicles, CACHE_TAGS.taxonomy);

  const [inStock, categories, brands] = await Promise.all([
    prisma.vehicle.count({ where: inStockWhere }),
    prisma.vehicleCategory.count({ where: { isActive: true, vehicles: { some: inStockWhere } } }),
    prisma.vehicleBrand.count({ where: { isActive: true, vehicles: { some: inStockWhere } } }),
  ]);
  return { inStock, categories, brands };
}

export async function getPublishedVehicleSitemapEntries() {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.vehicles);

  return prisma.vehicle.findMany({
    where: publicVehicleWhere,
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}
