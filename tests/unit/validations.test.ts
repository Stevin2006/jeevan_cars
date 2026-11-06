import { describe, expect, it } from "vitest";
import { changePasswordSchema, loginSchema } from "@/lib/validations/auth";
import {
  enquiryFormSchema,
  enquirySubmissionSchema,
  enquiryUpdateSchema,
  normalizeIndianMobile,
} from "@/lib/validations/enquiry";
import { siteSettingsSchema } from "@/lib/validations/settings";
import { taxonomySchema } from "@/lib/validations/taxonomy";
import { vehicleFormSchema, type VehicleFormInput } from "@/lib/validations/vehicle";

function issuePaths(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.success ? [] : result.error!.issues.map((issue) => issue.path.join("."));
}

describe("normalizeIndianMobile", () => {
  it.each([
    ["98765 43210", "+919876543210"],
    ["+91-98765-43210", "+919876543210"],
    ["098765 43210", "+919876543210"],
    ["919876543210", "+919876543210"],
  ])("normalises %s", (input, expected) => {
    expect(normalizeIndianMobile(input)).toBe(expected);
  });

  it.each(["12345", "5876543210", "+1 415 555 0100", "98765432101"])("rejects %s", (input) => {
    expect(normalizeIndianMobile(input)).toBeNull();
  });
});

describe("enquiry schemas", () => {
  const valid = {
    name: "Asha",
    phone: "9876543210",
    email: "",
    message: "Is this still available?",
  };

  it("accepts a minimal enquiry with optional email blank", () => {
    expect(enquiryFormSchema.safeParse(valid).success).toBe(true);
  });

  it("flags short messages, bad phones and bad emails", () => {
    const result = enquiryFormSchema.safeParse({
      ...valid,
      phone: "123",
      email: "nope",
      message: "hi",
    });
    expect(issuePaths(result).sort()).toEqual(["email", "message", "phone"]);
  });

  it("requires source and elapsed time on submission", () => {
    expect(enquirySubmissionSchema.safeParse(valid).success).toBe(false);
    expect(
      enquirySubmissionSchema.safeParse({ ...valid, source: "CONTACT_PAGE", elapsedMs: 5000 })
        .success,
    ).toBe(true);
  });

  it("rejects malformed vehicle ids", () => {
    const result = enquirySubmissionSchema.safeParse({
      ...valid,
      source: "VEHICLE_PAGE",
      elapsedMs: 5000,
      vehicleId: "../../etc",
    });
    expect(issuePaths(result)).toEqual(["vehicleId"]);
  });

  it("parses admin updates with empty notes and dates as null", () => {
    expect(
      enquiryUpdateSchema.parse({ id: "x", status: "CONTACTED", adminNotes: "  ", followUpAt: "" }),
    ).toEqual({ id: "x", status: "CONTACTED", adminNotes: null, followUpAt: null });
    expect(
      issuePaths(
        enquiryUpdateSchema.safeParse({
          id: "x",
          status: "CONTACTED",
          adminNotes: null,
          followUpAt: "14/11/2026",
        }),
      ),
    ).toEqual(["followUpAt"]);
  });
});

describe("vehicleFormSchema", () => {
  const base: VehicleFormInput = {
    name: "",
    slug: "",
    categoryId: "cat",
    brandId: "brand",
    model: "Creta",
    variant: "",
    description: "A well looked-after SUV with full service history.",
    manufacturingYear: "2020",
    registrationYear: "",
    kilometresDriven: "54200",
    fuelType: "DIESEL",
    transmission: "MANUAL",
    ownershipCount: "1",
    condition: "GOOD",
    colour: "",
    seatingCapacity: "",
    specifications: [],
    price: "1325000",
    showPrice: true,
    status: "DRAFT",
    availability: "AVAILABLE",
    isFeatured: false,
    registrationNumber: "",
    internalNotes: "",
    images: [],
  };

  const image = (isPrimary: boolean, id = "a") => ({
    publicId: `jeevan-cars/vehicles/${id}`,
    url: `https://res.cloudinary.com/x/image/upload/${id}.jpg`,
    width: 1600,
    height: 1067,
    bytes: 100,
    isPrimary,
  });

  it("coerces form strings and blanks", () => {
    const result = vehicleFormSchema.parse(base);
    expect(result).toMatchObject({
      manufacturingYear: 2020,
      kilometresDriven: 54_200,
      price: 1_325_000,
      registrationYear: undefined,
      variant: undefined,
      name: undefined,
      slug: undefined,
    });
  });

  it("requires a price when it is shown publicly", () => {
    expect(issuePaths(vehicleFormSchema.safeParse({ ...base, price: "" }))).toEqual(["price"]);
    expect(vehicleFormSchema.safeParse({ ...base, price: "", showPrice: false }).success).toBe(
      true,
    );
  });

  it("rejects a registration year before manufacture", () => {
    expect(issuePaths(vehicleFormSchema.safeParse({ ...base, registrationYear: "2019" }))).toEqual([
      "registrationYear",
    ]);
  });

  it("requires a photo to publish and exactly one cover", () => {
    expect(issuePaths(vehicleFormSchema.safeParse({ ...base, status: "PUBLISHED" }))).toEqual([
      "images",
    ]);
    expect(
      vehicleFormSchema.safeParse({ ...base, status: "PUBLISHED", images: [image(true)] }).success,
    ).toBe(true);
    expect(issuePaths(vehicleFormSchema.safeParse({ ...base, images: [image(false)] }))).toEqual([
      "images",
    ]);
    expect(
      issuePaths(
        vehicleFormSchema.safeParse({ ...base, images: [image(true, "a"), image(true, "b")] }),
      ),
    ).toEqual(["images"]);
  });

  it("rejects duplicate extra-detail labels case-insensitively", () => {
    const result = vehicleFormSchema.safeParse({
      ...base,
      specifications: [
        { group: "Commercial", label: "Payload", value: "750 kg" },
        { group: "Commercial", label: "payload", value: "800 kg" },
      ],
    });
    expect(issuePaths(result)).toEqual(["specifications.1.label"]);
  });

  it("uppercases registration numbers and validates slugs", () => {
    expect(
      vehicleFormSchema.parse({ ...base, registrationNumber: "kl 07 ab 1234" }).registrationNumber,
    ).toBe("KL 07 AB 1234");
    expect(issuePaths(vehicleFormSchema.safeParse({ ...base, slug: "Bad Slug!" }))).toEqual([
      "slug",
    ]);
  });

  it("rejects out-of-range numbers", () => {
    const result = vehicleFormSchema.safeParse({
      ...base,
      manufacturingYear: "1950",
      kilometresDriven: "-1",
      ownershipCount: "0",
    });
    expect(issuePaths(result).sort()).toEqual([
      "kilometresDriven",
      "manufacturingYear",
      "ownershipCount",
    ]);
  });
});

describe("taxonomy, settings and auth schemas", () => {
  it("validates taxonomy slugs and optional fields", () => {
    expect(
      taxonomySchema.parse({
        name: "SUVs",
        slug: "",
        description: "",
        sortOrder: "2",
        isActive: true,
      }),
    ).toEqual({
      name: "SUVs",
      slug: undefined,
      description: undefined,
      sortOrder: 2,
      isActive: true,
    });
    expect(
      taxonomySchema.safeParse({ name: "SUVs", slug: "SUV s", sortOrder: 0, isActive: true })
        .success,
    ).toBe(false);
  });

  it("validates site settings fields", () => {
    const base = { businessName: "Jeevan Cars", hero: null };
    expect(siteSettingsSchema.safeParse({ ...base, postalCode: "6820" }).success).toBe(false);
    expect(
      siteSettingsSchema.safeParse({ ...base, mapEmbedUrl: "https://evil.example/maps" }).success,
    ).toBe(false);
    expect(
      siteSettingsSchema.safeParse({ ...base, facebookUrl: "http://facebook.com/x" }).success,
    ).toBe(false);
    expect(siteSettingsSchema.safeParse({ ...base, whatsappNumber: "12345" }).success).toBe(false);
    expect(
      siteSettingsSchema.parse({
        ...base,
        postalCode: "682001",
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=abc",
        tagline: "  ",
      }),
    ).toMatchObject({ postalCode: "682001", tagline: null });
  });

  it("normalises login email and checks password rules", () => {
    expect(loginSchema.parse({ email: " Admin@Example.TEST ", password: "x" }).email).toBe(
      "admin@example.test",
    );
    const mismatch = changePasswordSchema.safeParse({
      currentPassword: "old-password-123",
      newPassword: "new-password-1234",
      confirmPassword: "different-123456",
    });
    expect(issuePaths(mismatch)).toEqual(["confirmPassword"]);
    const tooShort = changePasswordSchema.safeParse({
      currentPassword: "a",
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(issuePaths(tooShort)).toEqual(["newPassword"]);
  });
});
