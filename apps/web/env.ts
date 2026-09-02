import { z } from "zod";

const serverSchema = z.object({
  API_URL: z.string().url().default("http://localhost:4000"),
  WEB_ORIGIN: z.string().url().optional(),
});

const clientSchema = z
  .object({
    NEXT_PUBLIC_API_URL: z.string().min(1).default("/backend"),
    NEXT_PUBLIC_PAYMENT_MODE: z.enum(["mock", "live"]).default("mock"),
    NEXT_PUBLIC_VAT_RATE: z
      .string()
      .regex(/^\d+(\.\d+)?$/)
      .default("0.15"),
    // Tap's public key (pk_test_*/pk_live_*) — safe to expose to the browser,
    // used by the Web Card SDK to tokenize card details. Required when
    // NEXT_PUBLIC_PAYMENT_MODE=live; unused in mock mode.
    NEXT_PUBLIC_TAP_PUBLIC_KEY: z.string().optional().default(""),
    // Tap merchant ID for the Card SDK's `merchant.id` field. Optional per
    // Tap's SDK reference — omitted entirely when blank.
    NEXT_PUBLIC_TAP_MERCHANT_ID: z.string().optional().default(""),
  })
  .superRefine((value, ctx) => {
    // Without this the card iframe renders empty and tokenization fails with no
    // visible error, which is very hard to diagnose from the browser alone.
    if (value.NEXT_PUBLIC_PAYMENT_MODE === "live" && !value.NEXT_PUBLIC_TAP_PUBLIC_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NEXT_PUBLIC_TAP_PUBLIC_KEY"],
        message:
          "NEXT_PUBLIC_TAP_PUBLIC_KEY is required when NEXT_PUBLIC_PAYMENT_MODE=live",
      });
    }
  });

function parseEnv<T extends z.ZodTypeAny>(
  schema: T,
  values: Record<string, string | undefined>,
): z.infer<T> {
  const result = schema.safeParse(values);
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  return result.data;
}

const serverEnv = parseEnv(serverSchema, {
  API_URL: process.env.API_URL,
  WEB_ORIGIN: process.env.WEB_ORIGIN,
});

const clientEnv = parseEnv(clientSchema, {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_PAYMENT_MODE: process.env.NEXT_PUBLIC_PAYMENT_MODE,
  NEXT_PUBLIC_VAT_RATE: process.env.NEXT_PUBLIC_VAT_RATE,
  NEXT_PUBLIC_TAP_PUBLIC_KEY: process.env.NEXT_PUBLIC_TAP_PUBLIC_KEY,
  NEXT_PUBLIC_TAP_MERCHANT_ID: process.env.NEXT_PUBLIC_TAP_MERCHANT_ID,
});

export const env = {
  ...serverEnv,
  ...clientEnv,
  VAT_RATE: Number(clientEnv.NEXT_PUBLIC_VAT_RATE),
} as const;
