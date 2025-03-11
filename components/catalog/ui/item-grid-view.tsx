import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2, Eye, ImageOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CatalogItem } from '../utils/schema-adapter';
import { Button } from '@/components/ui/button';
import { useImageCache } from '../context/image-cache-context';
import { PlaceholderImage, PLACEHOLDER_IMAGE_PATH } from '@/components/ui/placeholder-image';
import { useRegionContext } from '@/contexts/region-context';
import { getResponsiveImageUrl } from '../utils/image-loader';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useImageService } from '@/services/image-service';

interface ItemGridViewProps {
  items: CatalogItem[];
  isLoading: boolean;
  onDelete?: (id: string) => void;
  showSold: boolean;
  loadingItemId?: string | null;
}

const placeholderImage = PLACEHOLDER_IMAGE_PATH;

export function ItemGridView({
  items,
  isLoading,
  showSold
}: ItemGridViewProps) {
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const { 
    imageCache, 
    isLoading: isLoadingImages, 
    loadImages,
    hasCompletedLoading,
    hasImages
  } = useImageCache();
  const { formatCurrency } = useRegionContext();
  const imageService = useImageService();
  
  // Track previously loaded items to avoid redundant loading
  const loadedItemsRef = useRef<Set<string>>(new Set());
  
  // Track the last showSold value to detect changes
  const prevShowSoldRef = useRef<boolean>(showSold);

  // Load images when items change - optimized for grid view
  useEffect(() => {
    if (items.length > 0 && !isLoading) {
      console.log('[GRID-VIEW] Items or filters changed, checking for new images to load');
      
      // Find items that haven't been loaded yet
      const itemsToLoad = items
        .map(item => item.id)
        .filter(id => !loadedItemsRef.current.has(id));
      
      if (itemsToLoad.length === 0) {
        console.log('[GRID-VIEW] All visible items already requested, skipping load');
        return;
      }
      
      console.log('[GRID-VIEW] Loading', itemsToLoad.length, 'new items');
      
      const visibleItemIds = itemsToLoad.slice(0, 20); // Load first 20 items immediately
      
      // Load visible items first
      loadImages(visibleItemIds);
      
      // Mark these items as loaded
      visibleItemIds.forEach(id => loadedItemsRef.current.add(id));
      
      // Load remaining items after a delay
      if (itemsToLoad.length > visibleItemIds.length) {
        const remainingItemIds = itemsToLoad.slice(20);
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => {
            loadImages(remainingItemIds);
            // Mark these items as loaded too
            remainingItemIds.forEach(id => loadedItemsRef.current.add(id));
          });
        } else {
          setTimeout(() => {
            loadImages(remainingItemIds);
            // Mark these items as loaded too
            remainingItemIds.forEach(id => loadedItemsRef.current.add(id));
          }, 300);
        }
      }
    }
  }, [
    items.map(i => i.id).join(),
    isLoading, 
    loadImages
  ]);
  
  // Update the previous showSold ref when it changes
  useEffect(() => {
    // Only log when the value actually changes
    if (prevShowSoldRef.current !== showSold) {
      console.log('[GRID-VIEW] showSold changed from', prevShowSoldRef.current, 'to', showSold);
    }
    prevShowSoldRef.current = showSold;
  }, [showSold]);

  // Get optimized image URL for an item
  const getItemImage = useMemo(() => (itemId: string): string => {
    if (imageCache[itemId]?.length > 0) {
      return imageCache[itemId][0].url;
    }
    
    const item = items.find(i => i.id === itemId);
    if (item?.image) {
      return item.image;
    }
    
    return placeholderImage;
  }, [imageCache, items]);

  const handleImageLoad = (id: string) => {
    setLoadedImages(prev => ({
      ...prev,
      [id]: true
    }));
  };

  // New function to get all images for an item for prefetching
  const getItemImageUrls = (itemId: string): string[] => {
    const urls: string[] = [];
    
    if (imageCache[itemId]?.length > 0) {
      imageCache[itemId].forEach(image => urls.push(image.url));
    }
    
    return urls;
  };

  // Prefetch nearby images for better UX when hovering or viewing
  const prefetchNearbyImages = (currentItemId: string, index: number) => {
    // Get the 3 items before and after the current one
    const startIdx = Math.max(0, index - 3);
    const endIdx = Math.min(items.length - 1, index + 3);
    
    const nearbyItemIds = items
      .slice(startIdx, endIdx + 1)
      .filter(item => item.id !== currentItemId)
      .map(item => item.id);
    
    // Gather URLs for these items
    const nearbyUrls: string[] = [];
    nearbyItemIds.forEach(id => {
      if (imageCache[id]?.length > 0) {
        nearbyUrls.push(getItemImage(id));
      }
    });
    
    // Use image service to prioritize loading these
    if (nearbyUrls.length > 0) {
      nearbyUrls.forEach(url => {
        imageService.preloadImage(url, 80); // Use NEAR_VIEWPORT priority
      });
    }
  };

  const renderImage = (item: CatalogItem, index: number) => {
    const itemId = item.id;
    const hasActualImage = hasImages(itemId) || (item.image !== null && item.image !== undefined);
    const imageUrl = getItemImage(itemId);
    const isPriority = index < 8; // Prioritize first 8 items
    
    // No image available
    if (!hasActualImage || !imageUrl) {
      return (
        <div className="rounded-md overflow-hidden w-full h-60">
          <PlaceholderImage className="w-full h-full" />
        </div>
      );
    }

    // Use our OptimizedImage component
    return (
      <div className="relative h-60 w-full overflow-hidden group">
        <OptimizedImage
          src={imageUrl}
          alt={item.name || 'Item image'}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain transition-all duration-500"
          priority={isPriority}
          size="medium"
          onLoad={() => handleImageLoad(itemId)}
          containerClassName="w-full h-full"
        />
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 z-20"
          onMouseEnter={() => prefetchNearbyImages(itemId, index)}
        >
          <Button variant="secondary" size="sm" className="gap-1 dark:bg-primary dark:text-foreground dark:hover:bg-primary/80">
            <Eye className="h-4 w-4" /> View Details
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {isLoading ? (
        Array(10).fill(0).map((_, index) => (
          <Card key={index} className="bg-card dark:bg-card/60 dark:border-border overflow-hidden">
            <div className="h-60 w-full relative">
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
        items.map((item, index) => (
          <Card key={item.id} className="bg-card border-border dark:bg-card/60 dark:border-border relative flex flex-col overflow-hidden">
            <div 
              className="relative"
              data-item-id={item.id} // Add data attribute for intersection observer
            >
              <Link href={`/item/${item.id}`}>
                {renderImage(item, index)}
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