/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'net' module on the client to prevent errors
      config.resolve.fallback = {
        net: false,
        tls: false,
        dns: false,
      }
    }
    return config
  },
}

module.exports = nextConfig