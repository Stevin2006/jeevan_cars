import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/admin/page-title";
import { AvailabilityStatusBadge, PublicationBadge } from "@/components/admin/status-badges";
import { VehicleForm } from "@/components/admin/vehicles/vehicle-form";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getTaxonomyOptions, getVehicleForEdit } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/format-date";

export const metadata: Metadata = { title: "Edit vehicle" };

export default async function EditVehiclePage({ params }: PageProps<"/admin/vehicles/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  const [vehicle, options] = await Promise.all([getVehicleForEdit(id), getTaxonomyOptions()]);
  if (!vehicle) notFound();

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title={`${vehicle.manufacturingYear} ${vehicle.name}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <PublicationBadge status={vehicle.status} />
            <AvailabilityStatusBadge status={vehicle.availability} />
            <span>Last updated {formatDateTime(vehicle.updatedAt)}</span>
            {vehicle._count.enquiries > 0 && (
              <Link
                href={`/admin/enquiries?vehicle=${vehicle.id}`}
                className="underline underline-offset-4"
              >
                {vehicle._count.enquiries}{" "}
                {vehicle._count.enquiries === 1 ? "enquiry" : "enquiries"}
              </Link>
            )}
          </span>
        }
      />
      {/* Remount after each save so the form picks up server-normalised values. */}
      <VehicleForm key={vehicle.updatedAt.toISOString()} vehicle={vehicle} options={options} />
    </div>
  );
}
