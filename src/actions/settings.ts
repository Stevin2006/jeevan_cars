"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth/require-admin";
import { destroySession } from "@/lib/auth/session";
import {
  createUploadSignature,
  destroyAssets,
  isCloudinaryConfigured,
  verifyUploadedAsset,
} from "@/lib/cloudinary/server";
import { CACHE_TAGS } from "@/lib/data/tags";
import { prisma } from "@/lib/prisma";
import { siteSettingsSchema } from "@/lib/validations/settings";
import { redirect } from "next/navigation";

export async function getSiteUploadSignature(): Promise<
  ActionResult<ReturnType<typeof createUploadSignature>>
> {
  await requireAdmin();
  if (!isCloudinaryConfigured()) {
    return {
      ok: false,
      error: "Image uploads aren't set up yet. Add the Cloudinary keys to the environment.",
    };
  }
  return { ok: true, data: createUploadSignature("site") };
}

export async function updateSiteSettings(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = siteSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { hero, ...fields } = parsed.data;
  const current = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { heroImageUrl: true, heroImagePublicId: true },
  });

  // Only a newly uploaded hero needs verifying; an unchanged one is kept as is.
  let heroData = {
    heroImageUrl: current?.heroImageUrl ?? null,
    heroImagePublicId: current?.heroImagePublicId ?? null,
  };
  if (!hero) {
    heroData = { heroImageUrl: null, heroImagePublicId: null };
  } else if (hero.publicId !== current?.heroImagePublicId && hero.url !== current?.heroImageUrl) {
    const asset = await verifyUploadedAsset(hero.publicId, "site");
    if ("error" in asset)
      return { ok: false, error: asset.error, fieldErrors: { hero: [asset.error] } };
    heroData = { heroImageUrl: asset.url, heroImagePublicId: asset.publicId };
  }

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...fields, ...heroData },
    update: { ...fields, ...heroData },
  });

  if (current?.heroImagePublicId && current.heroImagePublicId !== heroData.heroImagePublicId) {
    await destroyAssets([current.heroImagePublicId]);
  }
  updateTag(CACHE_TAGS.settings);
  return { ok: true, data: undefined };
}

/** Ends every admin session, including this one. */
export async function signOutEverywhere(): Promise<void> {
  const admin = await requireAdmin();
  await prisma.adminSession.deleteMany({ where: { adminId: admin.id } });
  await destroySession();
  redirect("/admin/login");
}
