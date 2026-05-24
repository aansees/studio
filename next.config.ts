import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    cpus: 2,
    staticGenerationMaxConcurrency: 2,
    staticGenerationMinPagesPerWorker: 100,
  },
  turbopack: {
    resolveAlias: {
      "@public": "./public",
    },
  },
  images: {
    qualities: [25, 50, 75, 100],
  },
};

export default nextConfig;
