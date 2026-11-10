import { ArrowUpRight, MapPin, Navigation } from "lucide-react";
import type { PublicSiteSettings } from "@/lib/data/settings";
import {
  formatAddressLines,
  getDirectionsUrl,
  getMapQuery,
  getMapsEmbedUrl,
  getMapsSearchUrl,
} from "@/lib/contact";
import { cn } from "@/lib/utils";

const ADMIN_EMBED_PREFIX = "https://www.google.com/maps/embed";

/**
 * Live Google Map of the dealership with directions. Uses the exact embed link
 * from Admin › Settings when one is set, otherwise builds one from the address
 * (preferring its Plus Code). Without an address, shows a placeholder panel.
 */
export function MapEmbed({
  settings,
  className,
}: {
  settings: PublicSiteSettings;
  className?: string;
}) {
  const query = getMapQuery(settings);
  const adminEmbed = settings.mapEmbedUrl?.startsWith(ADMIN_EMBED_PREFIX)
    ? settings.mapEmbedUrl
    : null;
  const src = adminEmbed ?? (query ? getMapsEmbedUrl(query) : null);

  if (!src) {
    return (
      <div
        className={cn(
          "grain relative flex flex-col items-start justify-end gap-2 overflow-hidden rounded-lg bg-ink p-8 text-paper",
          className,
        )}
      >
        <MapPin className="size-6 text-amber" aria-hidden />
        <p className="font-display text-xl font-bold">{settings.businessName}</p>
        <p className="text-sm text-paper/60">Our address will appear here soon.</p>
      </div>
    );
  }

  const [firstLine] = formatAddressLines(settings);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border bg-surface shadow-[0_18px_40px_-28px_rgba(15,18,22,0.45)]",
        className,
      )}
    >
      <div className="relative min-h-80 flex-1 bg-muted">
        <iframe
          src={src}
          title={`Map showing the location of ${settings.businessName}`}
          className="absolute inset-0 size-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>

      {query && (
        <div className="flex flex-col gap-3 border-t px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex min-w-0 items-center gap-2 text-sm">
            <MapPin className="size-4 shrink-0 text-amber-ink" aria-hidden />
            <span className="truncate">
              <span className="font-medium">{settings.businessName}</span>
              {firstLine && <span className="text-muted-foreground"> · {firstLine}</span>}
            </span>
          </p>
          <div className="flex shrink-0 gap-2">
            <a
              href={getDirectionsUrl(query)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-ink px-3 text-sm font-medium text-paper transition-colors hover:bg-ink/85"
            >
              <Navigation className="size-4" aria-hidden />
              Get directions
            </a>
            <a
              href={getMapsSearchUrl(query)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors hover:border-ink/30"
            >
              Open in Maps
              <ArrowUpRight className="size-4" aria-hidden />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
