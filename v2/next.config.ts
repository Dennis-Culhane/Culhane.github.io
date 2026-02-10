// next.config.ts

import type { NextConfig } from 'next';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  ...(basePath && { basePath, assetPrefix: `${basePath}/` }),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'files.dennisculhane.com',
        pathname: '/images/**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  reactStrictMode: true,
  devIndicators: false,
};

export default nextConfig;
