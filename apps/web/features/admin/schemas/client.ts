import { z } from "zod";

export const createClientSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  locale: z.enum(["ar", "en"]).default("en"),
  classId: z.string().optional(),
});

export const updateClientSchema = z.object({
  displayName: z.string().min(1, "Display name is required").optional(),
  email: z.string().email("Valid email is required").optional(),
  phone: z.string().optional(),
  locale: z.enum(["ar", "en"]).optional(),
  isActive: z.boolean().optional(),
  classId: z.string().optional(),
});

export type CreateClientFormValues = z.input<typeof createClientSchema>;
export type UpdateClientFormValues = z.input<typeof updateClientSchema>;
