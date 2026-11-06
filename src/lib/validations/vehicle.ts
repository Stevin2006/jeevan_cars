import { z } from "zod";
import {
  AvailabilityStatus,
  FuelType,
  PublicationStatus,
  Transmission,
  VehicleCondition,
} from "@/generated/prisma/enums";

const currentYear = new Date().getFullYear();

/** Empty inputs ("" or NaN from valueAsNumber) become undefined. */
const emptyToUndefined = (value: unknown) =>
  value === "" || value === null || (typeof value === "number" && Number.isNaN(value))
    ? undefined
    : value;

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

const requiredInt = (label: string, min: number, max: number) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: `Enter the ${label}` })
      .int(`${label[0]!.toUpperCase()}${label.slice(1)} must be a whole number`)
      .min(min, `Must be at least ${min.toLocaleString("en-IN")}`)
      .max(max, `Must be at most ${max.toLocaleString("en-IN")}`),
  );

const optionalInt = (min: number, max: number) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number()
      .int("Must be a whole number")
      .min(min, `Must be at least ${min}`)
      .max(max, `Must be at most ${max}`)
      .optional(),
  );

export const MAX_IMAGES = 30;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp", "avif"] as const;

export const vehicleImageInputSchema = z.object({
  publicId: z.string().min(1).max(255),
  url: z.url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  bytes: z.number().int().nonnegative(),
  altText: optionalText(160),
  isPrimary: z.boolean(),
});

export const vehicleSpecInputSchema = z.object({
  group: z.string().trim().min(1, "Group is required").max(40),
  label: z.string().trim().min(1, "Label is required").max(60),
  value: z.string().trim().min(1, "Value is required").max(200),
});

export const vehicleFormSchema = z
  .object({
    // Basics
    name: optionalText(120),
    slug: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z
        .string()
        .trim()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens")
        .max(90)
        .optional(),
    ),
    categoryId: z.string().min(1, "Choose a category"),
    brandId: z.string().min(1, "Choose a brand"),
    model: z.string().trim().min(1, "Enter the model").max(60),
    variant: optionalText(80),
    description: z
      .string()
      .trim()
      .min(20, "Write at least 20 characters so buyers know what they're looking at")
      .max(5000),

    // Specifications
    manufacturingYear: requiredInt("manufacturing year", 1980, currentYear + 1),
    registrationYear: optionalInt(1980, currentYear + 1),
    kilometresDriven: requiredInt("kilometres driven", 0, 2_000_000),
    fuelType: z.enum(FuelType, { error: "Choose a fuel type" }),
    transmission: z.enum(Transmission, { error: "Choose a transmission" }),
    ownershipCount: requiredInt("number of owners", 1, 10),
    condition: z.enum(VehicleCondition),
    colour: optionalText(40),
    seatingCapacity: optionalInt(1, 60),
    specifications: z.array(vehicleSpecInputSchema).max(40, "Up to 40 extra specifications"),

    // Pricing
    price: z.preprocess(
      emptyToUndefined,
      z.coerce.number().min(0, "Price can't be negative").max(1_000_000_000).optional(),
    ),
    showPrice: z.boolean(),

    // Status
    status: z.enum(PublicationStatus),
    availability: z.enum(AvailabilityStatus),
    isFeatured: z.boolean(),

    // Private
    registrationNumber: z.preprocess(
      (value) => (typeof value === "string" ? value.trim().toUpperCase() || undefined : value),
      z
        .string()
        .max(20)
        .regex(/^[A-Z0-9 -]+$/, "Letters, numbers, spaces and hyphens only")
        .optional(),
    ),
    internalNotes: optionalText(5000),

    // Photos
    images: z.array(vehicleImageInputSchema).max(MAX_IMAGES, `Up to ${MAX_IMAGES} photos`),
  })
  .superRefine((values, ctx) => {
    if (values.showPrice && !(values.price && values.price > 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message: "Enter a price, or switch to “Contact for Price”",
      });
    }
    if (values.registrationYear && values.registrationYear < values.manufacturingYear) {
      ctx.addIssue({
        code: "custom",
        path: ["registrationYear"],
        message: "Registration can't be before the manufacturing year",
      });
    }
    if (values.status === "PUBLISHED" && values.images.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["images"],
        message: "Add at least one photo before publishing, or save as a draft",
      });
    }
    if (values.images.length > 0 && values.images.filter((image) => image.isPrimary).length !== 1) {
      ctx.addIssue({ code: "custom", path: ["images"], message: "Choose one cover photo" });
    }
    const labels = new Set<string>();
    values.specifications.forEach((spec, index) => {
      const key = spec.label.toLowerCase();
      if (labels.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["specifications", index, "label"],
          message: "This label is already used",
        });
      }
      labels.add(key);
    });
  });

export type VehicleFormInput = z.input<typeof vehicleFormSchema>;
export type VehicleFormValues = z.output<typeof vehicleFormSchema>;
export type VehicleImageInput = z.output<typeof vehicleImageInputSchema>;

/** Quick status changes from the vehicles table. */
export const vehicleQuickUpdateSchema = z.object({
  id: z.string().min(1),
  availability: z.enum(AvailabilityStatus).optional(),
  status: z.enum(PublicationStatus).optional(),
  isFeatured: z.boolean().optional(),
});
