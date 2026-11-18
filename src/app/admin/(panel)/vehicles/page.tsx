import type { Metadata } from "next";
import Link from "next/link";
import { CarFront, Plus, Search, Star } from "lucide-react";
import { z } from "zod";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { PageTitle } from "@/components/admin/page-title";
import { AutoSubmitSelect } from "@/components/admin/auto-submit-select";
import { AvailabilityStatusBadge, PublicationBadge } from "@/components/admin/status-badges";
import { VehicleRowActions } from "@/components/admin/vehicles/vehicle-row-actions";
import { SmartImage } from "@/components/media/smart-image";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getTaxonomyOptions, listAdminVehicles } from "@/lib/data/admin";
import { formatINR, formatKilometres } from "@/lib/format";
import { formatDate } from "@/lib/format-date";

export const metadata: Metadata = { title: "Vehicles" };

const filtersSchema = z.object({
  q: z.string().trim().max(60).optional().catch(undefined),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional().catch(undefined),
  availability: z.enum(["AVAILABLE", "RESERVED", "SOLD"]).optional().catch(undefined),
  category: z.string().max(40).optional().catch(undefined),
  page: z.coerce.number().int().min(1).default(1).catch(1),
});

export default async function AdminVehiclesPage({ searchParams }: PageProps<"/admin/vehicles">) {
  await requireAdmin();
  const raw = await searchParams;
  const filters = filtersSchema.parse(
    Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v || undefined]),
    ),
  );
  const [{ vehicles, total, pageCount }, { categories }] = await Promise.all([
    listAdminVehicles(filters),
    getTaxonomyOptions(),
  ]);
  const filtered = Boolean(filters.q || filters.status || filters.availability || filters.category);

  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...filters, page })) {
      if (value !== undefined && !(key === "page" && value === 1)) params.set(key, String(value));
    }
    const query = params.toString();
    return query ? `/admin/vehicles?${query}` : "/admin/vehicles";
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Vehicles"
        description={`${total} ${total === 1 ? "vehicle" : "vehicles"}${filtered ? " match these filters" : " in total"}`}
        actions={
          <Button asChild size="lg">
            <Link href="/admin/vehicles/new">
              <Plus data-icon="inline-start" aria-hidden />
              Add vehicle
            </Link>
          </Button>
        }
      />

      <form
        method="get"
        className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
        role="search"
      >
        <div className="relative flex-1 sm:min-w-64">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <label htmlFor="vehicle-search" className="sr-only">
            Search vehicles
          </label>
          <input
            id="vehicle-search"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Name, model or registration number"
            className="h-10 w-full rounded-md border border-input bg-surface pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
        </div>
        <AutoSubmitSelect
          name="status"
          label="Publication"
          defaultValue={filters.status}
          options={[
            ["", "All statuses"],
            ["PUBLISHED", "Published"],
            ["DRAFT", "Drafts"],
          ]}
        />
        <AutoSubmitSelect
          name="availability"
          label="Availability"
          defaultValue={filters.availability}
          options={[
            ["", "Any availability"],
            ["AVAILABLE", "Available"],
            ["RESERVED", "Reserved"],
            ["SOLD", "Sold"],
          ]}
        />
        <AutoSubmitSelect
          name="category"
          label="Category"
          defaultValue={filters.category}
          options={[
            ["", "All categories"],
            ...categories.map((c) => [c.id, c.name] as [string, string]),
          ]}
        />
        {filtered && (
          <Button asChild variant="ghost" size="lg" className="h-10">
            <Link href="/admin/vehicles">Clear</Link>
          </Button>
        )}
      </form>

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-surface px-6 py-16 text-center">
          <CarFront className="size-8 text-muted-foreground" strokeWidth={1.5} aria-hidden />
          <p className="font-medium">
            {filtered ? "No vehicles match these filters" : "No vehicles yet"}
          </p>
          <p className="text-sm text-muted-foreground">
            {filtered
              ? "Try a different search or clear the filters."
              : "Add your first listing to get started."}
          </p>
          {!filtered && (
            <Button asChild>
              <Link href="/admin/vehicles/new">Add vehicle</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[45%] min-w-64">Vehicle</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Enquiries</TableHead>
                <TableHead className="hidden lg:table-cell">Updated</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>
                    <Link
                      href={`/admin/vehicles/${vehicle.id}/edit`}
                      className="flex items-center gap-3"
                    >
                      <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-sm bg-muted">
                        {vehicle.imageUrl && (
                          <SmartImage
                            src={vehicle.imageUrl}
                            alt=""
                            fill
                            sizes="56px"
                            quality={60}
                            className="object-cover"
                          />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 font-medium hover:underline">
                          <span className="truncate">
                            {vehicle.manufacturingYear} {vehicle.name}
                          </span>
                          {vehicle.isFeatured && (
                            <Star
                              className="size-3.5 shrink-0 fill-brand text-brand"
                              aria-label="Featured"
                            />
                          )}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {vehicle.category.name} · {formatKilometres(vehicle.kilometresDriven)}
                          {vehicle.registrationNumber && ` · ${vehicle.registrationNumber}`}
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="tabular">
                    {vehicle.price !== null ? (
                      formatINR(vehicle.price)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                    {!vehicle.showPrice && (
                      <span className="block text-xs text-brand-ink">Contact for Price</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      <PublicationBadge status={vehicle.status} />
                      <AvailabilityStatusBadge status={vehicle.availability} />
                    </div>
                  </TableCell>
                  <TableCell className="tabular hidden font-mono md:table-cell">
                    {vehicle.enquiryCount}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {formatDate(vehicle.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <VehicleRowActions vehicle={vehicle} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AdminPagination page={filters.page} pageCount={pageCount} total={total} href={pageHref} />
    </div>
  );
}
