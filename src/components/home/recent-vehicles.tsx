import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/public/section-heading";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { getRecentVehicles } from "@/lib/data/vehicles";

/** Newest arrivals: a swipeable rail on phones, a four-up grid on desktop. */
export async function RecentVehicles() {
  const vehicles = await getRecentVehicles(8);
  if (vehicles.length === 0) return null;

  return (
    <section aria-labelledby="recent-heading" className="border-t bg-surface py-20 sm:py-28">
      <div className="container-page">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Just arrived"
            title={<span id="recent-heading">Recently added</span>}
            description="Fresh stock moves quickly. Here's what's come in most recently."
          />
          <Link
            href="/vehicles?sort=newest"
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium"
          >
            See all new arrivals
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </div>
      </div>

      <ul className="container-page mt-12 flex snap-x snap-mandatory [scrollbar-width:thin] gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:pb-0">
        {vehicles.map((vehicle) => (
          <li key={vehicle.id} className="flex w-[80%] shrink-0 snap-start sm:w-[45%] lg:w-auto">
            <VehicleCard vehicle={vehicle} className="w-full" />
          </li>
        ))}
      </ul>
    </section>
  );
}
