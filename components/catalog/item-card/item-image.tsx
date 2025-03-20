/**
 * Item Image Component
 * 
 * Displays an item's primary image with appropriate loading states.
 * Updated to use named exports per TypeScript standards.
 * Enhanced to use React Query for image loading and caching.
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { ImageOff, Package, Loader2 } from 'lucide-react';
import { useImageCache } from '../context/image-cache-context';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '../ui/optimized-image';

export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large';

export interface ItemImageProps {
  itemId: string;
  size?: ImageSize;
  priority?: boolean;
  isLoading?: boolean;
  className?: string;
  showPlaceholder?: boolean;
}

/**
 * Item image component that displays an item's primary image
 * with appropriate loading states using React Query
 */
export function ItemImage({
  itemId,
  size = 'medium',
  priority = false,
  isLoading = false,
  className = '',
  showPlaceholder = true,
}: ItemImageProps) {
  const { imageCache, hasCompletedLoading, invalidateCache } = useImageCache();
  const hasInitiallyLoaded = useRef(false);
  
  // Effect to ensure images are loaded when the component mounts - only once
  useEffect(() => {
    // Only run once per component mount for this specific item
    if (itemId && !hasInitiallyLoaded.current) {
      const shouldLoadImages = !hasCompletedLoading[itemId] || 
                              !imageCache[itemId] || 
                              imageCache[itemId].length === 0;
      
      if (shouldLoadImages) {
        console.log(`[ITEM-IMAGE] Image component mounted for ${itemId}, requesting image load`);
        invalidateCache(itemId);
        hasInitiallyLoaded.current = true;
      }
    }
  }, [itemId]); // Only depend on itemId to avoid loops

  // Extract the primary image from cache
  const images = imageCache[itemId] || [];
  const primaryImage = images[0];
  const hasImage = images.length > 0 && primaryImage;
  
  // Log debug info about image availability, but don't loop
  useEffect(() => {
    if (itemId && !hasImage && !isLoading) {
      console.log(`[ITEM-IMAGE] No image for item ${itemId}, cache state:`, 
        hasCompletedLoading[itemId] ? 'completed loading' : 'not loaded');
    }
  }, [itemId, hasImage]);
  
  // Show loader during item operations
  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted/20 w-full h-full",
        className
      )}>
        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
      </div>
    );
  }

  // Show placeholder if no image is available
  if (!hasImage) {
    return showPlaceholder ? (
      <div className={cn(
        "flex flex-col items-center justify-center bg-muted/20 w-full h-full",
        className
      )}>
        <Package className="h-8 w-8 text-muted-foreground mb-2" />
        <span className="text-xs text-muted-foreground">No image</span>
      </div>
    ) : null;
  }

  // Use OptimizedImage component with React Query integration
  return (
    <OptimizedImage
      src={primaryImage.url}
      alt={`Image of item`}
      size={size}
      priority={priority}
      containerClassName={cn("w-full h-full", className)}
      className="object-contain w-full h-full"
      fallbackSrc="/images/placeholder.jpg"
      fill
    />
  );
} 