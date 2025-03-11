/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['sjjbgnzyywlgpmgtmube.supabase.co'],
    // Enable more aggressive image caching
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days caching
    // Set reasonable image size limits
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Enable formats like WebP and AVIF for better compression
    formats: ['image/webp', 'image/avif'],
    // Remove image size limit for large images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Add additional experimental features for performance
  experimental: {
    optimizeCss: true,
    // Enable more aggressive optimizations
    turbotrace: {
      logLevel: 'error',
    },
    // Improve image optimization
    largePageDataBytes: 128 * 1000, // 128KB
    // New optimizations for improved navigation performance
    ppr: true, // Enable Partial Prerendering for faster initial page loads
    serverComponentsExternalPackages: [],
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Optimize static site generation
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Performance-focused settings for production
  swcMinify: true,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
}

export default nextConfig
