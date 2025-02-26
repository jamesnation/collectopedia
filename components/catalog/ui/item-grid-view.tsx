import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { CatalogItem } from '../utils/schema-adapter';

interface ItemGridViewProps {
  items: CatalogItem[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onEbayRefresh?: (id: string, name: string, type: 'sold' | 'listed') => void;
  showSold: boolean;
  loadingItemId?: string | null;
  loadingListedItemId?: string | null;
  loadingSoldItemId?: string | null;
}

// Placeholder image for items without images
const placeholderImage = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23CCCCCC'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' alignment-baseline='middle' font-family='sans-serif' fill='%23666666'%3ENo Image%3C/text%3E%3C/svg%3E`;

export function ItemGridView({
  items,
  isLoading,
  onDelete,
  showSold,
  loadingItemId
}: ItemGridViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {isLoading ? (
        // Show skeleton cards when loading
        Array(8).fill(0).map((_, index) => (
          <Card key={index} className="overflow-hidden bg-card">
            <div className="relative h-52 w-full bg-muted">
              <Skeleton className="h-full w-full" />
            </div>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <div className="flex justify-between mt-2">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-6 w-1/4" />
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        // Show actual items
        items.map((item) => (
          <Card key={item.id} className="overflow-hidden bg-card hover:shadow-md transition-shadow border border-border">
            <div className="relative h-52 w-full overflow-hidden bg-muted">
              <Link href={`/item/${item.id}`}>
                <Image
                  src={item.image || placeholderImage}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                  className="cursor-pointer transition-transform hover:scale-105"
                />
              </Link>
              {item.isSold && (
                <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground">
                  SOLD
                </Badge>
              )}
            </div>
            <CardContent className="p-4">
              <Link href={`/item/${item.id}`} className="block mb-3 font-medium text-primary hover:text-primary/80 transition-colors">
                {item.name}
              </Link>
              
              <div className="flex justify-between mt-2">
                <div>
                  <div className="text-xs text-muted-foreground">Cost</div>
                  <div className="text-sm font-medium">£{item.cost.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{showSold ? 'Sold For' : 'Value'}</div>
                  <div className="text-sm font-bold text-primary">
                    £{(showSold ? (item.soldPrice ?? 0) : item.value).toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-3 pt-0 flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive-foreground hover:bg-destructive/20"
                    disabled={loadingItemId === item.id}
                  >
                    {loadingItemId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the item from your collection.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(item.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );
} 