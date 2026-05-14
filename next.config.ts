import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api-php/:path*',
        destination: 'http://localhost/salao/api/:path*',
      },
    ]
  },
}

export default nextConfig