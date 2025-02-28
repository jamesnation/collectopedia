import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Eye, ImageOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CatalogItem } from '../utils/schema-adapter';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

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

  const handleImageLoad = (id: string) => {
    setLoadedImages(prev => ({
      ...prev,
      [id]: true
    }));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {isLoading ? (
        Array(10)
          .fill(0)
          .map((_, index) => (
            <Card key={index} className="bg-card border-border dark:bg-card/60 dark:border-border relative flex flex-col overflow-hidden">
              <div className="relative">
                <Skeleton className="h-40 w-full dark:bg-card/60" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground dark:text-primary" />
                </div>
              </div>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-40 mb-3 dark:bg-card/60" />
                <div className="flex justify-between mt-2">
                  <div>
                    <Skeleton className="h-3 w-10 mb-1 dark:bg-card/60" />
                    <Skeleton className="h-4 w-16 dark:bg-card/60" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-10 mb-1 dark:bg-card/60" />
                    <Skeleton className="h-4 w-16 dark:bg-card/60" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
      ) : (
        items.map((item) => (
          <Card key={item.id} className="bg-card border-border dark:bg-card/60 dark:border-border relative flex flex-col overflow-hidden">
            <div className="relative">
              <Link href={`/item/${item.id}`}>
                {item.image ? (
                  <div className="relative h-40 w-full overflow-hidden">
                    {!loadedImages[item.id] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted dark:bg-card/30">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground dark:text-primary" />
                      </div>
                    )}
                    <Image
                      src={item.image || placeholderImage}
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
                ) : (
                  <div className="flex items-center justify-center h-40 w-full bg-muted dark:bg-card/40">
                    <ImageOff className="h-8 w-8 text-muted-foreground dark:text-muted-foreground" />
                  </div>
                )}
                {item.isSold && (
                  <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground dark:bg-destructive dark:text-destructive-foreground z-10">
                    SOLD
                  </Badge>
                )}
              </Link>
            </div>
            <CardContent className="p-4">
              <Link href={`/item/${item.id}`} className="block mb-3 font-medium text-primary dark:text-foreground hover:text-primary/80 dark:hover:text-primary transition-colors">
                {item.name}
              </Link>
              
              <div className="flex justify-between mt-2">
                <div>
                  <div className="text-xs text-muted-foreground dark:text-muted-foreground">Cost</div>
                  <div className="text-sm font-medium dark:text-foreground">£{item.cost.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground dark:text-muted-foreground">{showSold ? 'Sold For' : 'Value'}</div>
                  <div className="text-sm font-bold text-primary dark:text-primary">
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