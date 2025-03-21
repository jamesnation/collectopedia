/*
 * Updated: Removed the Actions column and delete functionality from the item list view.
 * The delete functionality is still available in the item details page.
 * Added optimization to prevent image reloading when toggling between "show sold" views.
 */

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Trash2, RefreshCw, Loader2, ArrowUpDown, Eye, MoreHorizontal, Edit, Copy } from 'lucide-react';
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
import { useRegionContext } from '@/contexts/region-context';
import { getResponsiveImageUrl } from '../utils/image-loader';
import { toast } from '@/components/ui/use-toast';
import crypto from 'crypto';

interface ItemListViewProps {
  items: CatalogItem[];
  isLoading: boolean;
  sortDescriptor: SortDescriptor;
  onSort: (column: string) => void;
  onEbayRefresh?: (id: string, name: string, type: 'sold' | 'listed') => void;
  showSold: boolean;
  loadingItemId?: string | null;
  loadingListedItemId?: string | null;
  loadingSoldItemId?: string | null;
  onAddItem?: (item: Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean | undefined>;
  deleteItem?: (itemId: string) => Promise<boolean>;
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
  onEbayRefresh,
  showSold,
  loadingItemId,
  loadingListedItemId,
  loadingSoldItemId,
  onAddItem,
  deleteItem
}: ItemListViewProps) {
  const router = useRouter();
  const { formatCurrency } = useRegionContext();
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { 
    imageCache, 
    isLoading: isLoadingImages, 
    loadImages,
    hasCompletedLoading,
    hasImages 
  } = useImageCache();
  
  // NEW: Track previously loaded items to avoid redundant loading
  const loadedItemsRef = useRef<Set<string>>(new Set());
  
  // NEW: Track the last showSold value to detect changes
  const prevShowSoldRef = useRef<boolean>(showSold);

  // Duplicate an item using the onAddItem prop
  const handleDuplicate = async (item: CatalogItem) => {
    if (!onAddItem) {
      console.error('No onAddItem function provided');
      toast({
        title: "Error",
        description: "Cannot duplicate item. Application configuration error.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDuplicating(item.id);
      
      // Create a proper object structure for duplicate item
      const duplicateItemData = {
        userId: item.userId,
        name: `${item.name} Copy`,
        type: item.type,
        franchise: item.franchise,
        brand: item.brand,
        year: item.year,
        acquired: item.acquired instanceof Date ? item.acquired : new Date(item.acquired),
        cost: item.cost,
        value: item.value,
        notes: item.notes || "",
        isSold: item.isSold, // Preserve the sold status from the original item
        image: item.image,
        condition: item.condition || "Used",
        // Include required fields that might be null if not sold
        soldPrice: item.isSold ? item.soldPrice : null,
        soldDate: item.isSold ? item.soldDate : null,
        // Optional fields
        ebayListed: item.ebayListed,
        ebaySold: item.ebaySold,
        // Don't include id, createdAt, or updatedAt as those will be generated
      };
      
      // Use the onAddItem function passed from the parent
      const success = await onAddItem(duplicateItemData);
      
      if (success) {
        toast({
          title: "Item duplicated",
          description: "The item has been duplicated successfully.",
        });
      } else {
        throw new Error('Failed to duplicate item');
      }
    } catch (error) {
      console.error('Error duplicating item:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDuplicating(null);
    }
  };

  // Delete an item using the deleteItem prop
  const handleDelete = async (itemId: string) => {
    if (!deleteItem) {
      console.error('No deleteItem function provided');
      toast({
        title: "Error",
        description: "Cannot delete item. Application configuration error.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDeleting(itemId);
      
      const success = await deleteItem(itemId);
      
      if (success) {
        toast({
          title: "Item deleted",
          description: "The item has been deleted successfully.",
        });
      } else {
        throw new Error('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Load images when items change - optimized for list view and showSold toggle
  useEffect(() => {
    if (items.length > 0 && !isLoading) {
      console.log('[LIST-VIEW] Items or filters changed, checking for new images to load');
      
      // Find items that haven't been loaded yet
      const itemsToLoad = items
        .map(item => item.id)
        .filter(id => !loadedItemsRef.current.has(id));
      
      if (itemsToLoad.length === 0) {
        console.log('[LIST-VIEW] All visible items already requested, skipping load');
        return;
      }
      
      console.log('[LIST-VIEW] Loading', itemsToLoad.length, 'new items');
      
      // Load first 10 items immediately for faster initial render
      const visibleItemIds = itemsToLoad.slice(0, 10);
      loadImages(visibleItemIds);
      
      // Mark these items as loaded
      visibleItemIds.forEach(id => loadedItemsRef.current.add(id));
      
      // Load remaining items after a delay
      if (itemsToLoad.length > 10) {
        const remainingItemIds = itemsToLoad.slice(10);
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
          }, 100);
        }
      }
    }
  // We use items.map(i => i.id).join() to create a stable dependency that only changes when the actual items change
  // This prevents reloads when only showSold changes but the visible items remain the same
  }, [
    items.map(i => i.id).join(),
    isLoading, 
    loadImages
  ]);
  
  // Update the previous showSold ref when it changes
  useEffect(() => {
    // Only log when the value actually changes
    if (prevShowSoldRef.current !== showSold) {
      console.log('[LIST-VIEW] showSold changed from', prevShowSoldRef.current, 'to', showSold);
    }
    prevShowSoldRef.current = showSold;
  }, [showSold]);

  // Optimized image URL getter with thumbnail size
  const getItemPrimaryImage = useMemo(() => (itemId: string): string => {
    if (imageCache[itemId]?.length > 0) {
      return getResponsiveImageUrl(imageCache[itemId][0].url, 'thumbnail');
    }
    
    const item = items.find(i => i.id === itemId);
    if (item?.image) {
      return getResponsiveImageUrl(item.image, 'thumbnail');
    }
    
    return placeholderImage;
  }, [imageCache, items]);

  const handleImageLoad = (id: string) => {
    setLoadedImages(prev => ({
      ...prev,
      [id]: true
    }));
  };

  const renderImage = (item: CatalogItem) => {
    const itemId = item.id;
    const hasActualImage = hasImages(itemId) || (item.image !== null && item.image !== undefined);
    const isItemLoading = isLoadingImages[itemId];
    const isCompleted = hasCompletedLoading[itemId];
    const isImageLoaded = loadedImages[itemId];
    const isPriority = items.indexOf(item) < 5; // Prioritize first 5 items

    if (isItemLoading || (!isCompleted && !hasActualImage)) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-muted dark:bg-card/30">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground dark:text-primary" />
        </div>
      );
    }
    
    if (hasActualImage) {
      return (
        <>
          {!isImageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted dark:bg-card/30 z-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground dark:text-primary" />
            </div>
          )}
          <Image
            src={getItemPrimaryImage(itemId)}
            alt={item.name}
            width={80}
            height={80}
            style={{ objectFit: 'cover' }}
            className={`rounded-md cursor-pointer transition-all duration-300 ${
              isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            onLoad={() => handleImageLoad(itemId)}
            priority={isPriority}
            loading={isPriority ? 'eager' : 'lazy'}
            quality={75}
          />
        </>
      );
    }
    
    return (
      <PlaceholderImage 
        width={80} 
        height={80}
        className="rounded-md"
      />
    );
  };

  return (
    <div className="bg-card rounded-lg overflow-hidden border border-border dark:bg-card/60 dark:border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-b dark:border-border">
            <TableHead className="w-24 text-left">Image</TableHead>
            <TableHead className="w-64 text-left pl-6">
              <Button 
                variant="ghost" 
                className="font-bold text-primary hover:bg-transparent hover:text-purple-400 dark:text-foreground dark:hover:bg-transparent dark:hover:text-purple-400 text-left p-0"
                onClick={() => onSort('name')}
              >
                Name <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'name' ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TableHead>
            <TableHead className="w-40 text-left pl-6">
              <Button 
                variant="ghost" 
                className="font-bold text-primary hover:bg-transparent hover:text-purple-400 dark:text-foreground dark:hover:bg-transparent dark:hover:text-purple-400 text-left p-0"
                onClick={() => onSort('acquired')}
              >
                Acquired <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'acquired' ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TableHead>
            <TableHead className="w-32 text-left pl-6">
              <Button 
                variant="ghost" 
                className="font-bold text-primary hover:bg-transparent hover:text-purple-400 dark:text-foreground dark:hover:bg-transparent dark:hover:text-purple-400 text-left p-0"
                onClick={() => onSort('cost')}
              >
                Cost <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'cost' ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TableHead>
            <TableHead className="w-32 text-left pl-6">
              <Button 
                variant="ghost" 
                className="font-bold text-primary hover:bg-transparent hover:text-purple-400 dark:text-foreground dark:hover:bg-transparent dark:hover:text-purple-400 text-left p-0"
                onClick={() => onSort(showSold ? 'soldPrice' : 'value')}
              >
                {showSold ? 'Sold For' : 'Value'} <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === (showSold ? 'soldPrice' : 'value') ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TableHead>
            <TableHead className="w-40 text-left pl-6">
              <Button 
                variant="ghost" 
                className="font-bold text-primary hover:bg-transparent hover:text-purple-400 dark:text-foreground dark:hover:bg-transparent dark:hover:text-purple-400 text-left p-0"
                onClick={() => onSort('ebayListed')}
              >
                AI Estimate <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'ebayListed' ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TableHead>
            {showSold && (
              <TableHead className="w-40 text-left pl-6">
                <Button 
                  variant="ghost" 
                  className="font-bold text-primary hover:bg-transparent hover:text-purple-400 dark:text-foreground dark:hover:bg-transparent dark:hover:text-purple-400 text-left p-0"
                  onClick={() => onSort('soldDate')}
                >
                  Sold Date <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'soldDate' ? 'opacity-100' : 'opacity-50'}`} />
                </Button>
              </TableHead>
            )}
            {/* Actions column */}
            <TableHead className="w-20 text-right pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array(5).fill(0).map((_, index) => (
              <TableRow key={index} className="bg-white hover:bg-purple-50 dark:bg-card/40 dark:hover:bg-card/60 transition-colors">
                <TableCell className="p-4"><Skeleton className="h-20 w-20 dark:bg-card/60" /></TableCell>
                <TableCell className="pl-6"><Skeleton className="h-4 w-48 dark:bg-card/60" /></TableCell>
                <TableCell className="pl-6"><Skeleton className="h-4 w-36 dark:bg-card/60" /></TableCell>
                <TableCell className="pl-6"><Skeleton className="h-4 w-24 dark:bg-card/60" /></TableCell>
                <TableCell className="pl-6"><Skeleton className="h-4 w-24 dark:bg-card/60" /></TableCell>
                <TableCell className="pl-6"><Skeleton className="h-4 w-24 dark:bg-card/60" /></TableCell>
                {showSold && <TableCell className="pl-6"><Skeleton className="h-4 w-24 dark:bg-card/60" /></TableCell>}
                <TableCell className="pl-6"><Skeleton className="h-8 w-8 dark:bg-card/60" /></TableCell>
              </TableRow>
            ))
          ) : (
            items.map((item) => (
              <TableRow key={item.id} className="bg-card hover:bg-muted/50 dark:bg-card/40 dark:hover:bg-card/60 dark:border-border transition-colors">
                <TableCell className="p-4">
                  <Link href={`/item/${item.id}`}>
                    <div className="relative w-20 h-20">
                      {renderImage(item)}
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="pl-6">
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
                <TableCell className="dark:text-foreground pl-6">
                  {formatDate(item.acquired)}
                </TableCell>
                <TableCell className="dark:text-foreground pl-6">
                  {formatCurrency(item.cost)}
                </TableCell>
                <TableCell className="font-bold text-foreground dark:text-purple-400 pl-6">
                  {formatCurrency(showSold ? (item.soldPrice ?? 0) : item.value)}
                </TableCell>
                <TableCell className="pl-6">
                  <span className="whitespace-nowrap dark:text-foreground">{item.ebayListed ? formatCurrency(item.ebayListed) : 'N/A'}</span>
                </TableCell>
                {showSold && (
                  <TableCell className="dark:text-foreground pl-6">{item.soldDate ? formatDate(item.soldDate) : 'N/A'}</TableCell>
                )}
                {/* Actions cell with dropdown menu */}
                <TableCell className="text-right pr-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/item/${item.id}`)}
                        className="cursor-pointer"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(item)}
                        className="cursor-pointer"
                        disabled={isDuplicating === item.id}
                      >
                        {isDuplicating === item.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onSelect={(e) => e.preventDefault()} // Prevent dropdown from closing
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the item.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(item.id)}
                              disabled={isDeleting === item.id}
                            >
                              {isDeleting === item.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                "Delete"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 