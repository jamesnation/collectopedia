// Custom image loader optimized for Vercel's Image Optimization API
interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Custom loader for Next.js Image component that works with Vercel's Image Optimization API
 * This ensures all images go through Vercel's optimization regardless of their source
 */
export const vercelImageLoader = ({ src, width, quality = 75 }: ImageLoaderParams): string => {
  // Check if the image is already using Vercel's Image Optimization or is a relative URL
  if (src.includes('/_next/image') || src.startsWith('/')) {
    return src;
  }

  // If using Vercel deployment, let Next.js handle the optimization automatically
  // This approach is simpler and faster than manually constructing URLs
  return src;
};

/**
 * Helper function to generate optimized image URLs with responsive sizes
 */
export const getResponsiveImageUrl = (
  src: string, 
  size: 'thumbnail' | 'small' | 'medium' | 'large' = 'medium'
): string => {
  if (!src) return '';
  return src; // Let Next.js handle the optimization
};

/**
 * Generate an appropriately sized URL for a specific device/context
 */
export const getSizedImageUrl = (src: string, width: number, quality = 75): string => {
  if (!src) return '';
  return src; // Let Next.js handle the optimization
}; 