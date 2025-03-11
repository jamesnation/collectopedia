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
  
  // Load images when component mounts or itemIds change
  useEffect(() => {
    if (isLoading || !itemIds.length || !images) return;
    
    const newItems = itemIds.filter(id => !processedItemsRef.current.has(id));
    
    if (newItems.length > 0) {
      console.log(`[IMAGE-LOADER] Loading images for ${newItems.length} new items`);
      
      // Preload images with appropriate priority
      imageService.preloadItemImages(newItems, images);
      
      // Mark items as processed
      newItems.forEach(id => processedItemsRef.current.add(id));
    }
  }, [itemIds, images, isLoading, imageService]);
  
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