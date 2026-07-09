import type { NextConfig } from "next";

const apiUrl = process.env.API_URL ?? "http://localhost:4000";

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];

try {
  const url = new URL(apiUrl);
  remotePatterns.push({
    protocol: url.protocol.replace(":", "") as "http" | "https",
    hostname: url.hostname,
    ...(url.port ? { port: url.port } : {}),
  });
} catch {
  // Fallback: allow images from common dev/prod patterns
  remotePatterns.push(
    { protocol: "http", hostname: "localhost", port: "4000" },
    { protocol: "https", hostname: "**.amazonaws.com" },
  );
}

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [],
  images: {
    formats: ["image/webp", "image/avif"],
    remotePatterns,
  },
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
