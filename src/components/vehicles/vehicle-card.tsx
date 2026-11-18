import Link from "next/link";
import { CarFront } from "lucide-react";
import { SmartImage } from "@/components/media/smart-image";
import { AvailabilityBadge } from "@/components/vehicles/availability-badge";
import { Odometer } from "@/components/vehicles/odometer";
import type { VehicleCardData } from "@/lib/data/vehicles";
import { FUEL_LABELS, TRANSMISSION_LABELS, formatOwnership, getDisplayPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function VehicleCard({
  vehicle,
  priority = false,
  eager = priority,
  className,
}: {
  vehicle: VehicleCardData;
  /** The likely LCP image: load eagerly at high priority. */
  priority?: boolean;
  /** Above the fold but not the LCP: load eagerly at normal priority. */
  eager?: boolean;
  className?: string;
}) {
  const title = `${vehicle.brand.name} ${vehicle.model}`;
  const priceLabel = getDisplayPrice(vehicle);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg bg-card ring-1 ring-ink/[0.07] transition-[box-shadow,translate] duration-500 ease-out-quart hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(15,18,22,0.45)]",
        className,
      )}
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-muted">
        {vehicle.image ? (
          <SmartImage
            src={vehicle.image.url}
            alt={vehicle.image.altText ?? title}
            fill
            loading={eager ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out-quart group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <CarFront className="size-10" strokeWidth={1.25} aria-hidden />
          </div>
        )}
        {vehicle.availability !== "AVAILABLE" && (
          <AvailabilityBadge status={vehicle.availability} className="absolute top-3 left-3" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-1.5">
          <p className="label-caps text-muted-foreground">
            {vehicle.manufacturingYear} · {vehicle.category.name}
          </p>
          <h3 className="font-display text-lg leading-tight font-bold">
            <Link
              href={`/vehicles/${vehicle.slug}`}
              className="outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-ring"
            >
              {title}
            </Link>
          </h3>
          {vehicle.variant && (
            <p className="truncate text-sm text-muted-foreground">{vehicle.variant}</p>
          )}
        </div>

        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[0.8125rem] text-ink/80">
          <li>{FUEL_LABELS[vehicle.fuelType]}</li>
          <li aria-hidden className="text-line">
            |
          </li>
          <li>{TRANSMISSION_LABELS[vehicle.transmission]}</li>
          <li aria-hidden className="text-line">
            |
          </li>
          <li>{formatOwnership(vehicle.ownershipCount)}</li>
        </ul>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-dashed pt-4">
          <Odometer km={vehicle.kilometresDriven} />
          <p
            className={cn(
              "tabular text-right",
              vehicle.price !== null
                ? "font-display text-lg font-bold"
                : "text-sm font-medium text-brand-ink",
            )}
          >
            {priceLabel}
          </p>
        </div>
      </div>
    </article>
  );
}
