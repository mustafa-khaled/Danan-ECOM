import { z } from "zod";

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1),
    /** Statement timeout in milliseconds. Prevents runaway queries. Default: 30000 (30s). */
    DATABASE_STATEMENT_TIMEOUT_MS: z.coerce.number().int().min(1000).max(300_000).default(30_000),
    /**
     * Connections this replica opens to PgBouncer. Set explicitly instead of
     * relying on Prisma's core-count default, which scales with the host rather
     * than with the pooler's capacity. Multiply by the replica count and keep the
     * result under PgBouncer's `max_client_conn`.
     */
    DATABASE_POOL_SIZE: z.coerce.number().int().min(1).max(100).default(10),
    /** Seconds a query waits for a free pool connection before failing. */
    DATABASE_POOL_TIMEOUT_SECONDS: z.coerce.number().int().min(1).max(120).default(10),
    // M-09: Validate Redis URL uses TLS (rediss://) in production
    REDIS_URL: z.string().min(1),
    /**
     * Time-to-first-byte budget for a request. Kept under nginx's 30s
     * proxy_read_timeout so the API reports the timeout itself.
     */
    REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120_000).default(25_000),
    JWT_SECRET: z.string().min(32),
    /**
     * Signs admin tokens. Separate from JWT_SECRET so a leak of the client
     * signing key cannot be used to mint admin sessions; the `aud` claim check
     * in the guards is then no longer the only thing separating the two.
     */
    ADMIN_JWT_SECRET: z.string().min(32),
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
    /**
     * Optional override for webhook signature verification. Tap signs the
     * `hashstring` header with PAYMENT_PROVIDER_KEY itself, so leave this unset
     * unless Tap issued a separate signing key for this account.
     */
    PAYMENT_PROVIDER_SECRET: z.string().optional(),
    PAYMENT_WEBHOOK_URL: z.string().url().optional().or(z.literal("")),
    /** Where Tap returns the cardholder after 3-D Secure. Falls back to WEB_ORIGIN. */
    PAYMENT_REDIRECT_URL: z.string().url().optional().or(z.literal("")),
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
  )
  .refine((data) => data.ADMIN_JWT_SECRET !== data.JWT_SECRET, {
    message:
      "ADMIN_JWT_SECRET must differ from JWT_SECRET so a leaked client signing key cannot mint admin sessions",
    path: ["ADMIN_JWT_SECRET"],
  })
  .refine(
    (data) => {
      // M-09: Enforce TLS for Redis connections in production
      if (data.NODE_ENV === "production") {
        return data.REDIS_URL.startsWith("rediss://");
      }
      return true;
    },
    {
      message: "REDIS_URL must use rediss:// (TLS) in production",
      path: ["REDIS_URL"],
    },
  )
  .refine(
    (data) => data.NODE_ENV !== "production" || Boolean(data.WEB_ORIGIN),
    {
      message:
        "WEB_ORIGIN is required in production — it is the CORS allowlist, and without it the API would fall back to localhost",
      path: ["WEB_ORIGIN"],
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
