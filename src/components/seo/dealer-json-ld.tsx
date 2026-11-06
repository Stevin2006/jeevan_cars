import { JsonLd } from "@/components/seo/json-ld";
import { getSiteSettings } from "@/lib/data/settings";
import { env } from "@/lib/env";

/** schema.org AutoDealer for the homepage and contact page. */
export async function DealerJsonLd() {
  const settings = await getSiteSettings();
  const sameAs = [settings.facebookUrl, settings.instagramUrl, settings.youtubeUrl].filter(Boolean);

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "AutoDealer",
        name: settings.businessName,
        url: env.NEXT_PUBLIC_SITE_URL,
        ...(settings.tagline && { description: settings.tagline }),
        ...(settings.phone && { telephone: settings.phone }),
        ...(settings.email && { email: settings.email }),
        ...(settings.heroImageUrl && { image: settings.heroImageUrl }),
        ...(settings.addressLine1 && {
          address: {
            "@type": "PostalAddress",
            streetAddress: [settings.addressLine1, settings.addressLine2]
              .filter(Boolean)
              .join(", "),
            addressLocality: settings.city,
            addressRegion: settings.state,
            postalCode: settings.postalCode,
            addressCountry: "IN",
          },
        }),
        ...(sameAs.length > 0 && { sameAs }),
      }}
    />
  );
}
