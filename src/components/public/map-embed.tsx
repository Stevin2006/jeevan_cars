import { ArrowUpRight, MapPin } from "lucide-react";
import type { PublicSiteSettings } from "@/lib/data/settings";
import { formatAddressLines } from "@/lib/contact";
import { cn } from "@/lib/utils";

const EMBED_PREFIX = "https://www.google.com/maps/embed";

/**
 * Google Maps iframe when an embed URL is configured; otherwise a directions
 * panel that opens the address in Google Maps.
 */
export function MapEmbed({
  settings,
  className,
}: {
  settings: PublicSiteSettings;
  className?: string;
}) {
  const address = formatAddressLines(settings);

  if (settings.mapEmbedUrl?.startsWith(EMBED_PREFIX)) {
    return (
      <div className={cn("overflow-hidden rounded-lg border bg-muted", className)}>
        <iframe
          src={settings.mapEmbedUrl}
          title={`Map showing ${settings.businessName}`}
          className="size-full min-h-80 border-0 grayscale-[0.4]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    );
  }

  const query = encodeURIComponent([settings.businessName, ...address].join(", "));

  return (
    <div
      className={cn(
        "grain relative flex flex-col justify-end overflow-hidden rounded-lg bg-ink p-8 text-paper",
        className,
      )}
    >
      {/* Abstract street grid */}
      <div
        aria-hidden
        className="absolute inset-0 [background-image:linear-gradient(var(--paper)_1px,transparent_1px),linear-gradient(90deg,var(--paper)_1px,transparent_1px)] [mask-image:radial-gradient(circle_at_60%_40%,black,transparent_75%)] [background-size:56px_56px] opacity-[0.12]"
      />
      <span
        aria-hidden
        className="absolute top-[38%] left-[58%] flex size-14 -translate-1/2 items-center justify-center rounded-full bg-amber/15 ring-1 ring-amber/40"
      >
        <MapPin className="size-6 text-amber" aria-hidden />
      </span>
      <div className="relative space-y-4">
        <p className="label-caps text-paper/50">Directions</p>
        {address.length > 0 ? (
          <address className="font-display text-xl leading-snug font-bold not-italic">
            {address.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
        ) : (
          <p className="font-display text-xl font-bold">{settings.businessName}</p>
        )}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${query}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-amber hover:underline"
        >
          Open in Google Maps
          <ArrowUpRight className="size-4" aria-hidden />
        </a>
      </div>
    </div>
  );
}
