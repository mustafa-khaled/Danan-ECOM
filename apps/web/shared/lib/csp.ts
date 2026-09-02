/**
 * Browser CSP. Next.js middleware attaches a per-request nonce so inline
 * scripts we emit are allowed without `unsafe-eval`. `unsafe-inline` stays
 * on style-src because Next.js still injects style tags.
 *
 * Keep the static fallback in nginx/nginx.conf in sync, minus the nonce
 * (nginx cannot mint one per request). The browser enforces both headers,
 * so the nonce policy is what actually blocks injected scripts.
 */
export function buildCsp(nonce?: string, extraConnectSrc = ""): string {
  // Next.js dev mode relies on webpack's eval-based runtime for hydration, so
  // it requires 'unsafe-eval'. Keep it out of production builds. See:
  // https://nextjs.org/docs/app/guides/content-security-policy
  const evalPolicy = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
  const scriptSrc = nonce
    ? `script-src 'self' 'nonce-${nonce}' https://tap-sdks.b-cdn.net${evalPolicy}`
    : `script-src 'self' 'unsafe-inline' https://tap-sdks.b-cdn.net${evalPolicy}`;

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.tap.company",
    "font-src 'self'",
    `connect-src 'self' https://api.tap.company https://*.tap.company https://*.ingest.sentry.io https://*.sentry.io${extraConnectSrc}`,
    "frame-src 'self' https://*.tap.company",
    "frame-ancestors 'none'",
    "form-action 'self' https://*.tap.company",
    "base-uri 'self'",
  ].join("; ");
}

export function createCspNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

export function sentryConnectSrc(): string {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return "";
  }
  try {
    return ` ${new URL(dsn).origin}`;
  } catch {
    return "";
  }
}
