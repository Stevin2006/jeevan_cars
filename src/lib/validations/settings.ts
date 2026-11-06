import { z } from "zod";
import { normalizeIndianMobile } from "@/lib/validations/enquiry";

const optional = (schema: z.ZodType<string>) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    schema.nullable(),
  );

const text = (max: number) => optional(z.string().trim().max(max));
const httpsUrl = (message = "Enter a full https:// link") =>
  optional(z.url({ protocol: /^https$/, error: message }).max(500));

export const siteSettingsSchema = z.object({
  businessName: z.string().trim().min(2, "Enter the business name").max(80),
  tagline: text(160),
  phone: optional(
    z
      .string()
      .trim()
      .max(30)
      .regex(/^\+?[\d\s()-]{8,}$/, "Enter a valid phone number"),
  ),
  whatsappNumber: optional(
    z
      .string()
      .trim()
      .refine(
        (value) => normalizeIndianMobile(value) !== null,
        "Enter a 10-digit Indian mobile number",
      ),
  ),
  email: optional(z.email("Enter a valid email address").max(120)),
  addressLine1: text(120),
  addressLine2: text(120),
  city: text(60),
  state: text(60),
  postalCode: optional(
    z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Enter a 6-digit PIN code"),
  ),
  businessHours: text(300),
  mapEmbedUrl: optional(
    z
      .string()
      .trim()
      .max(2000)
      .refine(
        (value) => value.startsWith("https://www.google.com/maps/embed"),
        "Paste the src link from Google Maps → Share → Embed a map",
      ),
  ),
  facebookUrl: httpsUrl(),
  instagramUrl: httpsUrl(),
  youtubeUrl: httpsUrl(),
  seoTitle: text(70),
  seoDescription: text(170),
  hero: z
    .object({
      publicId: z.string().min(1).max(255),
      url: z.url(),
    })
    .nullable(),
});

export type SiteSettingsInput = z.input<typeof siteSettingsSchema>;
export type SiteSettingsValues = z.output<typeof siteSettingsSchema>;
