"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getImagesByItemIdAction } from '@/actions/images-actions';
import { SelectImage } from '@/db/schema/images-schema';

// Context type definition
interface ImageCacheContextType {
  imageCache: Record<string, SelectImage[]>;
  isLoading: Record<string, boolean>;
  loadImages: (itemIds: string[]) => void;
  invalidateCache: (itemId?: string) => void;
}

// Create context with default values
const ImageCacheContext = createContext<ImageCacheContextType>({
  imageCache: {},
  isLoading: {},
  loadImages: () => {},
  invalidateCache: () => {},
});

// Hook for components to use the image cache
export const useImageCache = () => useContext(ImageCacheContext);

// Provider component
export function ImageCacheProvider({ children }: { children: ReactNode }) {
  const [imageCache, setImageCache] = useState<Record<string, SelectImage[]>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  
  // Function to load images for multiple items in batches
  const loadImages = async (itemIds: string[]) => {
    if (!itemIds.length) return;
    
    // Filter out items that are already loading or cached
    const idsToLoad = itemIds.filter(id => !isLoading[id] && !imageCache[id]);
    
    if (!idsToLoad.length) return;
    
    // Set loading state for all items about to be loaded
    setIsLoading(prev => {
      const newState = { ...prev };
      idsToLoad.forEach(id => {
        newState[id] = true;
      });
      return newState;
    });

    // Process in batches of 10 to prevent too many parallel requests
    const batchSize = 10;
    
    // Split into batches
    for (let i = 0; i < idsToLoad.length; i += batchSize) {
      const batchIds = idsToLoad.slice(i, i + batchSize);
      
      // Load images for current batch in parallel
      await Promise.all(
        batchIds.map(async (itemId) => {
          try {
            const result = await getImagesByItemIdAction(itemId);
            
            if (result.isSuccess && result.data) {
              setImageCache(prev => ({
                ...prev,
                [itemId]: result.data || [],
              }));
            }
          } catch (error) {
            console.error(`Failed to fetch images for item ${itemId}:`, error);
          } finally {
            setIsLoading(prev => ({
              ...prev,
              [itemId]: false,
            }));
          }
        })
      );
      
      // Small delay between batches to prevent overwhelming the server
      if (i + batchSize < idsToLoad.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  };
  
  // Function to invalidate the cache for an item or the entire cache
  const invalidateCache = (itemId?: string) => {
    if (itemId) {
      setImageCache(prev => {
        const newCache = { ...prev };
        delete newCache[itemId];
        return newCache;
      });
    } else {
      setImageCache({});
    }
  };
  
  // Provider value
  const contextValue = {
    imageCache,
    isLoading,
    loadImages,
    invalidateCache,
  };
  
  return (
    <ImageCacheContext.Provider value={contextValue}>
      {children}
    </ImageCacheContext.Provider>
  );
} 