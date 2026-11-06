import { Suspense } from "react";
import { Navbar, RouteAwareNavbar } from "@/components/layout/navbar";
import { getSiteSettings } from "@/lib/data/settings";

export async function SiteHeader() {
  const { phone, whatsappNumber } = await getSiteSettings();
  const contact = { phone, whatsappNumber };
  return (
    <Suspense fallback={<Navbar contact={contact} pathname={null} />}>
      <RouteAwareNavbar contact={contact} />
    </Suspense>
  );
}
