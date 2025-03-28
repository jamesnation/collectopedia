/*
 * Image Loader Component
 * 
 * This component uses the unified image service to handle image loading
 * for catalog items with optimizations for performance and mobile devices.
 */

import { useEffect, useRef } from 'react';
import { useImageService } from '@/services/image-service';
import { SelectImage } from '@/db/schema/images-schema';

interface ImageLoaderProps {
  itemIds: string[];
  images: Record<string, SelectImage[]>;
  isLoading?: boolean;
}

/**
 * Optimized image loader component that uses the centralized image service
 * to efficiently load and cache images with proper prioritization
 */
export function ImageLoader({ itemIds, images, isLoading = false }: ImageLoaderProps) {
  const imageService = useImageService();
  const processedItemsRef = useRef<Set<string>>(new Set());
  const visibleItemsRef = useRef<string[]>([]);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  
  // Check for recently updated items
  const checkForUpdatedItems = () => {
    if (typeof window === 'undefined') return null;
    
    const invalidatedItem = sessionStorage.getItem('invalidated_item');
    const timestamp = sessionStorage.getItem('invalidated_timestamp');
    
    if (invalidatedItem && timestamp) {
      const timestampNum = parseInt(timestamp);
      const now = Date.now();
      const isRecent = (now - timestampNum) < 30000; // 30 seconds
      
      if (isRecent && itemIds.includes(invalidatedItem)) {
        console.log(`[IMAGE-LOADER] Detected recently updated item: ${invalidatedItem}`);
        return invalidatedItem;
      }
    }
    
    return null;
  };
  
  // Load images when component mounts or itemIds change
  useEffect(() => {
    if (isLoading || !itemIds.length || !images) return;
    
    // Get recently updated item first
    const updatedItemId = checkForUpdatedItems();
    
    // Get new items that haven't been processed yet
    const newItems = itemIds.filter(id => !processedItemsRef.current.has(id));
    
    if (newItems.length > 0) {
      console.log(`[IMAGE-LOADER] Loading images for ${newItems.length} new items`);
      
      // If we have a recently updated item, prioritize it
      if (updatedItemId && images[updatedItemId]) {
        console.log(`[IMAGE-LOADER] Prioritizing recently updated item: ${updatedItemId}`);
        
        // Preload this specific item's images with highest priority
        const updatedItemImages = images[updatedItemId];
        if (updatedItemImages && updatedItemImages.length > 0) {
          updatedItemImages.forEach(img => {
            imageService.preloadImage(img.url, 100); // Use highest priority (100)
          });
          
          // Mark as processed
          processedItemsRef.current.add(updatedItemId);
          
          // Clear from sessionStorage
          sessionStorage.removeItem('invalidated_item');
          sessionStorage.removeItem('invalidated_timestamp');
          sessionStorage.removeItem('force_reload_images');
        }
        
        // Filter out the prioritized item from newItems
        const otherNewItems = newItems.filter(id => id !== updatedItemId);
        
        // Load the rest with normal priority after a small delay
        if (otherNewItems.length > 0) {
          setTimeout(() => {
            imageService.preloadItemImages(otherNewItems, images);
            
            // Mark items as processed
            otherNewItems.forEach(id => processedItemsRef.current.add(id));
          }, 100);
        }
      } else {
        // No updated item, just load all new items normally
        imageService.preloadItemImages(newItems, images);
        
        // Mark items as processed
        newItems.forEach(id => processedItemsRef.current.add(id));
      }
    } else if (updatedItemId && images[updatedItemId]) {
      // When we have no new items but an updated item that's already processed,
      // still prioritize its images since they might have changed
      console.log(`[IMAGE-LOADER] Re-prioritizing updated item with no new items: ${updatedItemId}`);
      const updatedItemImages = images[updatedItemId];
      
      if (updatedItemImages && updatedItemImages.length > 0) {
        updatedItemImages.forEach(img => {
          imageService.preloadImage(img.url, 100); // Use highest priority (100)
        });
        
        // Clear from sessionStorage
        sessionStorage.removeItem('invalidated_item');
        sessionStorage.removeItem('invalidated_timestamp');
        sessionStorage.removeItem('force_reload_images');
      }
    }
  }, [itemIds, images, isLoading, imageService, checkForUpdatedItems]);
  
  // Set up intersection observer to prioritize visible images
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const observeVisibleItems = () => {
      // Clean up existing observer
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
      
      // Set up new observer
      intersectionObserverRef.current = new IntersectionObserver(
        (entries) => {
          const newVisibleItems: string[] = [];
          
          entries.forEach(entry => {
            const itemId = entry.target.getAttribute('data-item-id');
            if (entry.isIntersecting && itemId) {
              newVisibleItems.push(itemId);
            }
          });
          
          if (newVisibleItems.length > 0) {
            // Get all image URLs for visible items
            const visibleImageUrls: string[] = [];
            newVisibleItems.forEach(itemId => {
              if (images[itemId] && images[itemId].length > 0) {
                visibleImageUrls.push(images[itemId][0].url);
              }
            });
            
            // Prioritize visible images
            if (visibleImageUrls.length > 0) {
              imageService.prioritizeVisibleImages(visibleImageUrls);
            }
            
            // Update visible items ref
            visibleItemsRef.current = newVisibleItems;
          }
        },
        {
          root: null,
          rootMargin: '100px', // Load images slightly before they enter viewport
          threshold: 0.1       // Trigger when at least 10% of the element is visible
        }
      );
      
      // Start observing item elements
      const itemElements = document.querySelectorAll('[data-item-id]');
      itemElements.forEach(el => {
        intersectionObserverRef.current!.observe(el);
      });
    };
    
    // Wait for items to render before setting up observer
    const timerId = setTimeout(observeVisibleItems, 100);
    
    return () => {
      clearTimeout(timerId);
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, [itemIds, images, imageService]);
  
  // Log statistics periodically
  useEffect(() => {
    const logStats = () => {
      const stats = imageService.getCacheStats();
      console.log('[IMAGE-LOADER] Cache stats:', stats);
    };
    
    // Log stats once on mount
    logStats();
    
    // Set up interval to log stats periodically (only in development)
    let intervalId: NodeJS.Timeout | null = null;
    if (process.env.NODE_ENV === 'development') {
      intervalId = setInterval(logStats, 10000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [imageService]);
  
  // This component doesn't render anything visible
  return null;
}

export default ImageLoader; 