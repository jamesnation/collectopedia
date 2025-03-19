/**
 * Image Loader React Component
 * 
 * Enhanced image loader that manages efficient image loading and caching
 * with intersection observer for lazy loading.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useImageCache } from '../context/image-cache-context';

// Define a local type to avoid schema import issues
interface SelectImageType {
  id: string;
  itemId: string;
  url: string;
  alt?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Re-export the type explicitly
export type SelectImage = SelectImageType;

export interface ImageLoaderProps {
  itemIds: string[];
  images: Record<string, SelectImage[]>;
  isLoading?: boolean;
  priority?: string[]; // IDs of items that should be loaded with priority
  onImagesLoaded?: () => void;
}

// Image loading performance metrics
interface PerformanceMetrics {
  totalItems: number;
  loadedItems: number;
  loadTime: Record<string, number>; // itemId -> load time in ms
  errorItems: string[];
}

/**
 * Optimized image loader component that uses intersection observer 
 * to efficiently load and cache images with proper prioritization
 */
function ImageLoaderComponent({ 
  itemIds, 
  images, 
  isLoading = false, 
  priority = [],
  onImagesLoaded
}: ImageLoaderProps) {
  const { loadImages, hasImages, invalidateCache } = useImageCache();
  const processedItemsRef = useRef<Set<string>>(new Set());
  const visibleItemsRef = useRef<Set<string>>(new Set());
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalItems: 0,
    loadedItems: 0,
    loadTime: {},
    errorItems: []
  });
  
  // Load initial batch of images
  useEffect(() => {
    if (isLoading || !itemIds.length || !images) return;
    
    // Only load images that haven't been processed yet
    const newItems = itemIds.filter(id => !processedItemsRef.current.has(id));
    
    if (newItems.length > 0) {
      console.log(`[IMAGE-LOADER] Loading images for ${newItems.length} new items`);
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalItems: itemIds.length
      }));
      
      // Start loading images
      const startTime = performance.now();
      
      // Use async/await instead of .then()
      const loadImagesAsync = async () => {
        try {
          await loadImages(newItems);
          const loadTime = performance.now() - startTime;
          console.log(`[IMAGE-LOADER] Loaded ${newItems.length} images in ${loadTime.toFixed(0)}ms`);
          
          // Mark items as processed
          newItems.forEach(id => {
            processedItemsRef.current.add(id);
            
            // Update metrics
            setMetrics(prev => ({
              ...prev,
              loadedItems: prev.loadedItems + 1,
              loadTime: {
                ...prev.loadTime,
                [id]: loadTime / newItems.length // Approximate per-item time
              }
            }));
          });
          
          // If all images are loaded, call the callback
          if (processedItemsRef.current.size === itemIds.length && onImagesLoaded) {
            onImagesLoaded();
          }
        } catch (error) {
          console.error('[IMAGE-LOADER] Error loading images:', error);
          
          // Mark failed items
          newItems.forEach(id => {
            setMetrics(prev => ({
              ...prev,
              errorItems: [...prev.errorItems, id]
            }));
          });
        }
      };

      loadImagesAsync();
    }
  }, [itemIds, images, isLoading, loadImages, onImagesLoaded]);
  
  // Set up intersection observer to track visible items
  useEffect(() => {
    if (isLoading || !itemIds.length) return;
    
    const observeVisibleItems = () => {
      // Disconnect existing observer if any
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
      
      // Create a new IntersectionObserver
      intersectionObserverRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            const itemId = entry.target.getAttribute('data-item-id');
            
            if (!itemId) return;
            
            if (entry.isIntersecting) {
              // Item is visible, prioritize loading its image
              visibleItemsRef.current.add(itemId);
              
              // If not already processed, load the image
              if (!processedItemsRef.current.has(itemId) && !hasImages(itemId)) {
                const startTime = performance.now();
                
                // Use async/await instead of .then()
                const loadSingleImage = async () => {
                  try {
                    await loadImages([itemId]);
                    const loadTime = performance.now() - startTime;
                    
                    // Update metrics
                    setMetrics(prev => ({
                      ...prev,
                      loadedItems: prev.loadedItems + 1,
                      loadTime: {
                        ...prev.loadTime,
                        [itemId]: loadTime
                      }
                    }));
                    
                    processedItemsRef.current.add(itemId);
                  } catch (error) {
                    setMetrics(prev => ({
                      ...prev,
                      errorItems: [...prev.errorItems, itemId]
                    }));
                  }
                };

                loadSingleImage();
              }
            } else {
              // Item is no longer visible
              visibleItemsRef.current.delete(itemId);
            }
          });
        },
        {
          root: null,
          rootMargin: '200px', // Load images when they're 200px from viewport
          threshold: 0.1 // Trigger when at least 10% of the item is visible
        }
      );
      
      // Start observing all item elements
      document.querySelectorAll('[data-item-id]').forEach(el => {
        intersectionObserverRef.current?.observe(el);
      });
    };
    
    // Start observing after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(observeVisibleItems, 100);
    
    return () => {
      clearTimeout(timeoutId);
      intersectionObserverRef.current?.disconnect();
    };
  }, [itemIds, images, isLoading, loadImages, hasImages]);
  
  // Load priority items immediately
  useEffect(() => {
    if (isLoading || !priority.length || !images) return;
    
    console.log(`[IMAGE-LOADER] Priority loading ${priority.length} items`);
    
    // Filter to only load items that haven't been processed yet
    const priorityItems = priority.filter(
      itemId => !processedItemsRef.current.has(itemId) && !hasImages(itemId)
    );
    
    if (priorityItems.length > 0) {
      const startTime = performance.now();
      
      // Use async/await instead of .then()
      const loadPriorityImages = async () => {
        try {
          await loadImages(priorityItems);
          const loadTime = performance.now() - startTime;
          
          priorityItems.forEach(itemId => {
            processedItemsRef.current.add(itemId);
            
            setMetrics(prev => ({
              ...prev,
              loadedItems: prev.loadedItems + 1,
              loadTime: {
                ...prev.loadTime,
                [itemId]: loadTime / priorityItems.length
              }
            }));
          });
        } catch (error) {
          priorityItems.forEach(itemId => {
            setMetrics(prev => ({
              ...prev,
              errorItems: [...prev.errorItems, itemId]
            }));
          });
        }
      };

      loadPriorityImages();
    }
  }, [priority, images, isLoading, loadImages, hasImages]);
  
  // Log performance metrics when component updates
  useEffect(() => {
    if (metrics.loadedItems > 0 && metrics.loadedItems % 10 === 0) {
      const averageLoadTime = Object.values(metrics.loadTime).reduce((sum, time) => sum + time, 0) / 
        Object.values(metrics.loadTime).length;
      
      console.log(`[IMAGE-LOADER] Performance: ${metrics.loadedItems}/${metrics.totalItems} images loaded, avg ${averageLoadTime.toFixed(2)}ms per image, ${metrics.errorItems.length} errors`);
    }
  }, [metrics]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      intersectionObserverRef.current?.disconnect();
    };
  }, []);
  
  // This component doesn't render anything visible
  return null;
}

// Export the component
export { ImageLoaderComponent as ImageLoader };

// Also export as default
const ImageLoader = ImageLoaderComponent;
export default ImageLoader;

// Image size and url transformation utilities
export function getSizedImageUrl(url: string, size: string): string {
  if (!url) return '';
  
  try {
    // Extract file name and extension
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastDotIndex = pathname.lastIndexOf('.');
    
    if (lastDotIndex === -1) {
      // No extension, return as is
      return url;
    }
    
    const extension = pathname.substring(lastDotIndex);
    const basePath = pathname.substring(0, lastDotIndex);
    
    // Construct new URL with size suffix
    urlObj.pathname = `${basePath}-${size}${extension}`;
    return urlObj.toString();
  } catch (e) {
    // Invalid URL, return as is
    return url;
  }
}

// Get responsive image URL based on device width
export function getResponsiveImageUrl(url: string, width: number): string {
  if (!url) return '';
  
  // Determine size based on width
  let size: string;
  if (width <= 320) {
    size = 'sm';
  } else if (width <= 768) {
    size = 'md';
  } else if (width <= 1200) {
    size = 'lg';
  } else {
    size = 'xl';
  }
  
  return getSizedImageUrl(url, size);
} 