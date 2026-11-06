import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CarFront, Plus } from "lucide-react";
import { PageTitle } from "@/components/admin/page-title";
import { StatCounter } from "@/components/admin/stat-counter";
import {
  AvailabilityStatusBadge,
  EnquiryStatusBadge,
  PublicationBadge,
} from "@/components/admin/status-badges";
import { SmartImage } from "@/components/media/smart-image";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getDashboardData } from "@/lib/data/admin";
import { CONTACT_FOR_PRICE, formatINR } from "@/lib/format";
import { formatRelative } from "@/lib/format-date";

export const metadata: Metadata = { title: "Dashboard" };

function StatCard({
  label,
  value,
  hint,
  href,
  accent,
}: {
  label: string;
  value: number;
  hint?: string;
  href?: string;
  accent?: string;
}) {
  const body = (
    <>
      <div className="flex items-center gap-2">
        {accent && <span aria-hidden className={`size-2 rounded-full ${accent}`} />}
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 font-display text-3xl font-bold">
        <StatCounter value={value} />
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </>
  );
  const className = "block rounded-lg border bg-surface p-5 transition-colors";
  return href ? (
    <Link href={href} className={`${className} hover:border-ink/25`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const {
    generatedAt: now,
    stats,
    recentEnquiries,
    recentVehicles,
    stockByCategory,
  } = await getDashboardData();
  const maxCategory = Math.max(1, ...stockByCategory.map((category) => category.count));
  const weekDelta = stats.enquiriesThisWeek - stats.enquiriesLastWeek;

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title={`Welcome back, ${admin.name.split(" ")[0]}`}
        description="Here's how the forecourt and your leads look right now."
        actions={
          <Button asChild size="lg">
            <Link href="/admin/vehicles/new">
              <Plus data-icon="inline-start" aria-hidden />
              Add vehicle
            </Link>
          </Button>
        }
      />

      <section
        aria-label="Inventory and enquiry totals"
        className="grid grid-cols-2 gap-3 lg:grid-cols-5"
      >
        <StatCard
          label="Total vehicles"
          value={stats.total}
          hint={`${stats.drafts} in draft`}
          href="/admin/vehicles"
        />
        <StatCard
          label="Available"
          value={stats.available}
          accent="bg-status-available"
          href="/admin/vehicles?availability=AVAILABLE"
        />
        <StatCard
          label="Reserved"
          value={stats.reserved}
          accent="bg-status-reserved"
          href="/admin/vehicles?availability=RESERVED"
        />
        <StatCard
          label="Sold"
          value={stats.sold}
          accent="bg-status-sold"
          href="/admin/vehicles?availability=SOLD"
        />
        <StatCard
          label="Enquiries"
          value={stats.enquiriesTotal}
          hint={`${stats.enquiriesNew} new · ${stats.enquiriesThisWeek} this week (${weekDelta >= 0 ? "+" : ""}${weekDelta} vs last)`}
          href="/admin/enquiries"
        />
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section
          aria-labelledby="recent-enquiries"
          className="rounded-lg border bg-surface lg:col-span-3"
        >
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 id="recent-enquiries" className="font-semibold">
              Recent enquiries
            </h2>
            <Link
              href="/admin/enquiries"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink"
            >
              View all <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          {recentEnquiries.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No enquiries yet. They&rsquo;ll appear here as soon as customers get in touch.
            </p>
          ) : (
            <ul className="divide-y">
              {recentEnquiries.map((enquiry) => (
                <li key={enquiry.id}>
                  <Link
                    href={`/admin/enquiries/${enquiry.id}`}
                    className="flex items-start gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{enquiry.name}</p>
                        <EnquiryStatusBadge status={enquiry.status} />
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {enquiry.vehicleLabel ?? "General enquiry"} · {enquiry.message}
                      </p>
                    </div>
                    <time
                      dateTime={enquiry.createdAt.toISOString()}
                      className="shrink-0 text-xs text-muted-foreground"
                    >
                      {formatRelative(enquiry.createdAt, now)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="stock-by-category"
          className="rounded-lg border bg-surface lg:col-span-2"
        >
          <div className="border-b px-5 py-4">
            <h2 id="stock-by-category" className="font-semibold">
              Stock by category
            </h2>
            <p className="text-xs text-muted-foreground">Published, not yet sold</p>
          </div>
          {stockByCategory.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No vehicles in stock.
            </p>
          ) : (
            <ul className="space-y-3 px-5 py-4">
              {stockByCategory.map((category) => (
                <li key={category.id} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span>{category.name}</span>
                    <span className="tabular font-mono text-muted-foreground">
                      {category.count}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div
                      className="h-full rounded-full bg-ink"
                      style={{ width: `${(category.count / maxCategory) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="recent-vehicles" className="mt-6 rounded-lg border bg-surface">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 id="recent-vehicles" className="font-semibold">
            Recently added vehicles
          </h2>
          <Link
            href="/admin/vehicles"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink"
          >
            All vehicles <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        {recentVehicles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
            <p className="text-sm text-muted-foreground">Your inventory is empty.</p>
            <Button asChild>
              <Link href="/admin/vehicles/new">Add your first vehicle</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y">
            {recentVehicles.map((vehicle) => (
              <li key={vehicle.id}>
                <Link
                  href={`/admin/vehicles/${vehicle.id}/edit`}
                  className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-sm bg-muted">
                    {vehicle.imageUrl ? (
                      <SmartImage
                        src={vehicle.imageUrl}
                        alt=""
                        fill
                        sizes="64px"
                        quality={60}
                        className="object-cover"
                      />
                    ) : (
                      <CarFront className="m-auto mt-3 size-5 text-muted-foreground" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {vehicle.manufacturingYear} {vehicle.name}
                    </p>
                    <p className="tabular text-sm text-muted-foreground">
                      {vehicle.price !== null ? formatINR(vehicle.price) : "No price set"}
                      {!vehicle.showPrice && ` · shown as “${CONTACT_FOR_PRICE}”`}
                    </p>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <PublicationBadge status={vehicle.status} />
                    <AvailabilityStatusBadge status={vehicle.availability} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
