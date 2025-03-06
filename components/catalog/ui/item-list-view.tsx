import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { Trash2, RefreshCw, Loader2, ArrowUpDown, Eye, MoreHorizontal, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { CatalogItem } from '../utils/schema-adapter';
import { SortDescriptor } from '../hooks/use-catalog-filters';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { getImagesByItemIdAction } from '@/actions/images-actions';
import { SelectImage } from '@/db/schema/images-schema';
import { useImageCache } from '../context/image-cache-context';
import { PlaceholderImage, PLACEHOLDER_IMAGE_PATH } from '@/components/ui/placeholder-image';

interface ItemListViewProps {
  items: CatalogItem[];
  isLoading: boolean;
  sortDescriptor: SortDescriptor;
  onSort: (column: string) => void;
  onDelete: (id: string) => void;
  onEbayRefresh?: (id: string, name: string, type: 'sold' | 'listed') => void;
  showSold: boolean;
  loadingItemId?: string | null;
  loadingListedItemId?: string | null;
  loadingSoldItemId?: string | null;
}

// Helper function to format dates consistently
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Replace the old placeholder with the new constant
const placeholderImage = PLACEHOLDER_IMAGE_PATH;

export function ItemListView({
  items,
  isLoading,
  sortDescriptor,
  onSort,
  onDelete,
  onEbayRefresh,
  showSold,
  loadingItemId,
  loadingListedItemId,
  loadingSoldItemId
}: ItemListViewProps) {
  const router = useRouter();
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const { 
    imageCache, 
    isLoading: isLoadingImages, 
    loadImages,
    hasCompletedLoading,
    hasImages 
  } = useImageCache();

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
    console.log(`[LIST] Image loaded for item ${id}`);
    setLoadedImages(prev => ({
      ...prev,
      [id]: true
    }));
  };

  // Add a diagnostic effect to log state changes
  useEffect(() => {
    if (items.length > 0) {
      console.log('[LIST] Items changed, count:', items.length);
    }
  }, [items]);

  useEffect(() => {
    console.log('[LIST] LoadedImages state updated:', Object.keys(loadedImages).length, 'items loaded');
  }, [loadedImages]);

  // Add rendering diagnostics
  const renderImage = (item: CatalogItem) => {
    const itemId = item.id;
    // Use the new hasImages helper from context
    const hasActualImage = hasImages(itemId) || (item.image !== null && item.image !== undefined);
    const isItemLoading = isLoadingImages[itemId];
    const isCompleted = hasCompletedLoading[itemId];
    const isImageLoaded = loadedImages[itemId];

    console.log(`[LIST] Rendering image for ${itemId}:`, { 
      hasActualImage, 
      isItemLoading, 
      isImageLoaded,
      isCompleted,
      imageSource: hasActualImage ? 'actual' : 'placeholder'
    });

    // Still loading and not yet determined if has images
    if (isItemLoading || (!isCompleted && !hasActualImage)) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-muted dark:bg-card/30">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground dark:text-primary" />
        </div>
      );
    }
    
    // Loading completed and we know we have an actual image
    if (hasActualImage) {
      return (
        <>
          {!isImageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted dark:bg-card/30 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground dark:text-primary" />
            </div>
          )}
          <Image
            src={getItemPrimaryImage(itemId)}
            alt={item.name}
            width={80}
            height={80}
            style={{ objectFit: 'cover' }}
            className={`rounded-md cursor-pointer transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => handleImageLoad(itemId)}
          />
        </>
      );
    }
    
    // Loading completed and we know we don't have an image - show placeholder
    return (
      <PlaceholderImage 
        width={80} 
        height={80}
      />
    );
  };

  return (
    <div className="bg-card rounded-lg overflow-hidden border border-border dark:bg-card/60 dark:border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-b dark:border-border">
            <TableHead className="w-24">Image</TableHead>
            <TableHead className="w-52">
              <Button 
                variant="ghost" 
                className="font-bold text-primary hover:bg-transparent hover:text-purple-400 dark:text-foreground dark:hover:bg-transparent dark:hover:text-purple-400"
                onClick={() => onSort('name')}
              >
                Name <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'name' ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TableHead>
            <TableHead className="w-32">
              <Button 
                variant="ghost" 
                className="font-bold text-primary hover:bg-transparent hover:text-purple-400 dark:text-foreground dark:hover:bg-transparent dark:hover:text-purple-400"
                onClick={() => onSort('acquired')}
              >
                Acquired <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'acquired' ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TableHead>
            <TableHead className="w-24">
              <Button 
                variant="ghost" 
                className="font-bold text-primary hover:bg-transparent hover:text-purple-400 dark:text-foreground dark:hover:bg-transparent dark:hover:text-purple-400"
                onClick={() => onSort('cost')}
              >
                Cost <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'cost' ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TableHead>
            <TableHead className="w-24">
              <Button 
                variant="ghost" 
                className="font-bold text-primary hover:bg-transparent hover:text-purple-400 dark:text-foreground dark:hover:bg-transparent dark:hover:text-purple-400"
                onClick={() => onSort(showSold ? 'soldPrice' : 'value')}
              >
                {showSold ? 'Sold For' : 'Value'} <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === (showSold ? 'soldPrice' : 'value') ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TableHead>
            <TableHead className="w-32">
              <Button 
                variant="ghost" 
                className="font-bold text-primary hover:bg-transparent hover:text-purple-400 dark:text-foreground dark:hover:bg-transparent dark:hover:text-purple-400"
                onClick={() => onSort('ebayListed')}
              >
                AI Estimate <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'ebayListed' ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TableHead>
            {showSold && (
              <TableHead className="w-32">
                <Button 
                  variant="ghost" 
                  className="font-bold text-primary hover:bg-transparent hover:text-purple-400 dark:text-foreground dark:hover:bg-transparent dark:hover:text-purple-400"
                  onClick={() => onSort('soldDate')}
                >
                  Sold Date <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'soldDate' ? 'opacity-100' : 'opacity-50'}`} />
                </Button>
              </TableHead>
            )}
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array(5).fill(0).map((_, index) => (
              <TableRow key={index} className="bg-white hover:bg-purple-50 dark:bg-card/40 dark:hover:bg-card/60 transition-colors">
                <TableCell className="p-2"><Skeleton className="h-20 w-20 dark:bg-card/60" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32 dark:bg-card/60" /></TableCell>
                <TableCell><Skeleton className="h-4 w-36 dark:bg-card/60" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24 dark:bg-card/60" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24 dark:bg-card/60" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16 dark:bg-card/60" /></TableCell>
                {showSold && <TableCell><Skeleton className="h-4 w-24 dark:bg-card/60" /></TableCell>}
                <TableCell><Skeleton className="h-8 w-8 dark:bg-card/60" /></TableCell>
              </TableRow>
            ))
          ) : (
            items.map((item) => (
              <TableRow key={item.id} className="bg-card hover:bg-muted/50 dark:bg-card/40 dark:hover:bg-card/60 dark:border-border transition-colors">
                <TableCell className="p-2">
                  <Link href={`/item/${item.id}`}>
                    <div className="relative w-20 h-20">
                      {renderImage(item)}
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Link href={`/item/${item.id}`} className="text-sm font-medium hover:text-primary dark:text-foreground dark:hover:text-primary transition-colors">
                      {item.name}
                    </Link>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                      {item.type}
                    </div>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                      {item.franchise}
                    </div>
                    {item.brand && (
                      <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                        {item.brand}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="dark:text-foreground">
                  {formatDate(item.acquired)}
                </TableCell>
                <TableCell className="text-right dark:text-foreground">£{item.cost.toFixed(2)}</TableCell>
                <TableCell className="text-right font-bold text-foreground dark:text-purple-400">
                  £{(showSold ? (item.soldPrice ?? 0) : item.value).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end">
                    <span className="whitespace-nowrap dark:text-foreground">£{item.ebayListed?.toFixed(2) || 'N/A'}</span>
                  </div>
                </TableCell>
                {showSold && (
                  <TableCell className="dark:text-foreground">{item.soldDate ? formatDate(item.soldDate) : 'N/A'}</TableCell>
                )}
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive-foreground hover:bg-destructive/20 dark:text-destructive dark:hover:text-destructive-foreground dark:hover:bg-destructive/20"
                        disabled={loadingItemId === item.id}
                      >
                        {loadingItemId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="dark:bg-card dark:border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-foreground">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-muted-foreground">
                          This action cannot be undone. This will permanently delete the item from your collection.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-card/50 dark:text-foreground dark:hover:bg-card/80 dark:border-border">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(item.id)} className="dark:bg-primary dark:hover:bg-primary/80">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 