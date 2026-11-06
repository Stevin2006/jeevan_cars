/**
 * DEVELOPMENT ONLY — sample inventory for building and testing the UI.
 * Images are hotlinked from Unsplash (free licence) and do not show the exact
 * make and model listed. Refuses to run with NODE_ENV=production.
 *
 *   npm run db:seed:sample
 */
import "dotenv/config";
import { createPrismaClient } from "@/lib/db/create-client";
import { slugify } from "@/lib/slug";
import type { Prisma } from "@/generated/prisma/client";
import type {
  AvailabilityStatus,
  FuelType,
  PublicationStatus,
  Transmission,
  VehicleCondition,
} from "@/generated/prisma/enums";

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?w=1800&h=1200&fit=crop&crop=entropy&q=80&auto=format`;

type SampleVehicle = {
  brand: string;
  category: string;
  model: string;
  variant?: string;
  year: number;
  regYear?: number;
  km: number;
  fuel: FuelType;
  transmission: Transmission;
  owners: number;
  condition: VehicleCondition;
  colour?: string;
  seats?: number;
  price?: number;
  showPrice?: boolean;
  availability?: AvailabilityStatus;
  status?: PublicationStatus;
  featured?: boolean;
  daysAgo: number;
  photos: string[];
  description: string;
  specs?: [group: string, label: string, value: string][];
};

const SAMPLE_VEHICLES: SampleVehicle[] = [
  {
    brand: "Hyundai",
    category: "Hatchbacks",
    model: "i20",
    variant: "Asta 1.2",
    year: 2019,
    regYear: 2019,
    km: 42_150,
    fuel: "PETROL",
    transmission: "MANUAL",
    owners: 1,
    condition: "EXCELLENT",
    colour: "Fiery Red",
    seats: 5,
    price: 645_000,
    featured: true,
    daysAgo: 2,
    photos: ["photo-1571561944842-542037875b50", "photo-1636763086471-9f29bc34ab9e"],
    description:
      "Single-owner i20 Asta with full service history at the authorised dealer. Sunroof-free top variant with touchscreen infotainment, rear camera and alloy wheels. Tyres replaced at 38,000 km.\n\nIdeal first car or city runabout — light clutch, excellent mileage and low running costs.",
    specs: [
      ["Features", "Infotainment", "7-inch touchscreen, Android Auto & Apple CarPlay"],
      ["Features", "Safety", "Dual airbags, ABS with EBD, rear parking camera"],
      ["Service", "Last service", "At 40,000 km — authorised service centre"],
    ],
  },
  {
    brand: "Volkswagen",
    category: "Hatchbacks",
    model: "Polo",
    variant: "Highline Plus 1.0",
    year: 2018,
    regYear: 2018,
    km: 58_300,
    fuel: "PETROL",
    transmission: "MANUAL",
    owners: 2,
    condition: "VERY_GOOD",
    colour: "Blue",
    seats: 5,
    price: 525_000,
    daysAgo: 5,
    photos: ["photo-1541899481282-d53bffe3c35d", "photo-1572634302117-74d5936414ce"],
    description:
      "Solid, well-built Polo Highline Plus with German build quality and a planted highway feel. Second owner, insurance valid till next March.",
    specs: [["Features", "Comfort", "Automatic climate control, cruise control"]],
  },
  {
    brand: "Maruti Suzuki",
    category: "Hatchbacks",
    model: "Swift",
    variant: "VXi",
    year: 2020,
    regYear: 2020,
    km: 31_480,
    fuel: "PETROL",
    transmission: "AMT",
    owners: 1,
    condition: "EXCELLENT",
    colour: "Midnight Black",
    seats: 5,
    price: 590_000,
    daysAgo: 1,
    photos: ["photo-1471444928139-48c5bf5173f8", "photo-1714225317039-d685f0e1cd38"],
    description:
      "Low-mileage Swift VXi AMT — two-pedal convenience for city traffic with Maruti's dependable service network. Extended warranty transferable.",
  },
  {
    brand: "Honda",
    category: "Sedans",
    model: "City",
    variant: "VX CVT",
    year: 2019,
    regYear: 2019,
    km: 46_020,
    fuel: "PETROL",
    transmission: "CVT",
    owners: 1,
    condition: "EXCELLENT",
    colour: "Platinum White",
    seats: 5,
    price: 940_000,
    featured: true,
    daysAgo: 3,
    photos: ["photo-1611760394284-e2c6b98141cc", "photo-1570761511122-dd6342842496"],
    description:
      "The benchmark mid-size sedan. Smooth CVT automatic, spacious rear seat and a huge boot. Driven mostly on highways by a single owner; all services at Honda.",
    specs: [
      ["Features", "Comfort", "Sunroof, paddle shifters, keyless entry"],
      ["Features", "Safety", "6 airbags, ABS, ISOFIX"],
    ],
  },
  {
    brand: "Hyundai",
    category: "Sedans",
    model: "Verna",
    variant: "SX(O) 1.5 CRDi",
    year: 2021,
    regYear: 2021,
    km: 38_900,
    fuel: "DIESEL",
    transmission: "MANUAL",
    owners: 1,
    condition: "VERY_GOOD",
    colour: "Typhoon Silver",
    seats: 5,
    price: 1_120_000,
    daysAgo: 8,
    photos: ["photo-1560009320-c01920eef9f8", "photo-1583573278124-e8d4fd3edf3c"],
    description:
      "Top-spec Verna diesel with ventilated seats and the punchy 1.5 CRDi engine — over 20 km/l on the highway.",
  },
  {
    brand: "Mercedes-Benz",
    category: "Luxury Cars",
    model: "C-Class",
    variant: "C 220d Progressive",
    year: 2017,
    regYear: 2018,
    km: 68_400,
    fuel: "DIESEL",
    transmission: "AUTOMATIC",
    owners: 2,
    condition: "VERY_GOOD",
    colour: "Obsidian Black",
    seats: 5,
    price: 2_650_000,
    showPrice: false,
    featured: true,
    daysAgo: 4,
    photos: [
      "photo-1619767886558-efdc259cde1a",
      "photo-1625690180114-5530b1304127",
      "photo-1533630217389-3a5e4dff5683",
    ],
    description:
      "Elegant C 220d with the 9G-Tronic gearbox. Dealer-maintained with records, new brake pads and battery. Contact us for current pricing and a detailed inspection report.",
    specs: [
      ["Features", "Comfort", "Panoramic sunroof, ambient lighting, memory seats"],
      ["Service", "Warranty", "Star Ease service package valid till 2026"],
    ],
  },
  {
    brand: "BMW",
    category: "Luxury Cars",
    model: "3 Series",
    variant: "320d Luxury Line",
    year: 2016,
    regYear: 2016,
    km: 74_800,
    fuel: "DIESEL",
    transmission: "AUTOMATIC",
    owners: 2,
    condition: "GOOD",
    colour: "Alpine White",
    seats: 5,
    price: 2_150_000,
    availability: "RESERVED",
    daysAgo: 10,
    photos: ["photo-1555215695-3004980ad54e", "photo-1583573278124-e8d4fd3edf3c"],
    description:
      "The driver's sedan. Rear-wheel drive, 8-speed automatic and the efficient 2.0 diesel. Currently reserved — ask us about similar cars.",
  },
  {
    brand: "Mahindra",
    category: "SUVs",
    model: "XUV500",
    variant: "W10 AWD",
    year: 2018,
    regYear: 2018,
    km: 81_200,
    fuel: "DIESEL",
    transmission: "MANUAL",
    owners: 1,
    condition: "VERY_GOOD",
    colour: "Volcano Black",
    seats: 7,
    price: 1_075_000,
    featured: true,
    daysAgo: 6,
    photos: ["photo-1694649686884-0d62d0dc47d1", "photo-1768853143263-72d7e744bbc2"],
    description:
      "Seven-seat XUV500 W10 with all-wheel drive — the family road-trip machine. Fresh tyres, clutch replaced at 75,000 km.",
    specs: [["Features", "Drivetrain", "All-wheel drive"]],
  },
  {
    brand: "Jeep",
    category: "SUVs",
    model: "Compass",
    variant: "Limited 2.0 4x4",
    year: 2019,
    regYear: 2019,
    km: 52_600,
    fuel: "DIESEL",
    transmission: "MANUAL",
    owners: 1,
    condition: "EXCELLENT",
    colour: "Minimal Grey",
    seats: 5,
    price: 1_490_000,
    daysAgo: 12,
    photos: ["photo-1511527844068-006b95d162c2", "photo-1636763086471-9f29bc34ab9e"],
    description:
      "Compass Limited 4x4 — properly capable off the road, refined on it. Single owner, accident-free, full Jeep service history.",
  },
  {
    brand: "Toyota",
    category: "MUVs",
    model: "Innova Crysta",
    variant: "2.4 VX 7-Seater",
    year: 2018,
    regYear: 2018,
    km: 96_500,
    fuel: "DIESEL",
    transmission: "MANUAL",
    owners: 1,
    condition: "VERY_GOOD",
    colour: "Super White",
    seats: 7,
    price: 1_650_000,
    featured: true,
    daysAgo: 7,
    photos: ["photo-1758411898280-2dc7c95e0ba7", "photo-1547731269-e4073e054f12"],
    description:
      "The Crysta needs no introduction — bulletproof reliability and captain seats in the middle row. Well maintained at Toyota with all records.",
  },
  {
    brand: "Force Motors",
    category: "Tempo Travellers",
    model: "Traveller 3350",
    variant: "13+1 Seater AC",
    year: 2019,
    regYear: 2019,
    km: 112_400,
    fuel: "DIESEL",
    transmission: "MANUAL",
    owners: 1,
    condition: "GOOD",
    colour: "White",
    seats: 14,
    price: 1_380_000,
    showPrice: false,
    daysAgo: 9,
    photos: ["photo-1534011056808-50c1c6082fe7", "photo-1605410791216-3d9653a95667"],
    description:
      "Tourist-permit Traveller with pushback seats and roof AC — ready for tours and staff transport. Permit and fitness valid.",
    specs: [
      ["Commercial", "Permit", "All-India tourist permit"],
      ["Commercial", "Fitness certificate", "Valid till August 2026"],
      ["Features", "Seating", "13 pushback seats + driver"],
    ],
  },
  {
    brand: "Isuzu",
    category: "Pickup Trucks",
    model: "D-Max",
    variant: "Regular Cab",
    year: 2020,
    regYear: 2020,
    km: 64_700,
    fuel: "DIESEL",
    transmission: "MANUAL",
    owners: 1,
    condition: "GOOD",
    colour: "Black",
    seats: 2,
    price: 680_000,
    daysAgo: 11,
    photos: ["photo-1601252300554-4ad551483bd2", "photo-1612057473117-3e16246121e6"],
    description:
      "Hard-working D-Max regular cab with a long cargo deck. Commercial registration, all taxes paid.",
    specs: [
      ["Commercial", "Payload", "1,240 kg"],
      ["Commercial", "Deck length", "2,550 mm"],
    ],
  },
  {
    brand: "Tata Motors",
    category: "Mini Trucks",
    model: "Ace Gold",
    variant: "Diesel Plus",
    year: 2021,
    regYear: 2021,
    km: 48_900,
    fuel: "DIESEL",
    transmission: "MANUAL",
    owners: 1,
    condition: "GOOD",
    colour: "Blue",
    seats: 2,
    price: 385_000,
    daysAgo: 14,
    photos: ["photo-1657920035552-809ed648bb37"],
    description:
      "India's favourite last-mile carrier. Low running costs and easy finance available.",
    specs: [["Commercial", "Payload", "750 kg"]],
  },
  {
    brand: "Maruti Suzuki",
    category: "Sedans",
    model: "Ciaz",
    variant: "Alpha 1.5",
    year: 2017,
    regYear: 2017,
    km: 71_300,
    fuel: "PETROL",
    transmission: "MANUAL",
    owners: 2,
    condition: "GOOD",
    colour: "Black",
    seats: 5,
    price: 640_000,
    availability: "SOLD",
    daysAgo: 30,
    photos: ["photo-1675957421588-bbe528181589"],
    description: "Spacious Ciaz Alpha with smart hybrid. This car has been sold.",
  },
  {
    brand: "Kia",
    category: "SUVs",
    model: "Seltos",
    variant: "HTX 1.5",
    year: 2021,
    km: 27_000,
    fuel: "PETROL",
    transmission: "MANUAL",
    owners: 1,
    condition: "EXCELLENT",
    price: 1_250_000,
    status: "DRAFT",
    daysAgo: 0,
    photos: ["photo-1700884520248-92092bd21e63"],
    description: "Draft listing — awaiting inspection photos.",
  },
];

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed sample inventory in production.");
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  const prisma = createPrismaClient(databaseUrl);

  try {
    const [categories, brands] = await Promise.all([
      prisma.vehicleCategory.findMany({ select: { id: true, name: true } }),
      prisma.vehicleBrand.findMany({ select: { id: true, name: true } }),
    ]);
    const categoryId = new Map(categories.map((c) => [c.name, c.id]));
    const brandId = new Map(brands.map((b) => [b.name, b.id]));

    let created = 0;
    for (const sample of SAMPLE_VEHICLES) {
      const name = [sample.brand, sample.model, sample.variant].filter(Boolean).join(" ");
      const slug = slugify(`${name} ${sample.year}`);
      if (await prisma.vehicle.findUnique({ where: { slug }, select: { id: true } })) continue;

      const category = categoryId.get(sample.category);
      const brand = brandId.get(sample.brand);
      if (!category || !brand) {
        throw new Error(
          `Run "npm run db:seed" first — missing ${sample.category} / ${sample.brand}`,
        );
      }

      const createdAt = new Date(Date.now() - sample.daysAgo * 86_400_000);
      const status = sample.status ?? "PUBLISHED";
      const data: Prisma.VehicleCreateInput = {
        name,
        slug,
        description: sample.description,
        category: { connect: { id: category } },
        brand: { connect: { id: brand } },
        model: sample.model,
        variant: sample.variant,
        manufacturingYear: sample.year,
        registrationYear: sample.regYear,
        kilometresDriven: sample.km,
        fuelType: sample.fuel,
        transmission: sample.transmission,
        ownershipCount: sample.owners,
        condition: sample.condition,
        colour: sample.colour,
        seatingCapacity: sample.seats,
        price: sample.price,
        showPrice: sample.showPrice ?? true,
        availability: sample.availability ?? "AVAILABLE",
        status,
        isFeatured: sample.featured ?? false,
        publishedAt: status === "PUBLISHED" ? createdAt : null,
        soldAt: sample.availability === "SOLD" ? createdAt : null,
        createdAt,
        images: {
          create: sample.photos.map((photo, index) => ({
            url: unsplash(photo),
            publicId: `sample/${slug}/${index}`,
            width: 1800,
            height: 1200,
            bytes: 0,
            altText: `${name}${index === 0 ? "" : ` — photo ${index + 1}`}`,
            sortOrder: index,
            isPrimary: index === 0,
          })),
        },
        specifications: {
          create: (sample.specs ?? []).map(([group, label, value], index) => ({
            group,
            label,
            value,
            sortOrder: index,
          })),
        },
      };
      await prisma.vehicle.create({ data });
      created++;
    }

    // Demo contact details so the contact page and WhatsApp actions can be
    // exercised. Only applied while the settings are still blank.
    await prisma.siteSettings.updateMany({
      where: { id: 1, phone: null },
      data: {
        tagline: "Pre-owned cars and commercial vehicles you can trust",
        phone: "+91 98765 43210",
        whatsappNumber: "+91 98765 43210",
        email: "sales@jeevancars.test",
        addressLine1: "Sample address — update in Admin › Settings",
        city: "Kochi",
        state: "Kerala",
        postalCode: "682001",
        businessHours: "Mon–Sat 9:30 am – 7:00 pm\nSun 10:00 am – 2:00 pm",
        heroImageUrl: unsplash("photo-1773369236999-89d2b16546c4"),
      },
    });

    console.log(`Sample seed complete: ${created} vehicles created.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
