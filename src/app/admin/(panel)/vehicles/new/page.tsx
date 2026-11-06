import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/page-title";
import { VehicleForm } from "@/components/admin/vehicles/vehicle-form";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getTaxonomyOptions } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Add vehicle" };

export default async function NewVehiclePage() {
  await requireAdmin();
  const options = await getTaxonomyOptions();

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Add vehicle"
        description="Save as a draft while you gather photos, then publish when it's ready."
      />
      <VehicleForm options={options} />
    </div>
  );
}
