import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { getCategorySitemapEntries } from "@/lib/data/taxonomy";
import { getPublishedVehicleSitemapEntries } from "@/lib/data/vehicles";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL;
  const [vehicles, categories] = await Promise.all([
    getPublishedVehicleSitemapEntries(),
    getCategorySitemapEntries(),
  ]);
  const latest = vehicles[0]?.updatedAt;

  return [
    { url: base, lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: `${base}/vehicles`, lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((category) => ({
      url: `${base}/vehicles?category=${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...vehicles.map((vehicle) => ({
      url: `${base}/vehicles/${vehicle.slug}`,
      lastModified: vehicle.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
