import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits a minimal .next/standalone build (only the files next start needs,
  // no full node_modules) so the production Docker image stays small.
  output: 'standalone',
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
