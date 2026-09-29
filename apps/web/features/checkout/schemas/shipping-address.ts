import { z } from "zod";
import type { ShippingAddress } from "../types";

/**
 * Validation messages are stable keys, not prose: the checkout form is rendered
 * in Arabic and English, so the copy has to come from the message catalogue
 * (`checkout.validation.*`) rather than from the schema.
 */
const ERROR_KEYS = [
  "required",
  "tooLong",
  "countryCode",
  "phoneInvalid",
  "invalid",
] as const;

export type ShippingAddressErrorKey = (typeof ERROR_KEYS)[number];

const REQUIRED: ShippingAddressErrorKey = "required";
const TOO_LONG: ShippingAddressErrorKey = "tooLong";

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(1, REQUIRED).max(120, TOO_LONG),
  line1: z.string().trim().min(1, REQUIRED).max(200, TOO_LONG),
  line2: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(200, TOO_LONG).optional(),
  ),
  city: z.string().trim().min(1, REQUIRED).max(100, TOO_LONG),
  region: z.string().trim().min(1, REQUIRED).max(100, TOO_LONG),
  country: z
    .string()
    .trim()
    .min(2, "countryCode")
    .max(2, "countryCode")
    .default("SA"),
  postalCode: z.string().trim().min(1, REQUIRED).max(20, TOO_LONG),
  phone: z
    .string()
    .trim()
    .min(1, REQUIRED)
    .max(20, TOO_LONG)
    .regex(/^[\d+\s()-]+$/, "phoneInvalid"),
});

export type ShippingAddressInput = z.input<typeof shippingAddressSchema>;

export type ShippingAddressField = keyof z.infer<typeof shippingAddressSchema>;

/** Any message zod produces on its own falls back to the generic key. */
function toErrorKey(message: string): ShippingAddressErrorKey {
  return (ERROR_KEYS as readonly string[]).includes(message)
    ? (message as ShippingAddressErrorKey)
    : "invalid";
}

/** Validates one field so the form can give feedback before submit. */
export function validateShippingAddressField(
  field: ShippingAddressField,
  value: string,
): ShippingAddressErrorKey | undefined {
  const result = shippingAddressSchema.shape[field].safeParse(value);
  if (result.success) return undefined;
  return toErrorKey(result.error.issues[0]?.message ?? "invalid");
}

export function parseShippingAddressFromFormData(
  form: FormData,
):
  | { success: true; data: ShippingAddress }
  | { success: false; errors: Partial<Record<ShippingAddressField, ShippingAddressErrorKey>> } {
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
    const errors: Partial<Record<ShippingAddressField, ShippingAddressErrorKey>> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as ShippingAddressField | undefined;
      if (field && !errors[field]) {
        errors[field] = toErrorKey(issue.message);
      }
    }
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}
