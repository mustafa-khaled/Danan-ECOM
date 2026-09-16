import { z } from "zod";

const slugRegex = /^[a-z0-9-]+$/;

export const registerPieceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().min(1, "Arabic name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(slugRegex, "Slug must be lowercase letters, numbers, and hyphens only"),
  story: z.string().min(1, "Story is required"),
  storyAr: z.string().min(1, "Arabic story is required"),
  material: z.string().min(1, "Material is required"),
  materialAr: z.string().optional(),
  weight: z.coerce.number().positive("Weight must be greater than 0"),
  dimensions: z.string().min(1, "Dimensions are required"),
  dimensionsAr: z.string().optional(),
  price: z.coerce.number().min(0, "Price cannot be negative"),
});

export const updatePieceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().min(1, "Arabic name is required"),
  story: z.string().min(1, "Story is required"),
  storyAr: z.string().min(1, "Arabic story is required"),
  material: z.string().min(1, "Material is required"),
  materialAr: z.string().optional(),
  weight: z.coerce.number().positive("Weight must be greater than 0"),
  dimensions: z.string().min(1, "Dimensions are required"),
  dimensionsAr: z.string().optional(),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  notes: z.string().optional(),
});

export type RegisterPieceFormValues = z.input<typeof registerPieceSchema>;
export type UpdatePieceFormValues = z.input<typeof updatePieceFormSchema>;
