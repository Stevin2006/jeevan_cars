import { AdminShell } from "@/components/admin/admin-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  const newEnquiries = await prisma.enquiry.count({ where: { status: "NEW" } });

  return (
    <TooltipProvider delayDuration={300}>
      <AdminShell admin={{ name: admin.name, email: admin.email }} newEnquiries={newEnquiries}>
        {children}
      </AdminShell>
    </TooltipProvider>
  );
}
