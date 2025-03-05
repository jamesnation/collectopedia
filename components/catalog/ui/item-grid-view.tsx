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

interface ItemGridViewProps {
  items: CatalogItem[];
  isLoading: boolean;
  onDelete?: (id: string) => void;
  showSold: boolean;
  loadingItemId?: string | null;
}

// Placeholder image for items without images
const placeholderImage = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23CCCCCC'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' alignment-baseline='middle' font-family='sans-serif' fill='%23666666'%3ENo Image%3C/text%3E%3C/svg%3E`;

export function ItemGridView({
  items,
  isLoading,
  showSold
}: ItemGridViewProps) {
  // State to track image loading status
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const { imageCache, isLoading: isLoadingImages, loadImages } = useImageCache();

  // Load images when items change
  useEffect(() => {
    if (items.length > 0 && !isLoading) {
      // Extract all item IDs for batch loading
      const itemIds = items.map(item => item.id);
      loadImages(itemIds);
    }
  }, [items, isLoading, loadImages]);

  // Helper function to get the primary image for an item
  const getItemPrimaryImage = useMemo(() => (itemId: string): string => {
    // If we have images from the cache, use the first one
    if (imageCache[itemId] && imageCache[itemId].length > 0) {
      return imageCache[itemId][0].url;
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
    setLoadedImages(prev => ({
      ...prev,
      [id]: true
    }));
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
                {isLoadingImages[item.id] ? (
                  <div className="flex items-center justify-center h-40 w-full bg-muted dark:bg-card/40">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground dark:text-primary" />
                  </div>
                ) : (
                  <div className="relative h-40 w-full overflow-hidden">
                    {!loadedImages[item.id] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted dark:bg-card/30">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground dark:text-primary" />
                      </div>
                    )}
                    <Image
                      src={getItemPrimaryImage(item.id)}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                      className={`transition-all duration-300 group-hover:scale-110 ${loadedImages[item.id] ? 'opacity-100' : 'opacity-0'}`}
                      onLoadingComplete={() => handleImageLoad(item.id)}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button variant="secondary" size="sm" className="gap-1 dark:bg-primary dark:text-foreground dark:hover:bg-primary/80">
                        <Eye className="h-4 w-4" /> View Details
                      </Button>
                    </div>
                  </div>
                )}
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
                    Cost: <span className="font-medium dark:text-muted-foreground">£{item.cost.toFixed(2)}</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground dark:text-purple-400">
                    £{(showSold ? (item.soldPrice ?? 0) : item.value).toFixed(2)}
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