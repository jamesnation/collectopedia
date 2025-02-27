import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Eye } from 'lucide-react';
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {isLoading ? (
        // Show skeleton cards when loading
        Array(8).fill(0).map((_, index) => (
          <Card key={index} className="overflow-hidden bg-card dark:bg-gray-900/50 dark:border-gray-800">
            <div className="relative h-52 w-full bg-muted dark:bg-gray-900/80">
              <Skeleton className="h-full w-full dark:bg-gray-800/50" />
            </div>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4 dark:bg-gray-800/50" />
              <div className="flex justify-between mt-2">
                <Skeleton className="h-6 w-1/4 dark:bg-gray-800/50" />
                <Skeleton className="h-6 w-1/4 dark:bg-gray-800/50" />
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        // Show actual items
        items.map((item) => (
          <Card 
            key={item.id} 
            className="group overflow-hidden bg-card dark:bg-gray-900/50 dark:border-gray-800 hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20 dark:hover:border-purple-500/40 hover:-translate-y-1"
          >
            <div className="relative h-52 w-full overflow-hidden bg-muted dark:bg-gray-900/80">
              <Link href={`/item/${item.id}`} className="block h-full">
                {!loadedImages[item.id] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted dark:bg-gray-900/80">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground dark:text-purple-400" />
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
                  <Button variant="secondary" size="sm" className="gap-1 dark:bg-purple-600 dark:text-white dark:hover:bg-purple-700">
                    <Eye className="h-4 w-4" /> View Details
                  </Button>
                </div>
              </Link>
              {item.isSold && (
                <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground dark:bg-red-600/80 dark:text-white z-10">
                  SOLD
                </Badge>
              )}
            </div>
            <CardContent className="p-4">
              <Link href={`/item/${item.id}`} className="block mb-3 font-medium text-primary dark:text-white hover:text-primary/80 dark:hover:text-purple-400 transition-colors">
                {item.name}
              </Link>
              
              <div className="flex justify-between mt-2">
                <div>
                  <div className="text-xs text-muted-foreground dark:text-gray-400">Cost</div>
                  <div className="text-sm font-medium dark:text-gray-300">£{item.cost.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground dark:text-gray-400">{showSold ? 'Sold For' : 'Value'}</div>
                  <div className="text-sm font-bold text-primary dark:text-purple-400">
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