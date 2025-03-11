// Updated image loader with WebP conversion and optimization
interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Custom loader for Next.js Image component that works with Vercel's Image Optimization API
 * This optimized version ensures all images are converted to WebP format for better performance
 */
export const vercelImageLoader = ({ src, width, quality = 75 }: ImageLoaderParams): string => {
  // If the image is from a data URL or already optimized, return as is
  if (src.startsWith('data:') || src.includes('/_next/image')) {
    return src;
  }

  // If it's a relative URL, let Next.js handle it
  if (src.startsWith('/')) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}&fmt=webp`;
  }

  // Extract the base URL and query parameters
  const [baseUrl, queryString] = src.split('?');
  const queryParams = new URLSearchParams(queryString || '');
  
  // Force WebP format for all images
  queryParams.set('fmt', 'webp');
  queryParams.set('w', width.toString());
  queryParams.set('q', quality.toString());
  
  // Return optimized URL with WebP conversion
  return `${baseUrl}?${queryParams.toString()}`;
};

/**
 * Helper function to generate optimized image URLs with responsive sizes
 * Uses WebP format for better compression and faster loading
 */
export const getResponsiveImageUrl = (
  src: string, 
  size: 'thumbnail' | 'small' | 'medium' | 'large' = 'medium'
): string => {
  if (!src) return '';
  
  // Define width by size
  const widths = {
    thumbnail: 128,
    small: 256,
    medium: 512,
    large: 1024
  };
  
  const width = widths[size];
  
  // Optimize the URL with WebP conversion
  return vercelImageLoader({ src, width, quality: 80 });
};

/**
 * Generate an appropriately sized URL for a specific device/context
 * with WebP format for better compression
 */
export const getSizedImageUrl = (src: string, width: number, quality = 75): string => {
  if (!src) return '';
  return vercelImageLoader({ src, width, quality });
}; 