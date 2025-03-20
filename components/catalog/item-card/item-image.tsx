/**
 * Item Image Component
 * 
 * Displays an item's primary image with appropriate loading states.
 * Updated to use named exports per TypeScript standards.
 * Enhanced to use React Query for image loading and caching.
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  const { imageCache, loadImages } = useImageCache();
  const refreshAttempted = useRef(false);
  const lastVisibilityChange = useRef(0);
  
  // Use a stable key
  const imgKey = `img-${itemId}`;
  
  // Request images once on mount
  useEffect(() => {
    if (!refreshAttempted.current) {
      refreshAttempted.current = true;
      
      // Just directly load images rather than invalidating
      loadImages([itemId]);
    }
  }, [itemId, loadImages]);
  
  // Handle visibility changes to refresh images when tab becomes visible - with debounce
  useEffect(() => {
    const handleVisibilityChange = () => {
      const now = Date.now();
      
      // Prevent rapid visibility changes (debounce by 1000ms)
      if (now - lastVisibilityChange.current < 1000) {
        return;
      }
      
      lastVisibilityChange.current = now;
      
      if (document.visibilityState === 'visible') {
        // Only refresh if we don't already have images
        if (!imageCache[itemId] || imageCache[itemId].length === 0) {
          loadImages([itemId]);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [itemId, imageCache, loadImages]);

  // Extract the primary image from cache
  const images = imageCache[itemId] || [];
  const primaryImage = images[0];
  const hasImage = images.length > 0 && primaryImage;
  
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
      key={imgKey}
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