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

    // Add WebAssembly support explicitly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }

    return config
  },
  // Increase memory limit for the build process
  experimental: {
    // This may help with memory-related issues during build
    turbotrace: {
      memoryLimit: 4096, // Increase memory limit (in MB)
    }
  }
}

module.exports = nextConfig