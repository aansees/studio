import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
