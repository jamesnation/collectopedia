/**
 * OptimizedImage Component
 * 
 * A drop-in replacement for Next.js Image component with enhanced features:
 * - Integration with React Query for caching
 * - Progressive loading with placeholder support
 * - Intersection Observer for viewport detection
 * - Priority-based loading
 * - Enhanced error handling
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import { useOptimizedImage } from '../hooks/use-image-query';

// Add specific props for our optimized image
interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined;
  size?: 'thumbnail' | 'small' | 'medium' | 'large';
  fallbackSrc?: string;
  containerClassName?: string;
}

/**
 * Enhanced image component that integrates with our React Query image system
 * with improved error handling
 */
export function OptimizedImage({
  src,
  alt,
  size = 'medium',
  fallbackSrc = '/images/placeholder.jpg',
  containerClassName,
  className,
  priority: nextPriority,
  ...props
}: OptimizedImageProps) {
  const [isIntersecting, setIsIntersecting] = useState(!!nextPriority);
  const [imgError, setImgError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  
  // Convert Next.js priority to our priority system
  const loadPriority = nextPriority ? 100 : (isIntersecting ? 80 : 40);
  
  // Parse the item ID from the src URL if it's a Supabase URL - stabilize with useRef
  const itemIdRef = useRef<string | null>(null);
  if (!itemIdRef.current && src?.includes('/items/')) {
    itemIdRef.current = src.split('/items/')[1]?.split('/')[0] || null;
  }
  
  const itemId = itemIdRef.current;
  
  // Use our optimized image hook
  const { url, isLoading, isLoaded, hasError } = useOptimizedImage(
    src,
    size,
    loadPriority
  );
  
  // Update component loading state when hook reports loading complete - with useCallback
  const updateImageLoaded = useCallback(() => {
    if (!imageLoaded) {
      setImageLoaded(true);
    }
  }, [imageLoaded]);
  
  useEffect(() => {
    if (isLoaded && !imageLoaded) {
      updateImageLoaded();
    }
  }, [isLoaded, imageLoaded, updateImageLoaded]);
  
  // Log issues with image loading
  useEffect(() => {
    if (hasError && src) {
      console.warn(`[OPTIMIZED-IMAGE] Failed to load image from React Query cache: ${src}`);
    }
  }, [hasError, src]);
  
  // Reset error state if src changes
  useEffect(() => {
    setImgError(false);
    setImageLoaded(false);
  }, [src]);
  
  // Set up intersection observer with stable callback
  useEffect(() => {
    // Skip if already prioritized or no ref
    if (nextPriority || !imageRef.current) return;
    
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setIsIntersecting(true);
      }
    };
    
    const observer = new IntersectionObserver(
      handleIntersection,
      {
        rootMargin: '200px', // Start loading before it enters viewport
        threshold: 0.1
      }
    );
    
    observer.observe(imageRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [nextPriority]);
  
  // Handle Next.js Image error - with useCallback
  const handleImageError = useCallback(() => {
    setImgError(true);
  }, []);
  
  // Handle image load success - with useCallback
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);
  
  // Determine image state class
  const imageStateClass = isLoading ? 'animate-pulse' : 
                         (hasError || imgError) ? 'opacity-50' : 
                         isLoaded || imageLoaded ? 'opacity-100' : 
                         'opacity-0';
  
  // Handle missing or error state
  const imageSrc = url && !hasError && !imgError ? url : fallbackSrc;
  
  return (
    <div 
      ref={imageRef}
      className={cn(
        'relative overflow-hidden bg-muted/20',
        containerClassName
      )}
    >
      <Image
        src={imageSrc}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          imageStateClass,
          className
        )}
        priority={nextPriority}
        onError={handleImageError}
        onLoad={handleImageLoad}
        {...props}
      />
      
      {/* Loading indicator */}
      {(isLoading && !isLoaded && !imageLoaded && !imgError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      )}
      
      {/* Error state */}
      {(hasError || imgError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/40 text-muted-foreground">
          <span className="text-xs">Failed to load image</span>
        </div>
      )}
    </div>
  );
}

export default OptimizedImage; 