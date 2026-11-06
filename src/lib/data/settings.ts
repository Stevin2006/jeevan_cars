import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/data/tags";
import type { SiteSettings } from "@/generated/prisma/client";

export type PublicSiteSettings = Omit<SiteSettings, "id" | "heroImagePublicId" | "updatedAt">;

const EMPTY_SETTINGS: PublicSiteSettings = {
  businessName: "Jeevan Cars",
  tagline: null,
  phone: null,
  whatsappNumber: null,
  email: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  postalCode: null,
  mapEmbedUrl: null,
  businessHours: null,
  facebookUrl: null,
  instagramUrl: null,
  youtubeUrl: null,
  heroImageUrl: null,
  seoTitle: null,
  seoDescription: null,
};

export async function getSiteSettings(): Promise<PublicSiteSettings> {
  "use cache";
  cacheLife("weeks");
  cacheTag(CACHE_TAGS.settings);

  const row = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!row) return EMPTY_SETTINGS;
  const { id: _id, heroImagePublicId: _publicId, updatedAt: _updatedAt, ...settings } = row;
  return settings;
}
