import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { env } from "./env";
import { buildCsp, sentryConnectSrc } from "./shared/lib/csp";

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

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [],
  images: {
    unoptimized: true,
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
          { key: "Content-Security-Policy", value: buildCsp(undefined, sentryConnectSrc()) },
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
