import { z } from "zod";

export const designBaseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().min(1, "Arabic name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase, numbers, and hyphens only"),
  collectionId: z.string().uuid("Invalid collection ID"),
  material: z.string().min(1, "Material is required"),
  materialAr: z.string().optional(),
  weight: z.coerce.number().positive("Weight must be positive"),
  dimensions: z.string().min(1, "Dimensions are required"),
  dimensionsAr: z.string().optional(),
  basePrice: z.coerce.number().positive("Price must be positive"),
  currency: z.enum(["SAR", "USD", "EUR"]).default("SAR"),
  isActive: z.boolean().default(true),
  visibilityGroups: z
    .string()
    .transform((val) =>
      val
        ? val.split(",").map((g) => g.trim()).filter(Boolean)
        : []
    )
    .default(""),
});

export const createDesignSchema = designBaseSchema.extend({
  story: z.string().min(1, "Story is required"),
  storyAr: z.string().min(1, "Arabic story is required"),
});

export const updateDesignSchema = designBaseSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateDesignFormValues = z.input<typeof createDesignSchema>;
export type UpdateDesignFormValues = z.input<typeof updateDesignSchema>;
export type CreateDesignData = z.output<typeof createDesignSchema>;
export type UpdateDesignData = z.output<typeof updateDesignSchema>;
