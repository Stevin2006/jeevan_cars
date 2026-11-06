import "@/lib/validations/zod-config";
import { z } from "zod";

export const taxonomySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Enter a name").max(60),
  slug: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens")
      .max(60)
      .optional(),
  ),
  description: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(200).optional(),
  ),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
});

export type TaxonomyInput = z.input<typeof taxonomySchema>;
export type TaxonomyValues = z.output<typeof taxonomySchema>;
export type TaxonomyKind = "category" | "brand";
