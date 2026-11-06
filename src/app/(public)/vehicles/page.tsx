import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { ActiveFilters } from "@/components/catalogue/active-filters";
import { CatalogueFilters } from "@/components/catalogue/catalogue-filters";
import { CatalogueSkeleton } from "@/components/catalogue/catalogue-skeleton";
import { Pagination } from "@/components/catalogue/pagination";
import { SortSelect } from "@/components/catalogue/sort-select";
import { PageHeader } from "@/components/public/page-header";
import { Button } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { getCatalogueFacets } from "@/lib/data/taxonomy";
import { searchVehicles } from "@/lib/data/vehicles";
import {
  buildCatalogueHref,
  hasActiveFilters,
  parseCatalogueParams,
} from "@/lib/validations/catalogue-params";

export async function generateMetadata({
  searchParams,
}: PageProps<"/vehicles">): Promise<Metadata> {
  const params = parseCatalogueParams(await searchParams);
  const facets = await getCatalogueFacets();
  const category = facets.categories.find((c) => c.slug === params.category);
  const brand = facets.brands.find((b) => b.slug === params.brand);
  const subject =
    brand || category
      ? `Used ${[brand?.name, category?.name ?? "vehicles"].filter(Boolean).join(" ")}`
      : "Used cars & commercial vehicles";

  return {
    title: `${subject} for sale`,
    description: `Browse inspected ${subject.toLowerCase().replace(/^used /, "pre-owned ")} at Jeevan Cars. Filter by price, year, fuel, transmission and ownership.`,
    alternates: {
      // Category and brand pages are canonical; other filter combinations fold into them.
      canonical: buildCatalogueHref({ category: category?.slug, brand: brand?.slug }),
    },
    openGraph: { url: buildCatalogueHref({ category: category?.slug, brand: brand?.slug }) },
  };
}

export default function VehiclesPage({ searchParams }: PageProps<"/vehicles">) {
  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Vehicles for sale"
        description="Every vehicle here is in stock and inspected. Narrow it down, then come and see it in person."
      />
      <div className="container-page py-10 sm:py-14">
        <Suspense fallback={<CatalogueSkeleton />}>
          <CatalogueResults searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function CatalogueResults({
  searchParams,
}: {
  searchParams: PageProps<"/vehicles">["searchParams"];
}) {
  const params = parseCatalogueParams(await searchParams);
  const [facets, result] = await Promise.all([getCatalogueFacets(), searchVehicles(params)]);
  const filtered = hasActiveFilters(params);

  // Stale links past the last page (stock sold since) land on the last real page.
  if (result.total > 0 && params.page > result.pageCount) {
    redirect(buildCatalogueHref({ ...params, page: result.pageCount }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_1fr] lg:gap-10">
      <aside className="lg:sticky lg:top-[calc(var(--nav-height)+1.5rem)] lg:self-start">
        <CatalogueFilters
          key={JSON.stringify(params)}
          facets={facets}
          params={params}
          resultCount={result.total}
        />
      </aside>

      <section aria-labelledby="results-heading" className="min-w-0 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="results-heading" className="text-sm text-muted-foreground" aria-live="polite">
            <span className="tabular font-mono text-base font-medium text-ink">{result.total}</span>{" "}
            {result.total === 1 ? "vehicle" : "vehicles"}
            {filtered
              ? result.total === 1
                ? " matches your filters"
                : " match your filters"
              : " in stock"}
          </h2>
          <SortSelect key={params.sort} value={params.sort} />
        </div>

        <ActiveFilters params={params} facets={facets} />

        {result.vehicles.length > 0 ? (
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {result.vehicles.map((vehicle, index) => (
              <li key={vehicle.id} className="flex">
                <VehicleCard
                  vehicle={vehicle}
                  priority={index === 0}
                  eager={index < 3}
                  className="w-full"
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed bg-surface px-6 py-16 text-center">
            <SearchX className="size-8 text-muted-foreground" strokeWidth={1.5} aria-hidden />
            <div className="space-y-1">
              <p className="font-display text-lg font-bold">No vehicles match those filters</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Try widening your budget or year range — or tell us what you&rsquo;re looking for
                and we&rsquo;ll keep an eye out.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="outline" size="lg">
                <Link href="/vehicles">Clear filters</Link>
              </Button>
              <Button asChild size="lg">
                <Link href="/contact#enquiry">Ask us to find one</Link>
              </Button>
            </div>
          </div>
        )}

        <Pagination params={params} pageCount={result.pageCount} />
      </section>
    </div>
  );
}
