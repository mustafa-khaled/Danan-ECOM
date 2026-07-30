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
    ACCESS_TOKEN_MINUTES: z.coerce.number().int().min(1).max(60).default(15),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1000).default(5),
    AUTH_RATE_LIMIT_WINDOW_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .max(86_400)
      .default(15 * 60),
    ADMIN_REFRESH_HOURS: z.coerce.number().int().min(1).max(720).default(24),
    CERT_SIGNING_SECRET: z.string().min(16),
    COOKIE_SECURE: z.enum(["true", "false"]).optional(),
    STORAGE_PROVIDER: z.enum(["local", "s3", "r2", "hetzner"]).default("local"),
    STORAGE_LOCAL_PATH: z.string().default("/app/uploads"),
    S3_ENDPOINT: z.string().url().optional(),
    S3_BUCKET: z.string().optional(),
    S3_ACCESS_KEY: z.string().optional(),
    S3_SECRET_KEY: z.string().optional(),
    S3_REGION: z.string().optional(),
    WEB_ORIGIN: z.string().url().optional(),
    BASE_URL: z.string().url(),
    PDF_WATERMARK_TEXT: z.string().optional(),
    PAYMENT_PROVIDER_KEY: z.string().optional(),
    PAYMENT_PROVIDER_SECRET: z.string().optional(),
    PAYMENT_WEBHOOK_URL: z.string().url().optional().or(z.literal("")),
    ALLOW_MOCK_PAYMENTS: z.enum(["true", "false"]).optional(),
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
      if (data.NODE_ENV === "production" && data.PAYMENT_PROVIDER_KEY) {
        return (
          data.PAYMENT_PROVIDER_KEY.startsWith("sk_live_") ||
          data.PAYMENT_PROVIDER_KEY.startsWith("sk_test_")
        );
      }
      return true;
    },
    {
      message:
        "PAYMENT_PROVIDER_KEY must be a valid Tap secret key (sk_live_* or sk_test_*) in production",
      path: ["PAYMENT_PROVIDER_KEY"],
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
