import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight, MessageCircle, Phone } from "lucide-react";
import { EnquiryForm } from "@/components/enquiry/enquiry-form";
import { SectionHeading } from "@/components/public/section-heading";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { AnimatedOdometer } from "@/components/vehicles/animated-odometer";
import { AvailabilityBadge } from "@/components/vehicles/availability-badge";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { SpecSheet } from "@/components/vehicle-detail/spec-sheet";
import { VehicleDetailSkeleton } from "@/components/vehicle-detail/vehicle-detail-skeleton";
import { VehicleGallery } from "@/components/vehicle-detail/vehicle-gallery";
import { getSiteSettings } from "@/lib/data/settings";
import { getRelatedVehicles, getVehicleBySlug, type VehicleDetailData } from "@/lib/data/vehicles";
import { getTelHref, getWhatsAppHref } from "@/lib/contact";
import { env } from "@/lib/env";
import {
  FUEL_LABELS,
  TRANSMISSION_LABELS,
  formatKilometres,
  formatOwnership,
  getDisplayPrice,
} from "@/lib/format";

function vehicleTitle(vehicle: Pick<VehicleDetailData, "manufacturingYear" | "name">) {
  return `${vehicle.manufacturingYear} ${vehicle.name}`;
}

export async function generateMetadata({
  params,
}: PageProps<"/vehicles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) return { title: "Vehicle not found", robots: { index: false } };

  const title = `${vehicleTitle(vehicle)} — ${getDisplayPrice(vehicle)}`;
  const description = [
    `${FUEL_LABELS[vehicle.fuelType]}, ${TRANSMISSION_LABELS[vehicle.transmission]}`,
    formatKilometres(vehicle.kilometresDriven),
    formatOwnership(vehicle.ownershipCount),
    `${vehicle.category.name} for sale at Jeevan Cars.`,
  ].join(" · ");
  const image = vehicle.images[0];

  return {
    title,
    description,
    alternates: { canonical: `/vehicles/${vehicle.slug}` },
    openGraph: {
      title,
      description,
      url: `/vehicles/${vehicle.slug}`,
      images: image
        ? [{ url: image.url, width: image.width, height: image.height, alt: vehicleTitle(vehicle) }]
        : undefined,
    },
  };
}

export default function VehiclePage({ params }: PageProps<"/vehicles/[slug]">) {
  return (
    <Suspense fallback={<VehicleDetailSkeleton />}>
      <VehicleDetail params={params} />
    </Suspense>
  );
}

async function VehicleDetail({ params }: { params: PageProps<"/vehicles/[slug]">["params"] }) {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) notFound();

  const [settings, related] = await Promise.all([
    getSiteSettings(),
    getRelatedVehicles({
      id: vehicle.id,
      categoryId: vehicle.categoryId,
      brandId: vehicle.brandId,
    }),
  ]);

  const title = vehicleTitle(vehicle);
  const url = `${env.NEXT_PUBLIC_SITE_URL}/vehicles/${vehicle.slug}`;
  const sold = vehicle.availability === "SOLD";
  const keyFacts = [
    { label: "Year", value: String(vehicle.manufacturingYear) },
    { label: "Fuel", value: FUEL_LABELS[vehicle.fuelType] },
    { label: "Gearbox", value: TRANSMISSION_LABELS[vehicle.transmission] },
    { label: "Owner", value: formatOwnership(vehicle.ownershipCount).replace(" owner", "") },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Car",
          name: title,
          url,
          brand: { "@type": "Brand", name: vehicle.brand.name },
          model: vehicle.model,
          ...(vehicle.variant && { vehicleConfiguration: vehicle.variant }),
          vehicleModelDate: String(vehicle.manufacturingYear),
          mileageFromOdometer: {
            "@type": "QuantitativeValue",
            value: vehicle.kilometresDriven,
            unitCode: "KMT",
          },
          fuelType: FUEL_LABELS[vehicle.fuelType],
          vehicleTransmission: TRANSMISSION_LABELS[vehicle.transmission],
          numberOfPreviousOwners: vehicle.ownershipCount,
          itemCondition: "https://schema.org/UsedCondition",
          ...(vehicle.colour && { color: vehicle.colour }),
          image: vehicle.images.map((image) => image.url),
          description: vehicle.description,
          offers: {
            "@type": "Offer",
            priceCurrency: "INR",
            ...(vehicle.price !== null && { price: vehicle.price }),
            availability: sold
              ? "https://schema.org/SoldOut"
              : vehicle.availability === "RESERVED"
                ? "https://schema.org/LimitedAvailability"
                : "https://schema.org/InStock",
            seller: { "@type": "AutoDealer", name: settings.businessName },
          },
        }}
      />

      <div className="container-page pt-[calc(var(--nav-height)+1.5rem)] pb-16 sm:pb-24">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link href="/vehicles" className="hover:text-ink">
                Vehicles
              </Link>
            </li>
            <ChevronRight className="size-3.5" aria-hidden />
            <li>
              <Link href={`/vehicles?category=${vehicle.category.slug}`} className="hover:text-ink">
                {vehicle.category.name}
              </Link>
            </li>
            <ChevronRight className="size-3.5" aria-hidden />
            <li aria-current="page" className="truncate text-ink">
              {vehicle.brand.name} {vehicle.model}
            </li>
          </ol>
        </nav>

        {sold && (
          <div className="mb-6 rounded-lg border border-status-sold/30 bg-status-sold/5 px-5 py-4 text-sm">
            <strong className="font-semibold">This vehicle has been sold.</strong>{" "}
            <Link
              href={`/vehicles?category=${vehicle.category.slug}`}
              className="underline underline-offset-4"
            >
              See similar {vehicle.category.name.toLowerCase()} in stock
            </Link>
            .
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 lg:col-span-7">
            <VehicleGallery key={vehicle.id} images={vehicle.images} title={title} />
          </div>

          <aside className="min-w-0 lg:col-span-5">
            <div className="space-y-6 lg:sticky lg:top-[calc(var(--nav-height)+1.5rem)]">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="label-caps text-muted-foreground">
                    {vehicle.manufacturingYear} · {vehicle.category.name}
                  </p>
                  <AvailabilityBadge status={vehicle.availability} className="shadow-none" />
                </div>
                <h1 className="font-display text-3xl leading-[1.05] font-extrabold sm:text-4xl">
                  {vehicle.brand.name} {vehicle.model}
                </h1>
                {vehicle.variant && (
                  <p className="text-lg text-muted-foreground">{vehicle.variant}</p>
                )}
              </div>

              <div className="border-y py-5">
                {vehicle.price !== null ? (
                  <>
                    <p className="label-caps text-muted-foreground">Price</p>
                    <p className="tabular mt-1 font-display text-4xl font-extrabold">
                      {getDisplayPrice(vehicle)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-2xl font-bold text-brand-ink">
                      Contact for Price
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Call or message us for today&rsquo;s best price on this vehicle.
                    </p>
                  </>
                )}
              </div>

              <dl className="grid grid-cols-4 gap-px overflow-hidden rounded-lg border bg-line">
                {keyFacts.map((fact) => (
                  <div key={fact.label} className="bg-surface px-3 py-3">
                    <dt className="label-caps text-muted-foreground">{fact.label}</dt>
                    <dd className="mt-1 text-[0.8125rem] leading-snug font-semibold break-words">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <AnimatedOdometer km={vehicle.kilometresDriven} />

              {!sold && (
                <div className="grid gap-2">
                  <Button asChild size="xl">
                    <a href="#enquire">Enquire about this vehicle</a>
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    {settings.whatsappNumber && (
                      <Button asChild variant="accent" size="xl">
                        <a
                          href={getWhatsAppHref(
                            settings.whatsappNumber,
                            `Hi, I'm interested in the ${title} (${url}). Is it still available?`,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle data-icon="inline-start" aria-hidden />
                          WhatsApp
                        </a>
                      </Button>
                    )}
                    {settings.phone && (
                      <Button asChild variant="outline" size="xl" className="bg-surface">
                        <a href={getTelHref(settings.phone)}>
                          <Phone data-icon="inline-start" aria-hidden />
                          Call us
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 space-y-12 lg:col-span-7">
            <section aria-labelledby="overview-heading" className="space-y-4">
              <h2 id="overview-heading" className="font-display text-2xl font-bold">
                Overview
              </h2>
              <div className="max-w-prose text-[0.9375rem] leading-relaxed whitespace-pre-line text-ink/85">
                {vehicle.description}
              </div>
            </section>
            <section aria-label="Specifications">
              <SpecSheet vehicle={vehicle} />
            </section>
          </div>

          <section
            id="enquire"
            aria-labelledby="enquire-heading"
            className="scroll-mt-28 lg:col-span-5"
          >
            <div className="rounded-xl bg-muted/60 p-6 ring-1 ring-ink/5 sm:p-8">
              <h2 id="enquire-heading" className="font-display text-2xl font-bold">
                {sold ? "Looking for something similar?" : "Ask about this vehicle"}
              </h2>
              <p className="mt-2 mb-6 text-sm text-muted-foreground">
                Book a test drive, ask about finance or request more photos. We&rsquo;ll call you
                back.
              </p>
              <EnquiryForm
                source="VEHICLE_PAGE"
                vehicleId={vehicle.id}
                defaultMessage={
                  sold
                    ? `Hi, I saw the ${title} has been sold. Please let me know if you have something similar.`
                    : `Hi, I'm interested in the ${title}. Is it still available?`
                }
              />
            </div>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="border-t bg-surface py-16 sm:py-24">
          <div className="container-page space-y-10">
            <SectionHeading
              eyebrow="You may also like"
              title={<span id="related-heading">Similar vehicles</span>}
            />
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <li key={item.id} className="flex">
                  <VehicleCard vehicle={item} className="w-full" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
