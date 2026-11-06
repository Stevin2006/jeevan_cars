"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth/require-admin";
import { CACHE_TAGS } from "@/lib/data/tags";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { taxonomySchema, type TaxonomyKind } from "@/lib/validations/taxonomy";

const LABEL: Record<TaxonomyKind, string> = { category: "category", brand: "brand" };

function invalidate() {
  updateTag(CACHE_TAGS.taxonomy);
  updateTag(CACHE_TAGS.vehicles);
}

async function findClash(kind: TaxonomyKind, field: "name" | "slug", value: string, id?: string) {
  const where = {
    [field]: { equals: value, mode: "insensitive" as const },
    ...(id && { id: { not: id } }),
  };
  return kind === "category"
    ? prisma.vehicleCategory.count({ where })
    : prisma.vehicleBrand.count({ where });
}

export async function saveTaxonomy(kind: TaxonomyKind, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = taxonomySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { id, name, description, sortOrder, isActive } = parsed.data;
  const slug = parsed.data.slug ?? slugify(name);

  if (await findClash(kind, "name", name, id)) {
    return {
      ok: false,
      error: `A ${LABEL[kind]} with that name already exists.`,
      fieldErrors: { name: ["Already exists"] },
    };
  }
  if (await findClash(kind, "slug", slug, id)) {
    return {
      ok: false,
      error: "That web address is already in use.",
      fieldErrors: { slug: ["Already in use"] },
    };
  }

  const data =
    kind === "category"
      ? { name, slug, description: description ?? null, sortOrder, isActive }
      : { name, slug, isActive };

  if (id) {
    const exists =
      kind === "category"
        ? await prisma.vehicleCategory.count({ where: { id } })
        : await prisma.vehicleBrand.count({ where: { id } });
    if (!exists) return { ok: false, error: `This ${LABEL[kind]} no longer exists.` };
    if (kind === "category") await prisma.vehicleCategory.update({ where: { id }, data });
    else await prisma.vehicleBrand.update({ where: { id }, data });
  } else if (kind === "category") {
    await prisma.vehicleCategory.create({ data });
  } else {
    await prisma.vehicleBrand.create({ data });
  }

  invalidate();
  return { ok: true, data: undefined };
}

/** Deletes only when no vehicle uses it (the database also restricts this). */
export async function deleteTaxonomy(kind: TaxonomyKind, id: string): Promise<ActionResult> {
  await requireAdmin();
  const inUse =
    kind === "category"
      ? await prisma.vehicle.count({ where: { categoryId: id } })
      : await prisma.vehicle.count({ where: { brandId: id } });
  if (inUse > 0) {
    return {
      ok: false,
      error: `${inUse} vehicle${inUse === 1 ? " uses" : "s use"} this ${LABEL[kind]}. Move or delete ${inUse === 1 ? "it" : "them"} first, or hide the ${LABEL[kind]} instead.`,
    };
  }
  try {
    if (kind === "category") await prisma.vehicleCategory.delete({ where: { id } });
    else await prisma.vehicleBrand.delete({ where: { id } });
  } catch {
    return { ok: false, error: `This ${LABEL[kind]} couldn't be deleted.` };
  }
  invalidate();
  return { ok: true, data: undefined };
}
