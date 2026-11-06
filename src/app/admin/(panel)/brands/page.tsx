import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/page-title";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listTaxonomy } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Brands" };

export default async function AdminBrandsPage() {
  await requireAdmin();
  const rows = await listTaxonomy("brand");

  return (
    <div className="mx-auto max-w-5xl">
      <PageTitle title="Brands" description="Manufacturers available when listing a vehicle." />
      <TaxonomyManager kind="brand" rows={rows} />
    </div>
  );
}
