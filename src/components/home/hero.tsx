import { HeroContent } from "@/components/home/hero-content";
import { SmartImage } from "@/components/media/smart-image";
import { HeroBackdrop } from "@/components/home/hero-backdrop";
import { getSiteSettings } from "@/lib/data/settings";
import { getFeaturedVehicles, getInventoryStats } from "@/lib/data/vehicles";

export async function Hero() {
  const [settings, stats, featured] = await Promise.all([
    getSiteSettings(),
    getInventoryStats(),
    getFeaturedVehicles(1),
  ]);

  // Admin-chosen hero photo, else the lead featured vehicle.
  const image = settings.heroImageUrl
    ? { url: settings.heroImageUrl, alt: "" }
    : featured[0]?.image
      ? { url: featured[0].image.url, alt: "" }
      : null;

  return (
    <section
      aria-labelledby="hero-heading"
      className="grain relative flex min-h-[max(36rem,100svh)] flex-col overflow-hidden bg-ink text-paper lg:max-h-[60rem]"
    >
      {image && (
        <HeroBackdrop>
          <SmartImage
            src={image.url}
            alt={image.alt}
            fill
            preload
            quality={75}
            sizes="100vw"
            className="object-cover object-[60%_center]"
          />
        </HeroBackdrop>
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,18,22,0.92)_0%,rgba(15,18,22,0.7)_38%,rgba(15,18,22,0.15)_75%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink via-ink/60 to-transparent"
      />

      <HeroContent city={settings.city} stats={stats} />
    </section>
  );
}
