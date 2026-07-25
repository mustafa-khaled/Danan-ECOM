import { z } from "zod";
import type { ShippingAddress } from "../types";

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(120),
  line1: z.string().trim().min(1, "Address line 1 is required").max(200),
  line2: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(200).optional(),
  ),
  city: z.string().trim().min(1, "City is required").max(100),
  region: z.string().trim().min(1, "Region is required").max(100),
  country: z
    .string()
    .trim()
    .min(2, "Country is required")
    .max(2, "Use a 2-letter country code")
    .default("SA"),
  postalCode: z.string().trim().min(1, "Postal code is required").max(20),
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .max(20)
    .regex(/^[\d+\s()-]+$/, "Enter a valid phone number"),
});

export type ShippingAddressInput = z.input<typeof shippingAddressSchema>;

export function parseShippingAddressFromFormData(
  form: FormData,
): { success: true; data: ShippingAddress } | { success: false; errors: Record<string, string> } {
  const raw = {
    fullName: String(form.get("fullName") ?? ""),
    line1: String(form.get("line1") ?? ""),
    line2: String(form.get("line2") ?? ""),
    city: String(form.get("city") ?? ""),
    region: String(form.get("region") ?? ""),
    country: String(form.get("country") ?? "SA"),
    postalCode: String(form.get("postalCode") ?? ""),
    phone: String(form.get("phone") ?? ""),
  };

  const result = shippingAddressSchema.safeParse(raw);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !errors[field]) {
        errors[field] = issue.message;
      }
    }
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}
