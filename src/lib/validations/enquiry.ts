import { z } from "zod";

/** Accepts "98765 43210", "+91-98765-43210", "098765 43210" → "+919876543210". */
export function normalizeIndianMobile(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const local =
    digits.length === 12 && digits.startsWith("91")
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith("0")
        ? digits.slice(1)
        : digits;
  return /^[6-9]\d{9}$/.test(local) ? `+91${local}` : null;
}

/** Fields the customer fills in — shared by the form (client) and the action (server). */
export const enquiryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name")
    .max(80, "Please keep your name under 80 characters"),
  phone: z
    .string()
    .trim()
    .min(1, "Please enter your phone number")
    .refine((value) => normalizeIndianMobile(value) !== null, {
      message: "Enter a 10-digit Indian mobile number",
    }),
  email: z.union([z.literal(""), z.email("Enter a valid email address").max(120)]).optional(),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more — at least 10 characters")
    .max(2000, "Please keep your message under 2,000 characters"),
});

export type EnquiryFormValues = z.infer<typeof enquiryFormSchema>;

/** What the server action accepts: the form plus context and anti-spam fields. */
export const enquirySubmissionSchema = enquiryFormSchema.extend({
  vehicleId: z
    .string()
    .regex(/^[a-z0-9]{20,32}$/)
    .optional(),
  source: z.enum(["VEHICLE_PAGE", "CONTACT_PAGE"]),
  /** Honeypot: hidden from people, filled in by naive bots. */
  website: z.string().max(200).optional(),
  /** Milliseconds the form was open before submitting. */
  elapsedMs: z.number().int().nonnegative(),
});

export type EnquirySubmission = z.infer<typeof enquirySubmissionSchema>;
