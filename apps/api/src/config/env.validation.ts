import { z } from "zod";

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    HOUSE_KEY_SALT: z.coerce.number().int().min(4).max(20).default(12),
    CLIENT_SESSION_DAYS: z.coerce.number().int().min(1).max(90).default(7),
    CERT_SIGNING_SECRET: z.string().min(16),
    COOKIE_SECURE: z.enum(["true", "false"]).optional(),
    S3_ENDPOINT: z.string().url(),
    S3_BUCKET: z.string().min(1),
    S3_ACCESS_KEY: z.string().min(1),
    S3_SECRET_KEY: z.string().min(1),
    S3_REGION: z.string().default("auto"),
    WEB_ORIGIN: z.string().url().optional(),
    BASE_URL: z.string().url(),
    PDF_WATERMARK_TEXT: z.string().optional(),
    PAYMENT_PROVIDER_KEY: z.string().optional(),
    PAYMENT_PROVIDER_SECRET: z.string().optional(),
    VAT_RATE: z.coerce.number().min(0).max(1).default(0.15),
    ADMIN_EMAIL: z.string().email().optional().or(z.literal("")),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.preprocess(
      (v) => (v === "" || v === undefined ? undefined : v),
      z.coerce.number().int().positive().optional(),
    ),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.NODE_ENV === "production") {
        return (
          data.PAYMENT_PROVIDER_KEY?.startsWith("sk_live_") ||
          data.PAYMENT_PROVIDER_KEY?.startsWith("sk_test_")
        );
      }
      return true;
    },
    {
      message:
        "PAYMENT_PROVIDER_KEY must be a valid Stripe key (sk_live_* or sk_test_*) in production",
      path: ["PAYMENT_PROVIDER_KEY"],
    },
  )
  .refine(
    (data) => {
      if (data.NODE_ENV === "production" && data.PAYMENT_PROVIDER_KEY) {
        return !!data.PAYMENT_PROVIDER_SECRET;
      }
      return true;
    },
    {
      message: "PAYMENT_PROVIDER_SECRET is required when PAYMENT_PROVIDER_KEY is set in production",
      path: ["PAYMENT_PROVIDER_SECRET"],
    },
  );

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Environment validation failed: ${details}`);
  }
  return result.data;
}
