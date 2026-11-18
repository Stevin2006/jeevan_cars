import Link from "next/link";
import { X } from "lucide-react";
import type { CatalogueFacets } from "@/lib/data/taxonomy";
import { FUEL_LABELS, TRANSMISSION_LABELS, formatINRCompact } from "@/lib/format";
import {
  OWNERSHIP_OPTIONS,
  buildCatalogueHref,
  type CatalogueParams,
} from "@/lib/validations/catalogue-params";

type FilterKey = Exclude<keyof CatalogueParams, "sort" | "page">;

/** Removable chips for every applied filter; each is a plain link to the URL without it. */
export function ActiveFilters({
  params,
  facets,
}: {
  params: CatalogueParams;
  facets: CatalogueFacets;
}) {
  const labels: Partial<Record<FilterKey, string>> = {
    q: params.q && `“${params.q}”`,
    category:
      params.category &&
      (facets.categories.find((c) => c.slug === params.category)?.name ?? params.category),
    brand:
      params.brand && (facets.brands.find((b) => b.slug === params.brand)?.name ?? params.brand),
    fuel: params.fuel && FUEL_LABELS[params.fuel],
    transmission: params.transmission && TRANSMISSION_LABELS[params.transmission],
    ownership: params.ownership && OWNERSHIP_OPTIONS[params.ownership],
    yearMin: params.yearMin ? `From ${params.yearMin}` : undefined,
    yearMax: params.yearMax ? `Up to ${params.yearMax}` : undefined,
    priceMin:
      params.priceMin !== undefined ? `Over ${formatINRCompact(params.priceMin)}` : undefined,
    priceMax:
      params.priceMax !== undefined ? `Under ${formatINRCompact(params.priceMax)}` : undefined,
  };
  const chips = (Object.entries(labels) as [FilterKey, string | undefined][]).filter(
    (entry): entry is [FilterKey, string] => Boolean(entry[1]),
  );
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map(([key, label]) => (
        <Link
          key={key}
          href={buildCatalogueHref({ ...params, [key]: undefined, page: 1 })}
          scroll={false}
          className="inline-flex items-center gap-1.5 rounded-full border bg-surface py-1 pr-2 pl-3 text-sm transition-colors hover:border-ink/30"
        >
          {label}
          <X className="size-3.5 text-muted-foreground" aria-hidden />
          <span className="sr-only">Remove filter</span>
        </Link>
      ))}
      <Link
        href={buildCatalogueHref({ sort: params.sort })}
        scroll={false}
        className="px-2 text-sm font-medium text-brand-ink underline-offset-4 hover:underline"
      >
        Clear all
      </Link>
    </div>
  );
}
