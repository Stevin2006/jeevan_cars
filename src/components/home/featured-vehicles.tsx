import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/public/section-heading";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { getFeaturedVehicles } from "@/lib/data/vehicles";

export async function FeaturedVehicles() {
  const vehicles = await getFeaturedVehicles(6);
  if (vehicles.length === 0) return null;

  return (
    <section id="featured" aria-labelledby="featured-heading" className="py-20 sm:py-28">
      <div className="container-page">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Featured"
            title={<span id="featured-heading">Hand-picked from the forecourt</span>}
            description="Our pick of the stock right now — checked over, cleaned up and ready for a test drive."
          />
          <Link
            href="/vehicles"
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium text-ink"
          >
            View all vehicles
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle, index) => (
            <li key={vehicle.id} className="flex">
              <Reveal delay={(index % 3) * 0.08} className="flex w-full">
                <VehicleCard vehicle={vehicle} className="w-full" />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
