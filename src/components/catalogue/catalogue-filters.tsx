"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { NativeSelect } from "@/components/catalogue/native-select";
import { Button } from "@/components/ui/button";
import type { CatalogueFacets } from "@/lib/data/taxonomy";
import { FUEL_LABELS, TRANSMISSION_LABELS, formatINRCompact } from "@/lib/format";
import { OWNERSHIP_OPTIONS, type CatalogueParams } from "@/lib/validations/catalogue-params";
import { cn } from "@/lib/utils";

export const CATALOGUE_FORM_ID = "catalogue-filters";

const PRICE_STEPS = [
  1_00_000, 2_00_000, 3_00_000, 5_00_000, 7_50_000, 10_00_000, 15_00_000, 20_00_000, 30_00_000,
  50_00_000,
];

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block label-caps text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * GET form that mirrors the URL. Changes submit immediately; empty fields are
 * dropped so shared links stay short. Without JavaScript it still submits
 * natively to /vehicles.
 */
export function CatalogueFilters({
  facets,
  params,
  resultCount,
}: {
  facets: CatalogueFacets;
  params: CatalogueParams;
  resultCount: number;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);
  const id = useId();
  const panelId = `${id}-panel`;

  function navigate(form: HTMLFormElement) {
    const query = new URLSearchParams();
    for (const [key, value] of new FormData(form)) {
      if (
        typeof value === "string" &&
        value.trim() !== "" &&
        !(key === "sort" && value === "newest")
      ) {
        query.set(key, value.trim());
      }
    }
    const search = query.toString();
    startTransition(() => {
      router.push(search ? `/vehicles?${search}` : "/vehicles", { scroll: false });
    });
  }

  const submit = () => formRef.current?.requestSubmit();

  const years = facets.yearRange
    ? Array.from(
        { length: facets.yearRange.max - facets.yearRange.min + 1 },
        (_, index) => facets.yearRange!.max - index,
      )
    : [];

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="xl"
        className="w-full justify-between lg:hidden"
        aria-expanded={mobileOpen}
        aria-controls={panelId}
        onClick={() => setMobileOpen((open) => !open)}
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal aria-hidden />
          Filter vehicles
        </span>
        {mobileOpen ? (
          <X aria-hidden />
        ) : (
          <span className="tabular text-muted-foreground">{resultCount}</span>
        )}
      </Button>

      <form
        ref={formRef}
        id={CATALOGUE_FORM_ID}
        action="/vehicles"
        method="get"
        role="search"
        aria-label="Filter vehicles"
        onSubmit={(event) => {
          event.preventDefault();
          navigate(event.currentTarget);
        }}
        onChange={(event) => {
          // The search box submits on Enter instead of every keystroke.
          if ((event.target as HTMLElement).getAttribute("name") !== "q") submit();
        }}
        className={cn(
          "mt-4 space-y-6 rounded-lg border bg-surface p-5 lg:mt-0 lg:block",
          mobileOpen ? "block" : "hidden",
        )}
      >
        <div id={panelId} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Filters</h2>
            {isPending && (
              <Loader2
                className="size-4 animate-spin text-muted-foreground"
                aria-label="Updating results"
              />
            )}
          </div>

          <div className="relative">
            <label htmlFor={`${id}-q`} className="sr-only">
              Search by make or model
            </label>
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id={`${id}-q`}
              name="q"
              type="search"
              defaultValue={params.q ?? ""}
              placeholder="Make or model, e.g. Creta"
              maxLength={60}
              className="h-10 w-full rounded-md border border-input bg-surface pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
          </div>

          <Field label="Category" htmlFor={`${id}-category`}>
            <NativeSelect
              id={`${id}-category`}
              name="category"
              defaultValue={params.category ?? ""}
            >
              <option value="">All categories</option>
              {facets.categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name} ({category.count})
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Brand" htmlFor={`${id}-brand`}>
            <NativeSelect id={`${id}-brand`} name="brand" defaultValue={params.brand ?? ""}>
              <option value="">All brands</option>
              {facets.brands.map((brand) => (
                <option key={brand.slug} value={brand.slug}>
                  {brand.name} ({brand.count})
                </option>
              ))}
            </NativeSelect>
          </Field>

          <fieldset className="space-y-2">
            <legend className="mb-2 label-caps text-muted-foreground">Budget</legend>
            <div className="grid grid-cols-2 gap-2">
              <NativeSelect
                aria-label="Minimum price"
                name="priceMin"
                defaultValue={params.priceMin ?? ""}
              >
                <option value="">No min</option>
                {PRICE_STEPS.map((step) => (
                  <option key={step} value={step}>
                    {formatINRCompact(step)}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect
                aria-label="Maximum price"
                name="priceMax"
                defaultValue={params.priceMax ?? ""}
              >
                <option value="">No max</option>
                {PRICE_STEPS.map((step) => (
                  <option key={step} value={step}>
                    {formatINRCompact(step)}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </fieldset>

          {years.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="mb-2 label-caps text-muted-foreground">Manufacturing year</legend>
              <div className="grid grid-cols-2 gap-2">
                <NativeSelect
                  aria-label="From year"
                  name="yearMin"
                  defaultValue={params.yearMin ?? ""}
                >
                  <option value="">From</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </NativeSelect>
                <NativeSelect
                  aria-label="To year"
                  name="yearMax"
                  defaultValue={params.yearMax ?? ""}
                >
                  <option value="">To</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </fieldset>
          )}

          <Field label="Fuel" htmlFor={`${id}-fuel`}>
            <NativeSelect id={`${id}-fuel`} name="fuel" defaultValue={params.fuel ?? ""}>
              <option value="">Any fuel</option>
              {facets.fuelTypes.map((fuel) => (
                <option key={fuel} value={fuel}>
                  {FUEL_LABELS[fuel]}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Transmission" htmlFor={`${id}-transmission`}>
            <NativeSelect
              id={`${id}-transmission`}
              name="transmission"
              defaultValue={params.transmission ?? ""}
            >
              <option value="">Any transmission</option>
              {facets.transmissions.map((transmission) => (
                <option key={transmission} value={transmission}>
                  {TRANSMISSION_LABELS[transmission]}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Ownership" htmlFor={`${id}-ownership`}>
            <NativeSelect
              id={`${id}-ownership`}
              name="ownership"
              defaultValue={params.ownership ?? ""}
            >
              <option value="">Any ownership</option>
              {Object.entries(OWNERSHIP_OPTIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </Field>

          {/* Visible only without JavaScript; with JS every change applies instantly. */}
          <noscript>
            <Button type="submit" className="w-full">
              Apply filters
            </Button>
          </noscript>
        </div>
      </form>
    </div>
  );
}
