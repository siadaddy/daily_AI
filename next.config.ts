import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'siadaddy.github.io',
        pathname: '/youngs/**',
      },
    ],
  },
}

export default nextConfig
