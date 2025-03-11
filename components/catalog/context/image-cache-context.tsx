"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getImagesByItemIdAction } from '@/actions/images-actions';
import { SelectImage } from '@/db/schema/images-schema';

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
  // Initialize state from localStorage if available
  const [imageCache, setImageCache] = useState<Record<string, SelectImage[]>>(() => {
    if (typeof window === 'undefined') return {};
    
    try {
      const savedCache = localStorage.getItem('collectopedia-image-cache');
      if (savedCache) {
        console.log('[CACHE] Loaded cache from localStorage');
        return JSON.parse(savedCache);
      }
    } catch (e) {
      console.error('[CACHE] Failed to load image cache from localStorage:', e);
    }
    
    return {};
  });

  // Track items that are currently loading
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  
  // Initialize completed loading state based on cached images
  const [hasCompletedLoading, setHasCompletedLoading] = useState<Record<string, boolean>>(() => {
    return Object.keys(imageCache).reduce((acc, id) => ({
      ...acc,
      [id]: true
    }), {});
  });

  // Track the most recently requested batch of items for debugging
  const [lastRequestedItems, setLastRequestedItems] = useState<string[]>([]);
  
  // Save cache to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(imageCache).length > 0) {
      try {
        localStorage.setItem('collectopedia-image-cache', JSON.stringify(imageCache));
        console.log('[CACHE] Saved cache to localStorage with', Object.keys(imageCache).length, 'items');
      } catch (e) {
        console.error('[CACHE] Failed to save image cache to localStorage:', e);
      }
    }
  }, [imageCache]);
  
  // Helper function to check if an item has actual images
  const hasImages = useCallback((itemId: string): boolean => {
    // Only return true if we have confirmed images AND we've completed loading
    return hasCompletedLoading[itemId] && 
           imageCache[itemId] !== undefined && 
           imageCache[itemId].length > 0;
  }, [imageCache, hasCompletedLoading]);
  
  // Function to load images for multiple items in batches
  const loadImages = async (itemIds: string[]) => {
    if (!itemIds.length) return;
    
    console.log('[CACHE] loadImages called with', itemIds.length, 'items');
    
    // Store the last requested items for debugging
    setLastRequestedItems(itemIds);

    // Filter out items that are already loading to avoid double loading
    const idsToLoad = itemIds.filter(id => !isLoading[id]);
    
    // Even if an item has completed loading before, we should reload it 
    // if there's a URL parameter indicating we should refresh
    let shouldForceReload = false;
    if (typeof window !== 'undefined') {
      shouldForceReload = new URLSearchParams(window.location.search).get('refresh') === 'true';
    }
    
    // If not forcing reload, further filter out items that have already completed loading
    // This is key to preventing reloads when toggling filters
    const filteredIdsToLoad = shouldForceReload 
      ? idsToLoad 
      : idsToLoad.filter(id => !hasCompletedLoading[id]);
    
    if (!filteredIdsToLoad.length) {
      console.log('[CACHE] All requested images already cached or loading - no new loads needed');
      return;
    }
    
    console.log('[CACHE] Will load images for', filteredIdsToLoad.length, 'items', shouldForceReload ? '(force reload)' : '');
    
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
                setImageCache(prev => {
                  const newCache = {
                    ...prev,
                    [itemId]: result.data || [],
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
    } else {
      console.log('[CACHE] Invalidating entire cache');
      setImageCache({});
      setIsLoading({});
      setHasCompletedLoading({});
    }
  };

  return (
    <ImageCacheContext.Provider value={{ 
      imageCache, 
      isLoading, 
      loadImages,
      preloadItemImages,
      invalidateCache,
      hasImages,
      hasCompletedLoading
    }}>
      {children}
    </ImageCacheContext.Provider>
  );
} 