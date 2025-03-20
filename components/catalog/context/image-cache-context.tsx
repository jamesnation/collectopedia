"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { getImagesByItemIdAction } from '@/actions/images-actions';
import { SelectImage } from '@/db/schema/images-schema';
import { useQueryClient } from '@tanstack/react-query';

// Define the result type from the action
interface ImageActionResult {
  isSuccess: boolean;
  data?: SelectImage[];
  error?: string;
}

// Enhanced context type with more granular loading states
interface ImageCacheContextType {
  imageCache: Record<string, SelectImage[]>;
  isLoading: Record<string, boolean>;
  loadImages: (itemIds: string[]) => void;
  preloadItemImages: (soldItemIds: string[], unsoldItemIds: string[]) => void;
  invalidateCache: (itemId?: string) => void;
  // New helper to determine if an item has actual images
  hasImages: (itemId: string) => boolean;
  // New field to track which items have completed loading
  hasCompletedLoading: Record<string, boolean>;
}

// Create context with default values
const ImageCacheContext = createContext<ImageCacheContextType>({
  imageCache: {},
  isLoading: {},
  hasCompletedLoading: {},
  loadImages: () => {},
  preloadItemImages: () => {},
  invalidateCache: () => {},
  hasImages: () => false,
});

// Hook for components to use the image cache
export const useImageCache = () => useContext(ImageCacheContext);

// Provider component
export function ImageCacheProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  
  // Initialize state - removing dependency on localStorage for more direct image loading
  const [imageCache, setImageCache] = useState<Record<string, SelectImage[]>>({});

  // Track items that are currently loading
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  
  // Initialize completed loading state
  const [hasCompletedLoading, setHasCompletedLoading] = useState<Record<string, boolean>>({});

  // Track the most recently requested batch of items for debugging
  const [lastRequestedItems, setLastRequestedItems] = useState<string[]>([]);
  
  // Track operations to prevent overlapping calls
  const pendingOperations = useRef<Set<string>>(new Set());
  const invalidationTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // CRITICAL FIX: Add a ref to track if we've already loaded on this session
  const initialLoadCompleted = useRef<boolean>(false);
  
  // Add event listener for cache invalidation
  useEffect(() => {
    const handleInvalidateCache = (event: CustomEvent<{ itemId: string }>) => {
      const { itemId } = event.detail;
      console.log('[CACHE] Received invalidate-image-cache event for item:', itemId);
      invalidateCache(itemId);
    };

    // Add the event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('invalidate-image-cache', handleInvalidateCache as EventListener);
    }

    // Remove the event listener when the component unmounts
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('invalidate-image-cache', handleInvalidateCache as EventListener);
      }
    };
  }, []);
  
  // Helper to check if URL is from Supabase
  const isSupabaseUrl = (url?: string): boolean => {
    if (!url) return false;
    return url.includes('supabase.co/storage') || 
           (url.includes('supabase') && url.includes('.in')) ||
           url.startsWith('data:');
  };
  
  // Helper function to check if an item has actual images
  const hasImages = useCallback((itemId: string): boolean => {
    if (!itemId) return false;
    
    // Only return true if we have confirmed images AND we've completed loading
    return Boolean(
      hasCompletedLoading[itemId] && 
      imageCache[itemId] !== undefined && 
      imageCache[itemId]?.length > 0
    );
  }, [imageCache, hasCompletedLoading]);
  
  // Memoize the loadImages function to maintain stable identity
  const loadImagesCallback = useCallback(async (itemIds: string[]) => {
    if (!itemIds?.length) return;
    
    // CRITICAL FIX: Skip loading if we've already done it once and have data
    if (initialLoadCompleted.current && Object.keys(imageCache).length > 0) {
      console.log('[CACHE] Initial load already completed, using cached data');
      return;
    }
    
    // Only log summary information, not every item
    console.log(`[CACHE] Loading images for ${itemIds.length} items`);
    
    // Store the last requested items for debugging
    setLastRequestedItems(itemIds);

    // Check if all images are already in cache to prevent unnecessary loading
    const alreadyCachedItems = itemIds.filter(id => 
      imageCache[id] && 
      imageCache[id].length > 0 && 
      hasCompletedLoading[id]
    );
    
    if (alreadyCachedItems.length === itemIds.length) {
      console.log('[CACHE] All items already cached, skipping load');
      initialLoadCompleted.current = true;
      return;
    }
    
    // Filter to only load items that need refreshing:
    // 1. Items with no images in cache
    // 2. Items not yet loaded
    const idsToLoad = itemIds.filter(id => {
      // Always load if not in cache or not completed loading
      return !imageCache[id] || !hasCompletedLoading[id];
    });
    
    // Skip if nothing to load
    if (idsToLoad.length === 0) {
      console.log('[CACHE] No items need refreshing');
      return;
    } else {
      console.log(`[CACHE] Loading ${idsToLoad.length} items that need refreshing`);
    }
    
    // Set loading state for all items about to be loaded
    setIsLoading(prev => {
      const newState = { ...prev };
      idsToLoad.forEach(id => {
        newState[id] = true;
      });
      
      // Simplified logging - just the count
      return newState;
    });

    // Process in batches with increased batch size for faster loading
    const batchSize = 50;
    
    // Split into batches
    for (let i = 0; i < idsToLoad.length; i += batchSize) {
      const batchIds = idsToLoad.slice(i, i + batchSize);
      
      // Only log batch summaries, not each batch
      if (i === 0 || i + batchSize >= idsToLoad.length) {
        console.log(`[CACHE] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(idsToLoad.length/batchSize)}`);
      }
      
      try {
        // Load images for current batch in parallel
        const results = await Promise.all(
          batchIds.map(async (itemId) => {
            try {
              // Removed verbose logging for each item
              const result = await getImagesByItemIdAction(itemId);
              return { itemId, result };
            } catch (error) {
              console.error(`[CACHE] Error fetching images for item ${itemId}:`, error);
              return { itemId, error };
            }
          })
        );
        
        // Process results in batch to minimize state updates
        const newCacheEntries: Record<string, SelectImage[]> = {};
        
        // Process successful results
        results.forEach(({ itemId, result, error }) => {
          if (result && result.isSuccess && result.data) {
            // Don't log for each successfully fetched item - too noisy
            
            // Cache the result in React Query
            queryClient.setQueryData<ImageActionResult>(['images', itemId], result);
            
            // Collect for state update
            newCacheEntries[itemId] = result.data || [];
            
            // For Supabase URLs, use smarter caching
            if (result.data.length > 0) {
              const image = result.data[0];
              if (image.url && isSupabaseUrl(image.url)) {
                // Only invalidate if it's a recent upload (modified in last hour)
                // Check timestamp or updatedAt if available
                const isRecent = image.createdAt ? 
                  (Date.now() - new Date(image.createdAt).getTime() < 60 * 60 * 1000) : false;
                
                if (isRecent) {
                  // Only invalidate recent images
                  queryClient.invalidateQueries({ 
                    queryKey: ['optimizedImage', image.url],
                    refetchType: 'all'
                  });
                }
              }
            }
          } else if (error) {
            console.warn(`[CACHE] Failed to fetch images for item ${itemId}`);
          }
          
          // Mark loading as complete for this item
          setIsLoading(prev => ({
            ...prev,
            [itemId]: false,
          }));
          
          // Mark as completed loading
          setHasCompletedLoading(prev => ({
            ...prev,
            [itemId]: true
          }));
        });
        
        // Update cache with all successful results at once
        if (Object.keys(newCacheEntries).length > 0) {
          setImageCache(prev => {
            const updatedCache = { ...prev, ...newCacheEntries };
            // Log only a summary
            console.log(`[CACHE] Updated ${Object.keys(newCacheEntries).length} items in cache`);
            return updatedCache;
          });
        }
      } catch (error) {
        console.error('[CACHE] Error processing batch:', error);
      }
    }
    
    console.log('[CACHE] Completed loading all image batches');
    
    // CRITICAL FIX: Mark initial load as completed
    initialLoadCompleted.current = true;
  }, [queryClient, setIsLoading, setImageCache, setHasCompletedLoading, setLastRequestedItems, imageCache, hasCompletedLoading]);

  // Memoize the preloadItemImages function
  const preloadItemImagesCallback = useCallback(async (soldItemIds: string[], unsoldItemIds: string[]) => {
    // Combine both arrays and deduplicate using Set
    const allItemIds = [...new Set([...soldItemIds, ...unsoldItemIds])];
    
    // Load all items to ensure fresh data
    console.log('[CACHE] Loading all', allItemIds.length, 'items');
    
    // Call the existing loadImages function
    loadImagesCallback(allItemIds);
  }, [loadImagesCallback]);

  const invalidateCache = (itemId?: string) => {
    // If no itemId, it's a full invalidation
    const operationKey = itemId || 'all';
    
    // Skip if we're already processing this operation
    if (pendingOperations.current.has(operationKey)) {
      console.log(`[CACHE] Skipping duplicate invalidation for ${operationKey}`);
      return;
    }
    
    // Mark operation as pending
    pendingOperations.current.add(operationKey);
    
    // Clear previous timeout if exists
    if (invalidationTimeout.current) {
      clearTimeout(invalidationTimeout.current);
    }
    
    if (itemId) {
      console.log('[CACHE-DEBUG] Before invalidation for item', itemId, 'cache contains items:', Object.keys(imageCache));
      
      // First pass: Clear the item from local cache to prevent UI from showing stale data
      setImageCache(prev => {
        const newCache = { ...prev };
        delete newCache[itemId];
        return newCache;
      });
      
      setIsLoading(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
      
      setHasCompletedLoading(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
      
      // Second pass: Invalidate React Query cache and schedule reload after a delay
      invalidationTimeout.current = setTimeout(() => {
        try {
          // Invalidate React Query cache for this item's images
          queryClient.invalidateQueries({ 
            queryKey: ['images', itemId],
            refetchType: 'all' // Force refetching 
          });
          
          console.log('[CACHE-DEBUG] After invalidation for item', itemId, 'cache contains items:', Object.keys(imageCache));
          
          // Check if we're still mounted and component exists
          if (typeof window !== 'undefined' && document.body.contains(document.getElementById('image-cache-provider'))) {
            console.log('[CACHE-DEBUG] Attempting to reload images for item', itemId);
            loadImagesCallback([itemId]);
          }
        } finally {
          // Remove from pending operations
          pendingOperations.current.delete(operationKey);
        }
      }, 100);
    } else {
      console.log('[CACHE-DEBUG] Before invalidating entire cache, contains items:', Object.keys(imageCache));
      
      // First pass: Clear local cache
      setImageCache({});
      setIsLoading({});
      setHasCompletedLoading({});
      
      // Second pass: Clear React Query cache after a delay
      invalidationTimeout.current = setTimeout(() => {
        try {
          // Invalidate all image queries
          queryClient.removeQueries({ queryKey: ['images'] });
          queryClient.removeQueries({ queryKey: ['optimizedImage'] });
          console.log('[CACHE-DEBUG] After invalidating entire cache, contains items:', Object.keys(imageCache));
        } finally {
          // Remove from pending operations
          pendingOperations.current.delete(operationKey);
        }
      }, 100);
    }
  };

  return (
    <ImageCacheContext.Provider value={{ 
      imageCache, 
      isLoading, 
      loadImages: loadImagesCallback,
      preloadItemImages: preloadItemImagesCallback,
      invalidateCache,
      hasImages,
      hasCompletedLoading
    }}>
      <div id="image-cache-provider" style={{ display: 'contents' }}>
        {children}
      </div>
    </ImageCacheContext.Provider>
  );
} 