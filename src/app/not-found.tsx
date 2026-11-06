import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import PublicNotFound from "@/app/(public)/not-found";

/** Unmatched URLs anywhere in the app get the public chrome around the 404. */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col">
        <PublicNotFound />
      </main>
      <SiteFooter />
    </>
  );
}
