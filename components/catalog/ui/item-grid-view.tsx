import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { Loader2, Eye, ImageOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CatalogItem } from '../utils/schema-adapter';
import { Button } from '@/components/ui/button';
import { getImagesByItemIdAction } from '@/actions/images-actions';
import { SelectImage } from '@/db/schema/images-schema';
import { useImageCache } from '../context/image-cache-context';
import { PlaceholderImage, PLACEHOLDER_IMAGE_PATH } from '@/components/ui/placeholder-image';
import { useRegionContext } from '@/contexts/region-context';
import { vercelImageLoader } from '../utils/image-loader';

interface ItemGridViewProps {
  items: CatalogItem[];
  isLoading: boolean;
  onDelete?: (id: string) => void;
  showSold: boolean;
  loadingItemId?: string | null;
}

// Replace the old placeholder with the new constant
const placeholderImage = PLACEHOLDER_IMAGE_PATH;

export function ItemGridView({
  items,
  isLoading,
  showSold
}: ItemGridViewProps) {
  // State to track image loading status
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const { 
    imageCache, 
    isLoading: isLoadingImages, 
    loadImages,
    hasCompletedLoading,
    hasImages
  } = useImageCache();
  const { formatCurrency } = useRegionContext();

  // Load images when items change
  useEffect(() => {
    if (items.length > 0 && !isLoading) {
      // Extract all item IDs for batch loading
      const itemIds = items.map(item => item.id);
      
      // First load only the important visible items (first 8-12 items)
      const visibleItemIds = itemIds.slice(0, 12);
      
      // Then load the rest after a small delay
      loadImages(visibleItemIds);
      
      // Load the rest after the visible items are processed
      if (itemIds.length > visibleItemIds.length) {
        const remainingItemIds = itemIds.slice(12);
        // Use requestIdleCallback or setTimeout to defer loading of non-visible items
        const loadRemaining = () => {
          console.log('[GRID] Loading remaining', remainingItemIds.length, 'items');
          loadImages(remainingItemIds);
        };
        
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(loadRemaining);
        } else {
          setTimeout(loadRemaining, 1000);
        }
      }
    }
  }, [items, isLoading, loadImages]);

  // Helper function to get the primary image for an item
  const getItemPrimaryImage = useMemo(() => (itemId: string): string => {
    // If we have images from the cache, use the first one
    if (imageCache[itemId] && imageCache[itemId].length > 0) {
      // Get the base URL from Supabase
      const originalUrl = imageCache[itemId][0].url;
      
      // Add a timestamp query parameter for first load to bust Vercel's cache when needed
      // This ensures we always get the latest image if it was updated
      const cacheBuster = new URLSearchParams(window.location.search).get('refresh') ? 
        `?t=${Date.now()}` : '';
      
      return `${originalUrl}${cacheBuster}`;
    }
    
    // Fall back to the item.image field if present
    const item = items.find(i => i.id === itemId);
    if (item && item.image) {
      return item.image;
    }
    
    // Use placeholder if no image is available
    return placeholderImage;
  }, [imageCache, items]);

  const handleImageLoad = (id: string) => {
    console.log(`[GRID] Image loaded for item ${id}`);
    setLoadedImages(prev => ({
      ...prev,
      [id]: true
    }));
  };

  // Add diagnostic effects
  useEffect(() => {
    if (items.length > 0) {
      console.log('[GRID] Items changed, count:', items.length);
    }
  }, [items]);

  useEffect(() => {
    console.log('[GRID] LoadedImages state updated:', Object.keys(loadedImages).length, 'items loaded');
  }, [loadedImages]);

  // Add rendering diagnostics
  const renderImage = (item: CatalogItem) => {
    const itemId = item.id;
    // Use the new hasImages helper from context
    const hasActualImage = hasImages(itemId) || (item.image !== null && item.image !== undefined);
    const isItemLoading = isLoadingImages[itemId];
    const isCompleted = hasCompletedLoading[itemId];
    const isImageLoaded = loadedImages[itemId];

    // Determine if this is a priority image (first 4 items, likely above the fold)
    const isPriority = items.findIndex(i => i.id === itemId) < 4;

    console.log(`[GRID] Rendering image for ${itemId}:`, { 
      hasActualImage, 
      isItemLoading, 
      isImageLoaded,
      isCompleted,
      imageSource: hasActualImage ? 'actual' : 'placeholder',
      isPriority
    });

    // Still loading and not yet determined if has images
    if (isItemLoading || (!isCompleted && !hasActualImage)) {
      return (
        <div className="flex items-center justify-center h-40 w-full bg-muted dark:bg-card/40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground dark:text-primary" />
        </div>
      );
    }

    // Loading completed and we know we have an actual image
    if (hasActualImage) {
      return (
        <div className="relative h-40 w-full overflow-hidden">
          {/* Stable placeholder background during loading to prevent layout shift */}
          <div className="absolute inset-0 bg-muted dark:bg-gray-800"></div>
          
          {/* Loading spinner on top while image is still loading */}
          {!isImageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/70 dark:bg-card/50 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground dark:text-primary" />
            </div>
          )}
          
          {/* The actual image with smoother transitions */}
          <Image
            src={getItemPrimaryImage(itemId)}
            alt={item.name || 'Item image'}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            style={{ objectFit: 'cover' }}
            className={`transition-all duration-500 ${isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.97]'}`}
            onLoadingComplete={() => handleImageLoad(itemId)}
            priority={isPriority}
            loading={isPriority ? 'eager' : 'lazy'}
            quality={75} // Slightly reduced quality for better performance
            unoptimized={false} // Ensure Vercel's image optimization is used
            loader={vercelImageLoader} // Use our custom loader for Vercel's image optimization
          />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 z-20">
            <Button variant="secondary" size="sm" className="gap-1 dark:bg-primary dark:text-foreground dark:hover:bg-primary/80">
              <Eye className="h-4 w-4" /> View Details
            </Button>
          </div>
        </div>
      );
    }

    // Loading completed and we know we don't have an image - show placeholder with consistent size
    return (
      <div className="rounded-md overflow-hidden w-full h-40">
        <PlaceholderImage 
          className="w-full h-full" 
        />
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {isLoading ? (
        Array(10).fill(0).map((_, index) => (
          <Card key={index} className="bg-card dark:bg-card/60 dark:border-border overflow-hidden">
            <div className="h-40 w-full relative">
              <Skeleton className="h-full w-full absolute dark:bg-card/60" />
            </div>
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4 dark:bg-card/60" />
              <Skeleton className="h-4 w-1/2 dark:bg-card/60" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-4 w-1/4 dark:bg-card/60" />
                <Skeleton className="h-4 w-1/4 dark:bg-card/60" />
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        items.map((item) => (
          <Card key={item.id} className="bg-card border-border dark:bg-card/60 dark:border-border relative flex flex-col overflow-hidden">
            <div className="relative">
              <Link href={`/item/${item.id}`}>
                {renderImage(item)}
              </Link>
            </div>

            <CardContent className="p-4 flex-grow">
              <div className="space-y-2">
                <div>
                  <Link href={`/item/${item.id}`} className="font-medium text-sm hover:text-primary dark:text-foreground dark:hover:text-primary transition-colors">
                    {item.name}
                  </Link>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="outline" className="text-xs bg-transparent dark:bg-transparent dark:text-muted-foreground">
                      {item.franchise}
                    </Badge>
                    {item.brand && (
                      <Badge variant="outline" className="text-xs bg-transparent dark:bg-transparent dark:text-muted-foreground">
                        {item.brand}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-end pt-2">
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Cost: <span className="font-medium dark:text-muted-foreground">{formatCurrency(item.cost)}</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground dark:text-purple-400">
                    {formatCurrency(showSold ? (item.soldPrice ?? 0) : item.value)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
} 