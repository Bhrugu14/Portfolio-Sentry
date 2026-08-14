import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits a minimal .next/standalone build (only the files next start needs,
  // no full node_modules) so the production Docker image stays small.
  // Vercel's own build pipeline does its own output tracing and doesn't
  // produce the file 'standalone' mode expects (.next/next-server.js.nft.json),
  // so this must stay off there — `VERCEL` is set automatically by Vercel's
  // build environment. Only Docker (or any non-Vercel self-host) needs it.
  output: process.env.VERCEL ? undefined : 'standalone',
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/images/**',
      },
    ],
  },
};

export default nextConfig;
