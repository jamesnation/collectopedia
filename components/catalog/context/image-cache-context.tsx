"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getImagesByItemIdAction } from '@/actions/images-actions';
import { SelectImage } from '@/db/schema/images-schema';
import { checkItemsImageUpdatesAction } from '@/actions/items-actions';

// Enhanced context type with more granular loading states
interface ImageCacheContextType {
  imageCache: Record<string, SelectImage[]>;
  isLoading: Record<string, boolean>;
  loadImages: (itemIds: string[], force?: boolean) => void;
  preloadItemImages: (soldItemIds: string[], unsoldItemIds: string[]) => void;
  invalidateCache: (itemId?: string) => void;
  // New helper to determine if an item has actual images
  hasImages: (itemId: string) => boolean;
  // New field to track which items have completed loading
  hasCompletedLoading: Record<string, boolean>;
}

// Interface for the cached data with timestamp
interface CachedData {
  images: SelectImage[];
  cachedAt: number; // timestamp when this item was cached
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
  // Initialize state from localStorage if available with timestamps
  const [cachedData, setCachedData] = useState<Record<string, CachedData>>(() => {
    if (typeof window === 'undefined') return {};
    
    try {
      const savedCache = localStorage.getItem('collectopedia-image-cache');
      if (savedCache) {
        const parsed = JSON.parse(savedCache);
        
        // Check if the data is in the new format with timestamps
        if (parsed && typeof parsed === 'object') {
          // Handle both old and new format
          const processedData: Record<string, CachedData> = {};
          
          Object.entries(parsed).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              // Old format - convert to new format with current timestamp
              processedData[key] = {
                images: value as SelectImage[],
                cachedAt: Date.now()
              };
            } else if (typeof value === 'object' && (value as any).images) {
              // Already in new format
              processedData[key] = value as CachedData;
            }
          });
          
          console.log('[CACHE] Loaded cache from localStorage (with timestamps)');
          return processedData;
        }
      }
    } catch (e) {
      console.error('[CACHE] Failed to load image cache from localStorage:', e);
    }
    
    return {};
  });

  // Convert the cached data to the format expected by components
  const imageCache = React.useMemo(() => {
    const result: Record<string, SelectImage[]> = {};
    Object.entries(cachedData).forEach(([key, data]) => {
      result[key] = data.images;
    });
    return result;
  }, [cachedData]);

  // Track items that are currently loading
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  
  // Initialize completed loading state based on cached images
  const [hasCompletedLoading, setHasCompletedLoading] = useState<Record<string, boolean>>(() => {
    return Object.keys(cachedData).reduce((acc, id) => ({
      ...acc,
      [id]: true
    }), {});
  });

  // Track the most recently requested batch of items for debugging
  const [lastRequestedItems, setLastRequestedItems] = useState<string[]>([]);
  
  // Save cache to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(cachedData).length > 0) {
      try {
        localStorage.setItem('collectopedia-image-cache', JSON.stringify(cachedData));
        console.log('[CACHE] Saved cache to localStorage with', Object.keys(cachedData).length, 'items');
      } catch (e) {
        console.error('[CACHE] Failed to save image cache to localStorage:', e);
      }
    }
  }, [cachedData]);
  
  // Helper function to check if an item has actual images
  const hasImages = useCallback((itemId: string): boolean => {
    // Only return true if we have confirmed images AND we've completed loading
    return hasCompletedLoading[itemId] && 
           imageCache[itemId] !== undefined && 
           imageCache[itemId].length > 0;
  }, [imageCache, hasCompletedLoading]);
  
  // Check if any items have been updated since they were cached
  const checkForUpdates = useCallback(async (itemIds: string[]) => {
    if (!itemIds.length) return [];
    
    // Only check items that we have in the cache
    const cachedItemIds = itemIds.filter(id => cachedData[id]);
    if (!cachedItemIds.length) return [];
    
    // Prepare cache timestamps for comparison
    const cachedTimestamps: Record<string, number> = {};
    cachedItemIds.forEach(id => {
      cachedTimestamps[id] = cachedData[id].cachedAt;
    });
    
    // Check against server timestamps
    try {
      console.log('[CACHE] Checking for updated images on', cachedItemIds.length, 'items');
      const result = await checkItemsImageUpdatesAction(cachedItemIds, cachedTimestamps);
      
      if (result.isSuccess && result.data && result.data.length > 0) {
        console.log('[CACHE] Found', result.data.length, 'items with updated images');
        return result.data;
      }
    } catch (error) {
      console.error('[CACHE] Error checking for image updates:', error);
    }
    
    return [];
  }, [cachedData]);
  
  // Function to load images for multiple items in batches
  const loadImages = async (itemIds: string[], force = false) => {
    if (!itemIds.length) return;
    
    console.log('[CACHE] loadImages called with', itemIds.length, 'items', force ? '(forced reload)' : '');
    
    // Store the last requested items for debugging
    setLastRequestedItems(itemIds);

    // Filter out items that are already loading to avoid double loading
    const idsToLoad = itemIds.filter(id => !isLoading[id]);
    
    // Check if any items need to be reloaded because they were updated elsewhere
    let itemsToForceReload: string[] = [];
    
    if (!force) {
      try {
        itemsToForceReload = await checkForUpdates(idsToLoad);
        if (itemsToForceReload.length > 0) {
          console.log('[CACHE] Will force reload', itemsToForceReload.length, 'items with updated images');
        }
      } catch (error) {
        console.error('[CACHE] Error checking for updates:', error);
      }
    }
    
    // Combine forced items with explicitly forced flag
    const shouldForceReload = force || itemsToForceReload.length > 0;
    
    // Add more detailed diagnostics
    console.log('[CACHE DEBUG] Detailed item load decisions:');
    itemIds.slice(0, 5).forEach(id => { // Just log first 5 to avoid flooding console
      console.log(`[CACHE DEBUG] Item ${id}: isLoading=${!!isLoading[id]}, hasCompletedLoading=${!!hasCompletedLoading[id]}, cached=${!!cachedData[id]}, cachedImages=${cachedData[id]?.images.length || 0}, forceReload=${itemsToForceReload.includes(id)}`);
    });
    
    // If forcing reload, include all items that need updates
    // Otherwise, only load items that haven't been loaded yet
    const filteredIdsToLoad = shouldForceReload 
      ? [...new Set([...idsToLoad.filter(id => !hasCompletedLoading[id]), ...itemsToForceReload])]
      : idsToLoad.filter(id => !hasCompletedLoading[id]);
    
    if (!filteredIdsToLoad.length) {
      console.log('[CACHE] All requested images already cached or loading - no new loads needed');
      return;
    }
    
    console.log('[CACHE] Will load images for', filteredIdsToLoad.length, 'items', shouldForceReload ? '(some forced reload)' : '');
    
    // Set loading state for all items about to be loaded
    setIsLoading(prev => {
      const newState = { ...prev };
      filteredIdsToLoad.forEach(id => {
        newState[id] = true;
      });
      console.log('[CACHE] Updated loading state for', Object.keys(newState).filter(id => newState[id]).length, 'items');
      return newState;
    });

    // Process in batches with increased batch size for faster loading
    const batchSize = 50; // Increased from 25
    
    // Split into batches
    for (let i = 0; i < filteredIdsToLoad.length; i += batchSize) {
      const batchIds = filteredIdsToLoad.slice(i, i + batchSize);
      console.log('[CACHE] Processing batch', Math.floor(i/batchSize) + 1, 'with', batchIds.length, 'items');
      
      try {
        // Load images for current batch in parallel
        await Promise.all(
          batchIds.map(async (itemId) => {
            try {
              console.log('[CACHE] Fetching images for item', itemId);
              const result = await getImagesByItemIdAction(itemId);
              
              if (result.isSuccess && result.data) {
                console.log('[CACHE] Successfully fetched', result.data.length, 'images for item', itemId);
                setCachedData(prev => {
                  const newCache = {
                    ...prev,
                    [itemId]: {
                      images: result.data || [],
                      cachedAt: Date.now()
                    }
                  };
                  console.log('[CACHE] Updated cache for item', itemId, 'with', (result.data || []).length, 'images');
                  return newCache;
                });
              } else {
                console.warn('[CACHE] Failed to fetch images for item', itemId, result.error);
              }
            } catch (error) {
              console.error(`[CACHE] Error fetching images for item ${itemId}:`, error);
            } finally {
              console.log('[CACHE] Setting loading state to false for item', itemId);
              
              // Mark the item as having completed loading, regardless of result
              setHasCompletedLoading(prev => ({
                ...prev,
                [itemId]: true
              }));
              
              setIsLoading(prev => ({
                ...prev,
                [itemId]: false,
              }));
            }
          })
        );
      } catch (error) {
        console.error('[CACHE] Error processing batch:', error);
      }
      
      // No delays between batches for maximum performance
    }
    
    console.log('[CACHE] Completed loading all image batches');
  };

  // NEW FUNCTION: Preload both sold and unsold item images at once
  // This ensures images are loaded once regardless of filter changes
  const preloadItemImages = async (soldItemIds: string[], unsoldItemIds: string[]) => {
    console.log('[CACHE] preloadItemImages called with', soldItemIds.length, 'sold items and', unsoldItemIds.length, 'unsold items');
    
    // Combine both arrays and deduplicate using Set
    const allItemIds = [...new Set([...soldItemIds, ...unsoldItemIds])];
    
    // Skip items that are already loading or completed
    const filteredItemIds = allItemIds.filter(id => 
      !isLoading[id] && !hasCompletedLoading[id]
    );
    
    console.log('[CACHE] Combined unique items to load:', allItemIds.length);
    console.log('[CACHE] After filtering already loaded items:', filteredItemIds.length);
    
    if (filteredItemIds.length === 0) {
      console.log('[CACHE] All items already cached or loading, no additional loading needed');
      return;
    }
    
    // Call the existing loadImages function with filtered IDs
    loadImages(filteredItemIds);
  };

  const invalidateCache = (itemId?: string) => {
    if (itemId) {
      console.log('[CACHE] Invalidating cache for item', itemId);
      
      // Clear from memory cache
      setCachedData(prev => {
        const newCache = { ...prev };
        delete newCache[itemId];
        return newCache;
      });
      
      // Reset loading state
      setIsLoading(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
      
      // Important: Reset hasCompletedLoading to ensure the item will be reloaded next time
      setHasCompletedLoading(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        console.log('[CACHE] Reset hasCompletedLoading for item', itemId);
        return newState;
      });
      
      // Clear from localStorage if available
      if (typeof window !== 'undefined') {
        try {
          const savedCache = localStorage.getItem('collectopedia-image-cache');
          if (savedCache) {
            const parsedCache = JSON.parse(savedCache);
            if (parsedCache[itemId]) {
              delete parsedCache[itemId];
              localStorage.setItem('collectopedia-image-cache', JSON.stringify(parsedCache));
              console.log('[CACHE] Removed item', itemId, 'from localStorage cache');
            }
          }
        } catch (e) {
          console.error('[CACHE] Error updating localStorage cache:', e);
        }
      }
    } else {
      // Clear entire cache
      console.log('[CACHE] Invalidating entire image cache');
      setCachedData({});
      setIsLoading({});
      setHasCompletedLoading({});
      
      // Clear from localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('collectopedia-image-cache');
          console.log('[CACHE] Cleared localStorage cache');
        } catch (e) {
          console.error('[CACHE] Error clearing localStorage cache:', e);
        }
      }
    }
  };

  // Add a new useEffect to check for updates on focus and periodically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Function to check for updates for all cached items
    const checkAllCachedItemsForUpdates = async () => {
      const cachedItemIds = Object.keys(cachedData);
      if (cachedItemIds.length === 0) return;

      console.log('[CACHE] Checking for updates for all cached items:', cachedItemIds.length);
      
      try {
        // Get cache timestamps for all items
        const timestamps: Record<string, number> = {};
        cachedItemIds.forEach(id => {
          timestamps[id] = cachedData[id].cachedAt;
        });
        
        // Check for updates
        const result = await checkItemsImageUpdatesAction(cachedItemIds, timestamps);
        
        if (result.isSuccess && result.data && result.data.length > 0) {
          console.log('[CACHE] Found', result.data.length, 'items with updated images, invalidating cache');
          
          // Invalidate cache for each updated item
          result.data.forEach(itemId => {
            invalidateCache(itemId);
          });
          
          // After invalidating, trigger a reload of these items
          loadImages(result.data, true);
        }
      } catch (error) {
        console.error('[CACHE] Error checking for all item updates:', error);
      }
    };
    
    // Always run an initial check when the component mounts, regardless of device type
    // Short delay to allow other initialization to complete
    const initialCheckTimer = setTimeout(() => {
      checkAllCachedItemsForUpdates();
    }, 1000);
    
    // Clean up
    return () => clearTimeout(initialCheckTimer);
    
  }, [cachedData, invalidateCache, loadImages]);

  // Add a listener for when the page becomes visible again
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[CACHE] Page became visible, checking for updates');
        // Check all cached items for updates when the page becomes visible again
        const cachedItemIds = Object.keys(cachedData);
        if (cachedItemIds.length > 0) {
          const timestamps: Record<string, number> = {};
          cachedItemIds.forEach(id => {
            timestamps[id] = cachedData[id].cachedAt;
          });
          
          checkItemsImageUpdatesAction(cachedItemIds, timestamps)
            .then(result => {
              if (result.isSuccess && result.data && result.data.length > 0) {
                console.log('[CACHE] Found items with updates after page focus:', result.data);
                // Force reload of these items
                loadImages(result.data, true);
              }
            })
            .catch(error => {
              console.error('[CACHE] Error checking for updates on visibility change:', error);
            });
        }
      }
    };
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [cachedData, loadImages]);

  // Provide context values to children
  return (
    <ImageCacheContext.Provider 
      value={{ 
        imageCache, 
        isLoading, 
        hasCompletedLoading,
        loadImages,
        preloadItemImages,
        invalidateCache,
        hasImages
      }}
    >
      {children}
    </ImageCacheContext.Provider>
  );
} 