import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/page-title";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listTaxonomy } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const rows = await listTaxonomy("category");

  return (
    <div className="mx-auto max-w-5xl">
      <PageTitle
        title="Categories"
        description="Group your stock for browsing. Categories with vehicles can't be deleted — hide them instead."
      />
      <TaxonomyManager kind="category" rows={rows} />
    </div>
  );
}
