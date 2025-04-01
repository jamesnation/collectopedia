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
  
  // Security headers configuration
  async headers() {
    return [
      {
        // Apply these security headers to all routes
        source: '/:path*',
        headers: [
          // Enforce HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload' // 2 years
          },
          // Prevent MIME-sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Prevent Clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY' // Disallow framing completely
          },
          // Control Referrer information
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' https://*.clerk.com https://*.stripe.com https://*.vercel-insights.com 'unsafe-inline';
              style-src 'self' https://*.clerk.com 'unsafe-inline';
              img-src 'self' data: https://*.supabase.co https://*.clerk.com https://*.stripe.com https://i.ebayimg.com;
              font-src 'self' https://*.clerk.com;
              connect-src 'self' https://*.supabase.co https://*.clerk.com https://*.stripe.com https://api.ebay.com wss:;
              frame-src 'self' https://*.clerk.com https://*.stripe.com;
              media-src 'self';
              object-src 'none';
              base-uri 'self';
              form-action 'self' https://*.clerk.com;
              frame-ancestors 'none';
            `.replace(/\s{2,}/g, ' ').trim()
          },
          // Permissions Policy (Optional - disable features not needed)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          }
        ]
      }
    ];
  }
}

export default nextConfig
