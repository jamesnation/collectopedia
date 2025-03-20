/*
 * Image Loader Component
 * 
 * This component uses React Query and the unified image service to handle image loading
 * for catalog items with optimizations for performance and mobile devices.
 * Updated to use the React Query integration for improved caching and invalidation.
 * Added deduplication and smart batching to reduce API load.
 */

import { useEffect, useRef, useCallback } from 'react';
import { SelectImage } from '@/db/schema/images-schema';
import { useImagePreloader } from './hooks/use-image-query';

interface ImageLoaderProps {
  itemIds: string[];
  images: Record<string, SelectImage[]>;
  isLoading?: boolean;
}

/**
 * Optimized image loader component that uses React Query and the image service
 * to efficiently load and cache images with proper prioritization
 */
export function ImageLoader({ itemIds, images, isLoading = false }: ImageLoaderProps) {
  const { preloadItemImages, prioritizeVisibleImages } = useImagePreloader();
  
  // Use refs to track state across renders without causing re-renders
  const processedItemsRef = useRef<Set<string>>(new Set());
  const visibleItemsRef = useRef<string[]>([]);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const pendingBatchRef = useRef<string[]>([]);
  const processingBatchRef = useRef<boolean>(false);
  const lastBatchTimeRef = useRef<number>(0);
  
  // Process batches with throttling to prevent too many concurrent requests
  const processBatchThrottled = useCallback(async () => {
    // Skip if we're already processing a batch or there's nothing to process
    if (processingBatchRef.current || pendingBatchRef.current.length === 0) {
      return;
    }
    
    // Enforce minimum time between batches (300ms)
    const now = Date.now();
    const timeSinceLastBatch = now - lastBatchTimeRef.current;
    if (timeSinceLastBatch < 300) {
      // Schedule another attempt after delay
      setTimeout(processBatchThrottled, 300 - timeSinceLastBatch);
      return;
    }
    
    // Mark as processing
    processingBatchRef.current = true;
    
    // Take current batch
    const currentBatch = [...pendingBatchRef.current];
    pendingBatchRef.current = [];
    
    // Only log if we're actually loading images
    if (currentBatch.length > 0) {
      console.log(`[IMAGE-LOADER] Processing batch of ${currentBatch.length} items`);
      
      try {
        // Preload images with appropriate priority
        await preloadItemImages(currentBatch, images);
        
        // Mark items as processed
        currentBatch.forEach(id => processedItemsRef.current.add(id));
      } catch (error) {
        console.error(`[IMAGE-LOADER] Error processing batch:`, error);
      }
    }
    
    // Update timestamp and mark as done
    lastBatchTimeRef.current = Date.now();
    processingBatchRef.current = false;
    
    // Process any items that were added while we were processing
    if (pendingBatchRef.current.length > 0) {
      processBatchThrottled();
    }
  }, [images, preloadItemImages]);
  
  // Queue items for loading and process in batches
  const queueItems = useCallback((newItemIds: string[]) => {
    // Skip empty arrays
    if (!newItemIds.length) return;
    
    // Only queue items we haven't processed yet
    const unprocessedItems = newItemIds.filter(id => !processedItemsRef.current.has(id));
    
    // Skip if nothing new to process
    if (!unprocessedItems.length) return;
    
    // Add to pending batch
    pendingBatchRef.current.push(...unprocessedItems);
    
    // Process the batch
    processBatchThrottled();
  }, [processBatchThrottled]);
  
  // Load initial images when component mounts or itemIds change
  useEffect(() => {
    if (isLoading || !itemIds.length || !images) return;
    
    // Find new items that need processing
    const newItems = itemIds.filter(id => !processedItemsRef.current.has(id));
    
    if (newItems.length > 0) {
      console.log(`[IMAGE-LOADER] Queuing ${newItems.length} new items`);
      queueItems(newItems);
    }
  }, [itemIds, images, isLoading, queueItems]);
  
  // Set up intersection observer to prioritize visible images
  const setupIntersectionObserver = useCallback(() => {
    if (typeof window === 'undefined') return;
    
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
          
          // Prioritize visible images using React Query
          if (visibleImageUrls.length > 0) {
            prioritizeVisibleImages(visibleImageUrls);
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
  }, [images, prioritizeVisibleImages]);
  
  // Wait for items to render before setting up observer
  useEffect(() => {
    // Wait for items to render before setting up observer
    const timerId = setTimeout(setupIntersectionObserver, 500);
    
    return () => {
      clearTimeout(timerId);
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, [itemIds, setupIntersectionObserver]);
  
  // This component doesn't render anything visible
  return null;
}

export default ImageLoader; 