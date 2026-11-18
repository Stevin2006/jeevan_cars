import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { NAV_LINKS } from "@/components/layout/nav-links";
import { getSiteSettings } from "@/lib/data/settings";
import { getCategoriesWithCounts } from "@/lib/data/taxonomy";
import { CACHE_TAGS } from "@/lib/data/tags";
import { formatAddressLines, getTelHref, getWhatsAppHref } from "@/lib/contact";

const SOCIAL_LABELS = {
  facebookUrl: "Facebook",
  instagramUrl: "Instagram",
  youtubeUrl: "YouTube",
} as const;

export async function SiteFooter() {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.settings, CACHE_TAGS.taxonomy);

  const [settings, categories] = await Promise.all([getSiteSettings(), getCategoriesWithCounts()]);
  const address = formatAddressLines(settings);
  const socials = (Object.keys(SOCIAL_LABELS) as (keyof typeof SOCIAL_LABELS)[]).flatMap((key) => {
    const href = settings[key];
    return href ? [{ label: SOCIAL_LABELS[key], href }] : [];
  });

  return (
    <footer className="grain bg-ink text-paper">
      <div className="container-page grid gap-12 py-16 md:grid-cols-12 lg:py-20">
        <div className="space-y-5 md:col-span-4">
          <Logo tone="light" size="lg" />
          <p className="max-w-xs text-sm leading-relaxed text-paper/60">
            {settings.tagline ??
              "Quality pre-owned cars and commercial vehicles, inspected and honestly priced."}
          </p>
          {socials.length > 0 && (
            <ul className="flex gap-4 text-sm">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-paper/60 underline-offset-4 transition-colors hover:text-paper hover:underline"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Vehicle categories" className="md:col-span-3">
          <h2 className="mb-4 label-caps text-paper/40">Browse</h2>
          <ul className="space-y-2.5 text-sm">
            {categories
              .filter((category) => category.vehicleCount > 0)
              .slice(0, 6)
              .map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/vehicles?category=${category.slug}`}
                    className="text-paper/75 transition-colors hover:text-paper"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            <li>
              <Link
                href="/vehicles"
                className="text-brand-bright transition-colors hover:text-paper"
              >
                All vehicles
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Footer" className="md:col-span-2">
          <h2 className="mb-4 label-caps text-paper/40">Company</h2>
          <ul className="space-y-2.5 text-sm">
            {NAV_LINKS.filter((link) => link.href !== "/").map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-paper/75 transition-colors hover:text-paper">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-3">
          <h2 className="mb-4 label-caps text-paper/40">Visit &amp; contact</h2>
          <ul className="space-y-3 text-sm text-paper/75">
            {address.length > 0 && (
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-bright" aria-hidden />
                <address className="not-italic">
                  {address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </li>
            )}
            {settings.phone && (
              <li>
                <a
                  href={getTelHref(settings.phone)}
                  className="tabular flex gap-3 hover:text-paper"
                >
                  <Phone className="mt-0.5 size-4 shrink-0 text-brand-bright" aria-hidden />
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.whatsappNumber && (
              <li>
                <a
                  href={getWhatsAppHref(settings.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 hover:text-paper"
                >
                  <MessageCircle className="mt-0.5 size-4 shrink-0 text-brand-bright" aria-hidden />
                  WhatsApp us
                </a>
              </li>
            )}
            {settings.email && (
              <li>
                <a
                  href={`mailto:${settings.email}`}
                  className="flex gap-3 break-all hover:text-paper"
                >
                  <Mail className="mt-0.5 size-4 shrink-0 text-brand-bright" aria-hidden />
                  {settings.email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-paper/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {settings.businessName}. All rights reserved.
          </p>
          <p>Prices and availability are subject to change without notice.</p>
        </div>
      </div>
    </footer>
  );
}
