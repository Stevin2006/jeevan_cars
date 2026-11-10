import { describe, expect, it } from "vitest";
import {
  CONTACT_FOR_PRICE,
  formatINR,
  formatINRCompact,
  formatKilometres,
  formatOwnership,
  getDisplayPrice,
} from "@/lib/format";
import { formatRelative } from "@/lib/format-date";
import { slugify } from "@/lib/slug";
import {
  formatAddressLines,
  getDirectionsUrl,
  getMapQuery,
  getMapsEmbedUrl,
  getMapsSearchUrl,
  getTelHref,
  getWhatsAppHref,
} from "@/lib/contact";

describe("price formatting", () => {
  it("uses Indian digit grouping", () => {
    expect(formatINR(550_000)).toBe("₹5,50,000");
    expect(formatINR(12_500_000)).toBe("₹1,25,00,000");
  });

  it("formats compact lakh and crore amounts", () => {
    expect(formatINRCompact(750_000)).toBe("₹7.5 Lakh");
    expect(formatINRCompact(1_000_000)).toBe("₹10 Lakh");
    expect(formatINRCompact(12_500_000)).toBe("₹1.25 Crore");
    expect(formatINRCompact(50_000)).toBe("₹50,000");
  });

  it("shows the price only when it is public and set", () => {
    expect(getDisplayPrice({ price: 645_000, showPrice: true })).toBe("₹6,45,000");
    expect(getDisplayPrice({ price: 645_000, showPrice: false })).toBe(CONTACT_FOR_PRICE);
    expect(getDisplayPrice({ price: null, showPrice: true })).toBe(CONTACT_FOR_PRICE);
  });
});

describe("vehicle facts", () => {
  it("formats kilometres and ownership", () => {
    expect(formatKilometres(42_150)).toBe("42,150 km");
    expect(formatOwnership(1)).toBe("1st owner");
    expect(formatOwnership(2)).toBe("2nd owner");
    expect(formatOwnership(3)).toBe("3rd owner");
    expect(formatOwnership(4)).toBe("4th owner");
  });
});

describe("slugify", () => {
  it("builds URL-safe slugs", () => {
    expect(slugify("Maruti Suzuki Swift VXi 2019")).toBe("maruti-suzuki-swift-vxi-2019");
    expect(slugify("  Mercedes-Benz C 220d (AMG)  ")).toBe("mercedes-benz-c-220d-amg");
    expect(slugify("Škoda Octavia")).toBe("skoda-octavia");
    expect(slugify("Hatch & Sedan")).toBe("hatch-and-sedan");
  });

  it("caps length without a trailing hyphen", () => {
    const slug = slugify("a".repeat(79) + " b");
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("contact links", () => {
  it("adds India's country code to 10-digit numbers", () => {
    expect(getTelHref("98765 43210")).toBe("tel:+919876543210");
    expect(getWhatsAppHref("+91 98765 43210")).toBe("https://wa.me/919876543210");
  });

  it("encodes a prefilled WhatsApp message", () => {
    expect(getWhatsAppHref("9876543210", "Hi & hello?")).toBe(
      "https://wa.me/919876543210?text=Hi%20%26%20hello%3F",
    );
  });

  it("joins address lines and skips blanks", () => {
    expect(
      formatAddressLines({
        addressLine1: "12 MG Road",
        addressLine2: null,
        city: "Kochi",
        state: "Kerala",
        postalCode: "682001",
      }),
    ).toEqual(["12 MG Road", "Kochi, Kerala 682001"]);
    expect(
      formatAddressLines({
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        postalCode: null,
      }),
    ).toEqual([]);
  });
});

describe("formatRelative", () => {
  const now = Date.UTC(2026, 10, 6, 12, 0, 0);
  it("describes recent times", () => {
    expect(formatRelative(new Date(now - 20_000), now)).toBe("just now");
    expect(formatRelative(new Date(now - 5 * 60_000), now)).toBe("5 min ago");
    expect(formatRelative(new Date(now - 3 * 3_600_000), now)).toBe("3 h ago");
    expect(formatRelative(new Date(now - 2 * 86_400_000), now)).toBe("2 d ago");
  });
  it("falls back to a date after a week", () => {
    expect(formatRelative(new Date(now - 10 * 86_400_000), now)).toBe("27 Oct 2026");
  });
});

describe("map links", () => {
  const base = {
    businessName: "Jeevan Cars",
    addressLine1: "58X2+7QF, near Monday Market",
    addressLine2: "Kanyakumari District",
    city: "Thingalnagar",
    state: "Tamil Nadu",
    postalCode: "629802",
  };

  it("prefers the Plus Code with town and state", () => {
    expect(getMapQuery(base)).toBe("58X2+7QF, Thingalnagar, Tamil Nadu");
  });

  it("falls back to name and full address without a Plus Code", () => {
    expect(getMapQuery({ ...base, addressLine1: "12 Main Road" })).toBe(
      "Jeevan Cars, 12 Main Road, Kanyakumari District, Thingalnagar, Tamil Nadu 629802",
    );
  });

  it("returns null when there is no address", () => {
    expect(
      getMapQuery({
        businessName: "Jeevan Cars",
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        postalCode: null,
      }),
    ).toBeNull();
  });

  it("encodes the + in Plus Codes for every Google Maps URL", () => {
    const query = "58X2+7QF, Thingalnagar, Tamil Nadu";
    expect(getMapsEmbedUrl(query)).toBe(
      "https://www.google.com/maps?q=58X2%2B7QF%2C%20Thingalnagar%2C%20Tamil%20Nadu&z=16&output=embed",
    );
    expect(getDirectionsUrl(query)).toContain("destination=58X2%2B7QF");
    expect(getMapsSearchUrl(query)).toContain("api=1&query=58X2%2B7QF");
  });
});
