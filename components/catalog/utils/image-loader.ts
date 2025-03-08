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
  // Check if the image is already using Vercel's Image Optimization
  if (src.includes('/_next/image')) {
    return src;
  }

  // For images from Supabase or any external source
  const url = new URL(`/_next/image`, window.location.origin);
  
  // Set query parameters for the image optimization
  url.searchParams.set('url', encodeURIComponent(src));
  url.searchParams.set('w', width.toString());
  url.searchParams.set('q', quality.toString());
  
  return url.toString();
};

/**
 * Helper function to generate optimized image URLs with responsive sizes
 */
export const getResponsiveImageUrl = (
  src: string, 
  size: 'thumbnail' | 'small' | 'medium' | 'large' = 'medium'
): string => {
  if (!src) return '';
  
  const widths = {
    thumbnail: 100,
    small: 400,
    medium: 800,
    large: 1200
  };
  
  const width = widths[size];
  return vercelImageLoader({ src, width });
};

/**
 * Generate an appropriately sized URL for a specific device/context
 */
export const getSizedImageUrl = (src: string, width: number, quality = 75): string => {
  if (!src) return '';
  return vercelImageLoader({ src, width, quality });
}; 