/** Cache tags shared by public reads (cacheTag) and admin writes (updateTag). */
export const CACHE_TAGS = {
  vehicles: "vehicles",
  vehicle: (slug: string) => `vehicle:${slug}`,
  taxonomy: "taxonomy",
  settings: "settings",
} as const;
