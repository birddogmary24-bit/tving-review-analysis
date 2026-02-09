import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: [
    '@google-cloud/storage',
    'google-play-scraper',
    'app-store-scraper',
  ],
};

export default nextConfig;
