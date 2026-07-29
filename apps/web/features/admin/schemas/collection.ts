import { z } from "zod";

export const collectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().min(1, "Arabic name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase, numbers, and hyphens only"),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  isVisible: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
  visibilityGroups: z
    .string()
    .transform((val) =>
      val
        ? val.split(",").map((g) => g.trim()).filter(Boolean)
        : []
    )
    .default(""),
});

export const createCollectionSchema = collectionSchema;
export const updateCollectionSchema = collectionSchema.partial();

export type CollectionFormValues = z.input<typeof collectionSchema>;
export type CreateCollectionData = z.output<typeof createCollectionSchema>;
export type UpdateCollectionData = z.output<typeof updateCollectionSchema>;
