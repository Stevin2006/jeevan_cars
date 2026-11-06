import { CategoryGrid } from "@/components/home/category-grid";
import { ContactSection } from "@/components/home/contact-section";
import { DealershipIntro } from "@/components/home/dealership-intro";
import { EnquiryCta } from "@/components/home/enquiry-cta";
import { FeaturedVehicles } from "@/components/home/featured-vehicles";
import { Hero } from "@/components/home/hero";
import { RecentVehicles } from "@/components/home/recent-vehicles";
import { WhyChoose } from "@/components/home/why-choose";
import { DealerJsonLd } from "@/components/seo/dealer-json-ld";

export default function HomePage() {
  return (
    <>
      <DealerJsonLd />
      <Hero />
      <FeaturedVehicles />
      <CategoryGrid />
      <WhyChoose />
      <RecentVehicles />
      <DealershipIntro />
      <EnquiryCta />
      <ContactSection />
    </>
  );
}
