"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getImagesByItemIdAction, getBatchImagesByItemIdsAction } from '@/actions/images-actions';
import { SelectImage } from '@/db/schema/images-schema';
import { checkItemsImageUpdatesAction } from '@/actions/items-actions';

// Add a debug logger helper at the top of the file
const debugLog = (message: string, ...args: any[]) => {
  // Only log in development environment
  if (process.env.NODE_ENV === 'development') {
    console.log(message, ...args);
  }
};

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
        // Use debug logger instead of console.log
        debugLog('[CACHE] Saved cache to localStorage with', Object.keys(cachedData).length, 'items');
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
      // Use debug logger instead of console.log
      debugLog('[CACHE] Checking for updated images on', cachedItemIds.length, 'items');
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
  
  // Helper function to load images individually (as a fallback)
  const loadImagesIndividually = useCallback(async (itemIds: string[]) => {
    // Process in batches with increased batch size for faster loading
    const batchSize = 50; // Increased from 25
    
    // Split into batches
    for (let i = 0; i < itemIds.length; i += batchSize) {
      const batchIds = itemIds.slice(i, i + batchSize);
      debugLog('[CACHE] Processing batch', Math.floor(i/batchSize) + 1, 'with', batchIds.length, 'items');
      
      try {
        // Load images for current batch in parallel
        await Promise.all(
          batchIds.map(async (itemId) => {
            try {
              // Reduce the logging frequency
              const result = await getImagesByItemIdAction(itemId);
              
              if (result.isSuccess && result.data) {
                // Only log if images were actually found
                if (result.data.length > 0) {
                  debugLog('[CACHE] Successfully fetched', result.data.length, 'images for item', itemId);
                }
                
                setCachedData(prev => {
                  const newCache = {
                    ...prev,
                    [itemId]: {
                      images: result.data || [],
                      cachedAt: Date.now()
                    }
                  };
                  // Only log if there are actual images
                  if (result.data && result.data.length > 0) {
                    debugLog('[CACHE] Updated cache for item', itemId, 'with', result.data.length, 'images');
                  }
                  return newCache;
                });
              } else {
                console.warn('[CACHE] Failed to fetch images for item', itemId, result.error);
              }
            } catch (error) {
              console.error(`[CACHE] Error fetching images for item ${itemId}:`, error);
            } finally {
              // Reduce logging here as well
              debugLog('[CACHE] Completed loading for item', itemId);
              
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
        console.error('[CACHE] Error loading batch:', error);
      }
    }
  }, []);
  
  // Function to load images for multiple items in batches
  const loadImages = useCallback(async (itemIds: string[], force = false) => {
    // Avoid unnecessary work if no items provided
    if (!itemIds.length) return;
    
    // Filter out items that are already loading
    const idsToLoad = itemIds.filter(id => !isLoading[id]);
    
    // Skip already cached and completed items unless force is true
    const filteredIdsToLoad = force 
      ? idsToLoad 
      : idsToLoad.filter(id => 
          !imageCache[id] || 
          !hasCompletedLoading[id]
        );
    
    // Check if any of the requested items should be force-reloaded
    const shouldForceReload = force && idsToLoad.length > 0;
    
    if (!filteredIdsToLoad.length) {
      debugLog('[CACHE] All requested images already cached or loading - no new loads needed');
      return;
    }
    
    debugLog('[CACHE] Will load images for', filteredIdsToLoad.length, 'items', shouldForceReload ? '(some forced reload)' : '');
    
    // Set loading state for all items about to be loaded
    setIsLoading(prev => {
      const newState = { ...prev };
      filteredIdsToLoad.forEach(id => {
        newState[id] = true;
      });
      debugLog('[CACHE] Updated loading state for', Object.keys(newState).filter(id => newState[id]).length, 'items');
      return newState;
    });

    // Use the batch endpoint if there are multiple images to load
    if (filteredIdsToLoad.length > 1) {
      try {
        // Fetch all images in a single request using the new batch endpoint
        console.log(`[CACHE] Using batch endpoint to load ${filteredIdsToLoad.length} items in a single request`);
        const result = await getBatchImagesByItemIdsAction(filteredIdsToLoad);
        
        if (result.isSuccess && result.data) {
          // Process the batch results
          const batchData = result.data;
          const now = Date.now();
          
          // Update the cache with all images at once
          setCachedData(prev => {
            const newCache = { ...prev };
            
            // Add each item's images to the cache
            Object.entries(batchData).forEach(([itemId, images]) => {
              newCache[itemId] = {
                images: images || [],
                cachedAt: now
              };
            });
            
            return newCache;
          });
          
          // Mark all items as completed loading
          setHasCompletedLoading(prev => {
            const newState = { ...prev };
            filteredIdsToLoad.forEach(id => {
              newState[id] = true;
            });
            return newState;
          });
          
          // Clear loading state for all items
          setIsLoading(prev => {
            const newState = { ...prev };
            filteredIdsToLoad.forEach(id => {
              newState[id] = false;
            });
            return newState;
          });
          
          console.log(`[CACHE] Successfully loaded ${Object.keys(result.data).length} items using batch endpoint`);
        } else {
          console.error('[CACHE] Batch load failed:', result.error);
          // Fall back to individual loading on batch failure
          await loadImagesIndividually(filteredIdsToLoad);
        }
      } catch (error) {
        console.error('[CACHE] Error in batch loading:', error);
        // Fall back to individual loading on error
        await loadImagesIndividually(filteredIdsToLoad);
      }
    } else {
      // If only one item, use the individual endpoint
      await loadImagesIndividually(filteredIdsToLoad);
    }
  }, [imageCache, isLoading, hasCompletedLoading, loadImagesIndividually]);

  // NEW FUNCTION: Preload both sold and unsold item images at once
  // This ensures images are loaded once regardless of filter changes
  const preloadItemImages = useCallback(async (soldItemIds: string[], unsoldItemIds: string[]) => {
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
    
    // Prioritize loading - load first batch immediately for visibility
    const priorityItems = filteredItemIds.slice(0, 20);
    console.log('[CACHE] Loading', priorityItems.length, 'high priority items immediately');
    loadImages(priorityItems, true); // Force high priority items to ensure they load immediately
    
    // Load remaining items after a delay
    if (filteredItemIds.length > 20) {
      const remainingItems = filteredItemIds.slice(20);
      console.log('[CACHE] Will load', remainingItems.length, 'remaining items after a delay');
      
      setTimeout(() => {
        loadImages(remainingItems);
      }, 100);
    }
  }, [isLoading, hasCompletedLoading, loadImages]);

  const invalidateCache = useCallback((itemId?: string) => {
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
        
        // NEW: Set invalidation flag to prioritize loading this item on return to catalog
        try {
          sessionStorage.setItem('invalidated_item', itemId);
          sessionStorage.setItem('invalidated_timestamp', Date.now().toString());
          console.log('[CACHE] Set invalidation flags for item', itemId);
        } catch (e) {
          console.error('[CACHE] Error setting invalidation flags:', e);
        }
      }
      
      // NEW: Immediately try to reload the item if we're in a component that might need it
      setTimeout(() => {
        loadImages([itemId], true);
      }, 0);
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
  }, [loadImages]);

  // Add a new useEffect to check for updates on focus and periodically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Function to check for updates for all cached items
    const checkAllCachedItemsForUpdates = async () => {
      const cachedItemIds = Object.keys(cachedData);
      if (cachedItemIds.length === 0) return;

      // Check if we have already checked these items recently
      // Store last check times in a local storage object to persist across page refreshes
      let lastCheckTimes: Record<string, number> = {};
      try {
        const storedTimes = localStorage.getItem('collectopedia-last-check-times');
        if (storedTimes) {
          lastCheckTimes = JSON.parse(storedTimes);
        }
      } catch (e) {
        console.error('[CACHE] Error reading check times:', e);
      }
      
      // Filter out items that have been checked recently (within 5 minutes)
      const now = Date.now();
      const itemsToCheck = cachedItemIds.filter(id => {
        const lastCheck = lastCheckTimes[id];
        if (!lastCheck) return true; // Check if never checked before
        
        const minutesSinceLastCheck = (now - lastCheck) / (1000 * 60);
        return minutesSinceLastCheck >= 5; // Only check items not checked in last 5 minutes
      });
      
      if (itemsToCheck.length === 0) {
        debugLog('[CACHE] All items have been checked recently, skipping update check');
        return;
      }

      console.log('[CACHE] Checking for updates for', itemsToCheck.length, 'items');
      
      try {
        // Get cache timestamps for items we need to check
        const timestamps: Record<string, number> = {};
        itemsToCheck.forEach(id => {
          timestamps[id] = cachedData[id].cachedAt;
        });
        
        // Check for updates
        const result = await checkItemsImageUpdatesAction(itemsToCheck, timestamps);
        
        // Update the last check time for all checked items
        itemsToCheck.forEach(id => {
          lastCheckTimes[id] = now;
        });
        
        // Save updated check times
        localStorage.setItem('collectopedia-last-check-times', JSON.stringify(lastCheckTimes));
        
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
        console.error('[CACHE] Error checking for item updates:', error);
      }
    };
    
    // Always run an initial check when the component mounts
    const initialCheckTimer = setTimeout(() => {
      checkAllCachedItemsForUpdates();
    }, 1000);
    
    // Clean up
    return () => clearTimeout(initialCheckTimer);
    
  }, [cachedData, invalidateCache, loadImages]);

  // Add a listener for when the page becomes visible again
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Track when the last visibility check was performed
    let lastVisibilityCheck = 0;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        // Only check if it's been at least 30 seconds since the last check
        const secondsSinceLastCheck = (now - lastVisibilityCheck) / 1000;
        
        if (secondsSinceLastCheck < 30) {
          debugLog(`[CACHE] Skipping visibility check (last checked ${secondsSinceLastCheck.toFixed(1)} seconds ago)`);
          return;
        }
        
        lastVisibilityCheck = now;
        console.log('[CACHE] Page became visible, checking for updates');
        
        // Check all cached items for updates when the page becomes visible again
        const cachedItemIds = Object.keys(cachedData);
        if (cachedItemIds.length > 0) {
          // Get the items that were most recently modified in the database
          // We'll focus on just the 10 most recently viewed items to reduce load
          const recentItemIds = cachedItemIds.sort((a, b) => {
            const aTime = cachedData[a].cachedAt || 0;
            const bTime = cachedData[b].cachedAt || 0;
            return bTime - aTime; // Sort by most recent first
          }).slice(0, 10);
          
          const timestamps: Record<string, number> = {};
          recentItemIds.forEach(id => {
            timestamps[id] = cachedData[id].cachedAt;
          });
          
          checkItemsImageUpdatesAction(recentItemIds, timestamps)
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