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
    // Disable the remote pattern check for faster loading
    dangerouslyAllowSVG: true,
    // Remove image size limit for large images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Add additional experimental features if needed
  experimental: {
    optimizeCss: true,
    // Enable more aggressive optimizations
    turbotrace: {
      logLevel: 'error',
    },
    // Improve image optimization
    largePageDataBytes: 128 * 1000, // 128KB
  },
}

export default nextConfig
