import "@/lib/validations/zod-config";
import { z } from "zod";
import { FuelType, Transmission } from "@/generated/prisma/enums";

export const CATALOGUE_PAGE_SIZE = 12;

export const SORT_OPTIONS = {
  newest: "Newest first",
  oldest: "Oldest first",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
} as const;

export type CatalogueSort = keyof typeof SORT_OPTIONS;

export const OWNERSHIP_OPTIONS = {
  "1": "1st owner",
  "2": "2nd owner",
  "3": "3rd owner or more",
} as const;

const currentYear = new Date().getFullYear();

// Every field falls back to "unset" on bad input, so a mangled shared URL still
// renders a sensible catalogue instead of an error page.
const optionalSlug = z
  .string()
  .regex(/^[a-z0-9-]{1,80}$/)
  .optional()
  .catch(undefined);
const optionalYear = z.coerce
  .number()
  .int()
  .min(1980)
  .max(currentYear + 1)
  .optional()
  .catch(undefined);
const optionalPrice = z.coerce.number().int().min(0).max(100_000_000).optional().catch(undefined);

export const catalogueParamsSchema = z.object({
  q: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((value) => value || undefined)
    .catch(undefined),
  category: optionalSlug,
  brand: optionalSlug,
  fuel: z.enum(FuelType).optional().catch(undefined),
  transmission: z.enum(Transmission).optional().catch(undefined),
  ownership: z.enum(["1", "2", "3"]).optional().catch(undefined),
  yearMin: optionalYear,
  yearMax: optionalYear,
  priceMin: optionalPrice,
  priceMax: optionalPrice,
  sort: z
    .enum(Object.keys(SORT_OPTIONS) as [CatalogueSort, ...CatalogueSort[]])
    .default("newest")
    .catch("newest"),
  page: z.coerce.number().int().min(1).max(500).default(1).catch(1),
});

export type CatalogueParams = z.infer<typeof catalogueParamsSchema>;

type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseCatalogueParams(searchParams: RawSearchParams): CatalogueParams {
  const flat = Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
  return catalogueParamsSchema.parse(flat);
}

/** Builds a catalogue URL, dropping defaults so shared links stay short. */
export function buildCatalogueHref(params: Partial<CatalogueParams>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    if (key === "sort" && value === "newest") continue;
    if (key === "page" && value === 1) continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `/vehicles?${query}` : "/vehicles";
}

export function hasActiveFilters(params: CatalogueParams): boolean {
  const { sort: _sort, page: _page, ...filters } = params;
  return Object.values(filters).some((value) => value !== undefined);
}
