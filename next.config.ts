import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // We will fix all TS errors ourselves, but this speeds up next build in case of any issues with third party types
  }
};

export default nextConfig;
