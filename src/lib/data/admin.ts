import "server-only";
import { prisma } from "@/lib/prisma";

/*
 * Admin reads. Uncached (always fresh) and only ever called from pages that
 * have already passed requireAdmin().
 */

export async function getDashboardData() {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const twoWeeksAgo = new Date(Date.now() - 14 * 86_400_000);

  const [
    total,
    byAvailability,
    drafts,
    enquiriesTotal,
    enquiriesNew,
    enquiriesThisWeek,
    enquiriesLastWeek,
    recentEnquiries,
    recentVehicles,
    byCategory,
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.groupBy({
      by: ["availability"],
      where: { status: "PUBLISHED" },
      _count: { _all: true },
    }),
    prisma.vehicle.count({ where: { status: "DRAFT" } }),
    prisma.enquiry.count(),
    prisma.enquiry.count({ where: { status: "NEW" } }),
    prisma.enquiry.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.enquiry.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    prisma.enquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        createdAt: true,
        vehicleLabel: true,
        message: true,
      },
    }),
    prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        manufacturingYear: true,
        price: true,
        showPrice: true,
        status: true,
        availability: true,
        createdAt: true,
        images: {
          select: { url: true },
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
        },
      },
    }),
    prisma.vehicleCategory.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        _count: {
          select: { vehicles: { where: { status: "PUBLISHED", availability: { not: "SOLD" } } } },
        },
      },
    }),
  ]);

  const availability = Object.fromEntries(
    byAvailability.map((row) => [row.availability, row._count._all]),
  ) as Partial<Record<"AVAILABLE" | "RESERVED" | "SOLD", number>>;

  return {
    generatedAt: Date.now(),
    stats: {
      total,
      available: availability.AVAILABLE ?? 0,
      reserved: availability.RESERVED ?? 0,
      sold: availability.SOLD ?? 0,
      drafts,
      enquiriesTotal,
      enquiriesNew,
      enquiriesThisWeek,
      enquiriesLastWeek,
    },
    recentEnquiries,
    recentVehicles: recentVehicles.map(({ price, images, ...vehicle }) => ({
      ...vehicle,
      price: price?.toNumber() ?? null,
      imageUrl: images[0]?.url ?? null,
    })),
    stockByCategory: byCategory
      .map((category) => ({
        id: category.id,
        name: category.name,
        count: category._count.vehicles,
      }))
      .filter((category) => category.count > 0)
      .sort((a, b) => b.count - a.count),
  };
}

export const ADMIN_PAGE_SIZE = 20;

export type AdminVehicleFilters = {
  q?: string;
  status?: "DRAFT" | "PUBLISHED";
  availability?: "AVAILABLE" | "RESERVED" | "SOLD";
  category?: string;
  page: number;
};

export async function listAdminVehicles(filters: AdminVehicleFilters) {
  const contains = filters.q ? ({ contains: filters.q, mode: "insensitive" } as const) : undefined;
  const where = {
    ...(filters.status && { status: filters.status }),
    ...(filters.availability && { availability: filters.availability }),
    ...(filters.category && { categoryId: filters.category }),
    ...(contains && {
      OR: [
        { name: contains },
        { model: contains },
        { variant: contains },
        { registrationNumber: contains },
        { slug: contains },
      ],
    }),
  };

  const [total, rows] = await Promise.all([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (filters.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        name: true,
        manufacturingYear: true,
        kilometresDriven: true,
        price: true,
        showPrice: true,
        status: true,
        availability: true,
        isFeatured: true,
        registrationNumber: true,
        updatedAt: true,
        category: { select: { name: true } },
        images: {
          select: { url: true },
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
        },
        _count: { select: { enquiries: true, images: true } },
      },
    }),
  ]);

  return {
    total,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
    vehicles: rows.map(({ price, images, _count, ...row }) => ({
      ...row,
      price: price?.toNumber() ?? null,
      imageUrl: images[0]?.url ?? null,
      enquiryCount: _count.enquiries,
      imageCount: _count.images,
    })),
  };
}

export type AdminVehicleRow = Awaited<ReturnType<typeof listAdminVehicles>>["vehicles"][number];

export async function getTaxonomyOptions() {
  const [categories, brands] = await Promise.all([
    prisma.vehicleCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, isActive: true },
    }),
    prisma.vehicleBrand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, isActive: true },
    }),
  ]);
  return { categories, brands };
}

export type TaxonomyOptions = Awaited<ReturnType<typeof getTaxonomyOptions>>;

export async function getVehicleForEdit(id: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      specifications: { orderBy: { sortOrder: "asc" } },
      _count: { select: { enquiries: true } },
    },
  });
  if (!vehicle) return null;
  return { ...vehicle, price: vehicle.price?.toNumber() ?? null };
}

export type VehicleForEdit = NonNullable<Awaited<ReturnType<typeof getVehicleForEdit>>>;

export async function listTaxonomy(kind: "category" | "brand") {
  const select = {
    id: true,
    name: true,
    slug: true,
    isActive: true,
    updatedAt: true,
    _count: { select: { vehicles: true } },
  } as const;
  const rows =
    kind === "category"
      ? await prisma.vehicleCategory.findMany({
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          select: { ...select, description: true, sortOrder: true },
        })
      : (await prisma.vehicleBrand.findMany({ orderBy: { name: "asc" }, select })).map((row) => ({
          ...row,
          description: null,
          sortOrder: 0,
        }));
  return rows.map(({ _count, ...row }) => ({ ...row, vehicleCount: _count.vehicles }));
}

export type TaxonomyRow = Awaited<ReturnType<typeof listTaxonomy>>[number];

export type AdminEnquiryFilters = {
  q?: string;
  status?: "NEW" | "CONTACTED" | "FOLLOW_UP" | "CONVERTED" | "CLOSED";
  vehicle?: string;
  page: number;
};

export async function listAdminEnquiries(filters: AdminEnquiryFilters) {
  const contains = filters.q ? ({ contains: filters.q, mode: "insensitive" } as const) : undefined;
  const where = {
    ...(filters.status && { status: filters.status }),
    ...(filters.vehicle && { vehicleId: filters.vehicle }),
    ...(contains && {
      OR: [
        { name: contains },
        { phone: contains },
        { email: contains },
        { message: contains },
        { vehicleLabel: contains },
      ],
    }),
  };
  const [total, rows, counts] = await Promise.all([
    prisma.enquiry.count({ where }),
    prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        message: true,
        status: true,
        source: true,
        vehicleLabel: true,
        vehicleId: true,
        followUpAt: true,
        createdAt: true,
      },
    }),
    prisma.enquiry.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  return {
    generatedAt: Date.now(),
    total,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
    enquiries: rows,
    statusCounts: Object.fromEntries(counts.map((row) => [row.status, row._count._all])) as Partial<
      Record<NonNullable<AdminEnquiryFilters["status"]>, number>
    >,
  };
}

export async function getEnquiry(id: string) {
  return prisma.enquiry.findUnique({
    where: { id },
    include: {
      vehicle: {
        select: {
          id: true,
          slug: true,
          name: true,
          manufacturingYear: true,
          status: true,
          availability: true,
        },
      },
    },
  });
}
