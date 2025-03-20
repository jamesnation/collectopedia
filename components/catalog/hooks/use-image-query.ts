/**
 * Image Query Hook
 * 
 * React Query hook for integrating with the image service.
 * This hook bridges the image service's caching system with React Query's caching.
 * Enhanced with Supabase URL support and better error handling.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useImageService } from '@/services/image-service';
import { getImagesByItemIdAction } from '@/actions/images-actions';
import { SelectImage } from '@/db/schema/images-schema';

// Type for image loading result
interface ImageQueryResult {
  url: string | null;
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  size: string;
}

/**
 * Check if URL is from Supabase storage
 */
function isSupabaseStorageUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.includes('supabase.co/storage');
}

/**
 * Hook for fetching images by item ID using React Query
 */
export function useItemImagesQuery(itemId: string | null | undefined) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['images', itemId],
    queryFn: async () => {
      if (!itemId) return { isSuccess: true, data: [] };
      
      console.log(`[use-image-query] Fetching images for item ${itemId}`);
      const result = await getImagesByItemIdAction(itemId);
      
      if (!result.isSuccess) {
        throw new Error(result.error || 'Failed to fetch images');
      }
      
      return result;
    },
    enabled: !!itemId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Initialize cache with an empty array if no data exists
    initialData: () => {
      const existingData = queryClient.getQueryData(['images', itemId]);
      if (existingData) return existingData;
      return { isSuccess: true, data: [] };
    }
  });
}

/**
 * Extend the image service with an async wrapper for loadImage
 */
function extendImageService(imageService: ReturnType<typeof useImageService>) {
  return {
    ...imageService,
    // Add async wrapper for loadImage to use with React Query
    loadImageAsync: async (
      url: string, 
      size: 'thumbnail' | 'small' | 'medium' | 'large' = 'medium',
      priority: number = 40
    ) => {
      // Skip optimization for Supabase URLs
      if (isSupabaseStorageUrl(url)) {
        console.log('[use-image-query] Using original Supabase URL:', url);
        return {
          url,
          isLoading: false,
          isLoaded: true,
          hasError: false
        };
      }
      
      // Use the existing loadImage method for other URLs
      return imageService.loadImage(url, size, priority);
    }
  };
}

/**
 * Hook that connects React Query with image service for optimized image loading
 */
export function useOptimizedImage(
  url: string | null | undefined, 
  size: 'thumbnail' | 'small' | 'medium' | 'large' = 'medium',
  priority: number = 40
): ImageQueryResult {
  const baseImageService = useImageService();
  const imageService = extendImageService(baseImageService);
  
  const result = useQuery({
    queryKey: ['optimizedImage', url, size],
    queryFn: async () => {
      if (!url) return {
        url: null,
        isLoaded: false,
        hasError: false,
        size
      };
      
      try {
        // Use the image service to load and optimize the image
        const result = await imageService.loadImageAsync(url, size, priority);
        return {
          ...result,
          size
        };
      } catch (error) {
        console.error('[use-image-query] Error loading image:', error);
        
        // For Supabase URLs, return original URL on error
        if (isSupabaseStorageUrl(url)) {
          return {
            url,
            isLoading: false,
            isLoaded: false,
            hasError: true,
            size
          };
        }
        
        throw error;
      }
    },
    // Only run this query if we have a URL
    enabled: !!url,
    // Use stale-while-revalidate pattern for images
    staleTime: 60 * 60 * 1000, // 1 hour
    // Cache images for longer
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    // Optimized images don't change often, so reduce refetch frequency
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });
  
  // Provide a default value that matches the ImageQueryResult interface
  if (!result.data) {
    return {
      url: url || null,
      isLoading: result.isLoading,
      isLoaded: false,
      hasError: result.isError,
      size: size
    };
  }
  
  return result.data as ImageQueryResult;
}

/**
 * Hook for preloading multiple images for a catalog view
 */
export function useImagePreloader() {
  const baseImageService = useImageService();
  const imageService = extendImageService(baseImageService);
  const queryClient = useQueryClient();
  
  /**
   * Preload multiple item images
   */
  const preloadItemImages = (
    itemIds: string[], 
    imagesMap: Record<string, SelectImage[]>,
    size: 'thumbnail' | 'small' | 'medium' = 'small'
  ) => {
    // The TypeScript error suggests the SSR stub implementation doesn't accept parameters
    // Let's handle this carefully based on the environment
    if (typeof window !== 'undefined') {
      try {
        // In browser environment, we can call the real implementation
        // We need to cast it to any to bypass the TypeScript error
        (imageService as any).preloadItemImages(itemIds, imagesMap);
      } catch (e) {
        console.warn('[use-image-query] Error calling preloadItemImages:', e);
      }
    } else {
      console.log('[use-image-query] Skipping preloadItemImages in SSR environment');
    }
    
    // Also prefetch the React Query cache entries
    itemIds.forEach(itemId => {
      // For each item, prefetch its images query
      queryClient.prefetchQuery({
        queryKey: ['images', itemId],
        queryFn: async () => {
          const result = await getImagesByItemIdAction(itemId);
          return result;
        },
        staleTime: 5 * 60 * 1000 // 5 minutes
      });
      
      // And prefetch the actual image URLs if we have them
      if (imagesMap[itemId] && imagesMap[itemId].length > 0) {
        const primaryImage = imagesMap[itemId][0];
        
        // Skip Supabase URL optimization
        if (isSupabaseStorageUrl(primaryImage.url)) {
          // Just prefetch the unmodified URL
          queryClient.prefetchQuery({
            queryKey: ['optimizedImage', primaryImage.url, size],
            queryFn: async () => {
              return {
                url: primaryImage.url,
                isLoading: false,
                isLoaded: true,
                hasError: false,
                size
              };
            }
          });
        } else {
          // Prefetch the optimized version of the primary image
          queryClient.prefetchQuery({
            queryKey: ['optimizedImage', primaryImage.url, size],
            queryFn: async () => {
              const result = await imageService.loadImageAsync(primaryImage.url, size, 40);
              return {
                ...result,
                size
              };
            },
            staleTime: 60 * 60 * 1000 // 1 hour
          });
        }
      }
    });
  };
  
  /**
   * Prioritize visible images to load them first
   */
  const prioritizeVisibleImages = (visibleUrls: string[], size: 'thumbnail' | 'small' | 'medium' = 'small') => {
    // Separate Supabase URLs from others
    const supabaseUrls = visibleUrls.filter(isSupabaseStorageUrl);
    const otherUrls = visibleUrls.filter(url => !isSupabaseStorageUrl(url));
    
    // The TypeScript error suggests the SSR stub implementation doesn't accept parameters
    // Let's handle this carefully based on the environment
    if (typeof window !== 'undefined' && otherUrls.length > 0) {
      try {
        // In browser environment, we can call the real implementation
        // We need to cast it to any to bypass the TypeScript error
        (imageService as any).prioritizeVisibleImages(otherUrls);
      } catch (e) {
        console.warn('[use-image-query] Error calling prioritizeVisibleImages:', e);
      }
    } else if (otherUrls.length === 0) {
      console.log('[use-image-query] No non-Supabase URLs to prioritize');
    } else {
      console.log('[use-image-query] Skipping prioritizeVisibleImages in SSR environment');
    }
    
    // Also update the priority in React Query for all images
    visibleUrls.forEach(url => {
      // For Supabase URLs, just fetch without optimization
      if (isSupabaseStorageUrl(url)) {
        queryClient.fetchQuery({
          queryKey: ['optimizedImage', url, size],
          queryFn: async () => {
            return {
              url,
              isLoading: false,
              isLoaded: true,
              hasError: false,
              size
            };
          }
        });
      } else {
        // Mark these queries as active to raise their priority
        queryClient.fetchQuery({
          queryKey: ['optimizedImage', url, size],
          queryFn: async () => {
            const result = await imageService.loadImageAsync(url, size, 100); // High priority
            return {
              ...result,
              size
            };
          }
        });
      }
    });
  };
  
  /**
   * Invalidate image cache for specific items
   */
  const invalidateItemImages = (itemIds: string[]) => {
    // Invalidate React Query cache for these items
    itemIds.forEach(itemId => {
      queryClient.invalidateQueries({ queryKey: ['images', itemId] });
    });
    
    // Also trigger the image service to clear its cache
    if (typeof window !== 'undefined') {
      itemIds.forEach(itemId => {
        const cacheEvent = new CustomEvent('invalidate-image-cache', {
          detail: { itemId }
        });
        window.dispatchEvent(cacheEvent);
      });
    }
  };
  
  return {
    preloadItemImages,
    prioritizeVisibleImages,
    invalidateItemImages
  };
} 