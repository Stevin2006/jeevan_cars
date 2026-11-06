import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, Search } from "lucide-react";
import { z } from "zod";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { EnquiryStatusSelect } from "@/components/admin/enquiries/enquiry-status-select";
import { PageTitle } from "@/components/admin/page-title";
import { ENQUIRY_STATUS_LABELS } from "@/components/admin/status-badges";
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
import { listAdminEnquiries } from "@/lib/data/admin";
import { formatDate, formatRelative } from "@/lib/format-date";
import { ENQUIRY_STATUSES } from "@/lib/validations/enquiry";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Enquiries" };

const filtersSchema = z.object({
  q: z.string().trim().max(60).optional().catch(undefined),
  status: z.enum(ENQUIRY_STATUSES).optional().catch(undefined),
  vehicle: z.string().max(40).optional().catch(undefined),
  page: z.coerce.number().int().min(1).default(1).catch(1),
});

export default async function AdminEnquiriesPage({ searchParams }: PageProps<"/admin/enquiries">) {
  await requireAdmin();
  const raw = await searchParams;
  const filters = filtersSchema.parse(
    Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v || undefined]),
    ),
  );
  const {
    generatedAt: now,
    enquiries,
    total,
    pageCount,
    statusCounts,
  } = await listAdminEnquiries(filters);
  const allCount = Object.values(statusCounts).reduce((sum, count) => sum + (count ?? 0), 0);

  const href = (changes: Partial<typeof filters>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...filters, page: 1, ...changes })) {
      if (value !== undefined && !(key === "page" && value === 1)) params.set(key, String(value));
    }
    const query = params.toString();
    return query ? `/admin/enquiries?${query}` : "/admin/enquiries";
  };

  const tabs = [
    { label: "All", status: undefined, count: allCount },
    ...ENQUIRY_STATUSES.map((status) => ({
      label: ENQUIRY_STATUS_LABELS[status],
      status,
      count: statusCounts[status] ?? 0,
    })),
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Enquiries"
        description="Leads from vehicle pages and the contact form. Newest first."
      />

      <nav aria-label="Filter by status" className="mb-4 flex gap-1 overflow-x-auto border-b">
        {tabs.map((tab) => {
          const active = filters.status === tab.status;
          return (
            <Link
              key={tab.label}
              href={href({ status: tab.status })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors",
                active
                  ? "border-ink font-medium text-ink"
                  : "border-transparent text-muted-foreground hover:text-ink",
              )}
            >
              {tab.label}
              <span className="tabular rounded-full bg-muted px-1.5 font-mono text-[0.6875rem]">
                {tab.count}
              </span>
            </Link>
          );
        })}
      </nav>

      <form method="get" role="search" className="mb-4 flex gap-2">
        {filters.status && <input type="hidden" name="status" value={filters.status} />}
        {filters.vehicle && <input type="hidden" name="vehicle" value={filters.vehicle} />}
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <label htmlFor="enquiry-search" className="sr-only">
            Search enquiries
          </label>
          <input
            id="enquiry-search"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Name, phone, email, vehicle or message"
            className="h-10 w-full rounded-md border border-input bg-surface pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
        </div>
        <Button type="submit" variant="outline" size="lg" className="h-10">
          Search
        </Button>
        {(filters.q || filters.vehicle) && (
          <Button asChild variant="ghost" size="lg" className="h-10">
            <Link href={href({ q: undefined, vehicle: undefined })}>Clear</Link>
          </Button>
        )}
      </form>

      {enquiries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-surface px-6 py-16 text-center">
          <Inbox className="size-8 text-muted-foreground" strokeWidth={1.5} aria-hidden />
          <p className="font-medium">No enquiries here</p>
          <p className="text-sm text-muted-foreground">
            {filters.q || filters.status || filters.vehicle
              ? "Nothing matches these filters."
              : "When customers send an enquiry from the website it'll appear here."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-56">Customer</TableHead>
                <TableHead className="min-w-64">Enquiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enquiries.map((enquiry) => (
                <TableRow
                  key={enquiry.id}
                  className={cn(enquiry.status === "NEW" && "bg-amber/[0.06]")}
                >
                  <TableCell>
                    <Link
                      href={`/admin/enquiries/${enquiry.id}`}
                      className="font-medium hover:underline"
                    >
                      {enquiry.name}
                    </Link>
                    <p className="tabular text-xs text-muted-foreground">{enquiry.phone}</p>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="truncate text-sm font-medium">
                      {enquiry.vehicleLabel ?? "General enquiry"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{enquiry.message}</p>
                    {enquiry.followUpAt && (
                      <p className="mt-0.5 text-xs text-amber-ink">
                        Follow up {formatDate(enquiry.followUpAt)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <EnquiryStatusSelect
                      key={enquiry.status}
                      id={enquiry.id}
                      status={enquiry.status}
                      name={enquiry.name}
                    />
                  </TableCell>
                  <TableCell className="hidden text-sm whitespace-nowrap text-muted-foreground md:table-cell">
                    <time
                      dateTime={enquiry.createdAt.toISOString()}
                      title={formatDate(enquiry.createdAt)}
                    >
                      {formatRelative(enquiry.createdAt, now)}
                    </time>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AdminPagination
        page={filters.page}
        pageCount={pageCount}
        total={total}
        href={(page) => href({ page })}
      />
    </div>
  );
}
