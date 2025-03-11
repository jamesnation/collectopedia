/*
 * Optimized Image Component
 * 
 * This component uses the unified image service to load and display images
 * with optimizations for performance and mobile devices.
 */

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { useImageService } from '@/services/image-service';
import { cn } from '@/lib/utils';

type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large';

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'loader'> {
  src: string;
  size?: ImageSize;
  priority?: boolean;
  fallbackSrc?: string;
  className?: string;
  containerClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * A performance-optimized image component that uses the unified image service
 * to efficiently load, cache, and display images
 */
export function OptimizedImage({
  src,
  size = 'medium',
  priority = false,
  fallbackSrc,
  alt,
  className,
  containerClassName,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const imageService = useImageService();
  const [isError, setIsError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  // Determine the actual image URL and loading state
  const { url, isLoading, isLoaded, hasError } = imageService.loadImage(
    src,
    size,
    priority ? 100 : 40 // Use priority values from the service
  );
  
  // Update error state when the image service reports an error
  useEffect(() => {
    if (hasError) {
      setIsError(true);
      onError?.();
    }
  }, [hasError, onError]);
  
  // Update loaded state when the image service reports it's loaded
  useEffect(() => {
    if (isLoaded && !hasLoaded) {
      setHasLoaded(true);
      onLoad?.();
    }
  }, [isLoaded, hasLoaded, onLoad]);
  
  // Set up intersection observer to mark when the image is visible
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
          // When it becomes visible, prioritize this image
          if (url) {
            imageService.prioritizeVisibleImages([src]);
          }
          // Disconnect observer once we've detected visibility
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: '100px', // Load images slightly before they enter viewport
        threshold: 0.1       // Trigger when at least 10% of the element is visible
      }
    );
    
    // Create a ref element to observe
    const element = document.getElementById(`image-${src.replace(/[^a-zA-Z0-9]/g, '-')}`);
    if (element) {
      observer.observe(element);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [src, url, imageService]);
  
  // Determine what source to use
  const actualSrc = isError && fallbackSrc ? fallbackSrc : url;
  
  return (
    <div 
      id={`image-${src.replace(/[^a-zA-Z0-9]/g, '-')}`}
      className={cn("relative overflow-hidden", containerClassName)}
    >
      {/* Show skeleton loader while image is loading */}
      {(!hasLoaded && !isError) && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {/* The actual image */}
      {actualSrc && (
        <Image
          src={actualSrc}
          alt={alt || ""}
          className={cn(
            "transition-opacity duration-300",
            hasLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          onLoad={() => {
            setHasLoaded(true);
            onLoad?.();
          }}
          onError={() => {
            setIsError(true);
            onError?.();
          }}
          {...props}
        />
      )}
      
      {/* Error state */}
      {isError && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <span className="text-muted-foreground text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
}

export default OptimizedImage; 