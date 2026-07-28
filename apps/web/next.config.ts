import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { env } from "./env";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
const apiUrl = env.API_URL;

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];

try {
  const url = new URL(apiUrl);
  remotePatterns.push({
    protocol: url.protocol.replace(":", "") as "http" | "https",
    hostname: url.hostname,
    ...(url.port ? { port: url.port } : {}),
  });
} catch {
  remotePatterns.push(
    { protocol: "http", hostname: "localhost", port: "4000" },
    { protocol: "https", hostname: "**.amazonaws.com" },
  );
}

const webOrigin = env.WEB_ORIGIN;
if (webOrigin) {
  try {
    const url = new URL(webOrigin);
    remotePatterns.push({
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
    });
  } catch {
    // ignore invalid WEB_ORIGIN
  }
} else {
  // Default dev fallback — the backend defaults WEB_ORIGIN to localhost:3000
  remotePatterns.push(
    { protocol: "http", hostname: "localhost", port: "3000" },
    { protocol: "https", hostname: "localhost", port: "3000" },
  );
}

// Sentry DSNs are themselves valid URLs (https://<key>@<ingest-host>/<project>),
// so we can derive the ingest origin for connect-src without extra config.
function sentryConnectSrc(): string {
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

// Mirrors nginx/nginx.conf's Content-Security-Policy so the app is protected
// even when accessed directly (dev, non-nginx deployments). Keep both in sync.
function buildCsp(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${sentryConnectSrc()}`,
    "frame-src 'self' https://sdk.tap.company",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ].join("; ");
}

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [],
  images: {
    formats: ["image/webp", "image/avif"],
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: buildCsp() },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/backend/:path*", destination: `${apiUrl}/:path*` },
      {
        source: "/api/uploads/:path*",
        destination: `${apiUrl}/uploads/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
