/**
 * Item Image Component
 * 
 * Displays an item's primary image with appropriate loading states.
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ImageOff, Package, Loader2 } from 'lucide-react';
import { useImageCache } from '../context/image-cache-context';
import { cn } from '@/lib/utils';

export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large';

export interface ItemImageProps {
  itemId: string;
  size?: ImageSize;
  priority?: boolean;
  isLoading?: boolean;
  className?: string;
  showPlaceholder?: boolean;
}

// Define size dimensions for different image sizes
const imageSizes = {
  thumbnail: { width: 100, height: 100 },
  small: { width: 200, height: 200 },
  medium: { width: 400, height: 400 },
  large: { width: 800, height: 800 },
};

// Changed to default export
export default function ItemImage({
  itemId,
  size = 'medium',
  priority = false,
  isLoading = false,
  className = '',
  showPlaceholder = true,
}: ItemImageProps) {
  const { imageCache } = useImageCache();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Extract the primary image from cache
  const images = imageCache[itemId] || [];
  const primaryImage = images[0];
  const hasImage = images.length > 0 && primaryImage;
  
  // Determine dimensions based on size
  const { width, height } = imageSizes[size];

  // Handle image load success
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };

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
  if (!hasImage || imageError) {
    return showPlaceholder ? (
      <div className={cn(
        "flex flex-col items-center justify-center bg-muted/20 w-full h-full",
        className
      )}>
        {imageError ? (
          <ImageOff className="h-8 w-8 text-muted-foreground mb-2" />
        ) : (
          <Package className="h-8 w-8 text-muted-foreground mb-2" />
        )}
        <span className="text-xs text-muted-foreground">No image</span>
      </div>
    ) : null;
  }

  // Show the actual image
  return (
    <div className={cn("relative w-full h-full", className)}>
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
        </div>
      )}
      <Image
        src={primaryImage.url}
        alt={`Image of ${itemId}`}
        width={width}
        height={height}
        className={cn(
          "object-contain w-full h-full transition-opacity",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
        priority={priority}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
} 