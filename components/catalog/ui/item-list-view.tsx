import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
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

// Placeholder image for items without images
const placeholderImage = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23CCCCCC'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' alignment-baseline='middle' font-family='sans-serif' fill='%23666666'%3ENo Image%3C/text%3E%3C/svg%3E`;

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

  return (
    <div className="bg-card rounded-lg overflow-hidden border border-border dark:bg-gray-900/50 dark:border-gray-800">
      <Table>
        <TableHeader>
          <TableRow className="border-b dark:border-purple-500/20">
            <TableHead className="w-24">Image</TableHead>
            <TableHead className="w-52">
              <Button 
                variant="ghost" 
                className="font-bold text-primary hover:bg-accent hover:text-accent-foreground dark:text-white dark:hover:text-purple-400"
                onClick={() => onSort('name')}
              >
                Name <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'name' ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TableHead>
            <TableHead className="w-32">
              <Button 
                variant="ghost" 
                className="font-bold text-primary hover:bg-accent hover:text-accent-foreground dark:text-white dark:hover:text-purple-400"
                onClick={() => onSort('acquired')}
              >
                Acquired <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'acquired' ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TableHead>
            <TableHead className="w-24">
              <Button 
                variant="ghost" 
                className="font-bold text-primary hover:bg-accent hover:text-accent-foreground dark:text-white dark:hover:text-purple-400"
                onClick={() => onSort('cost')}
              >
                Cost <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'cost' ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TableHead>
            <TableHead className="w-24">
              <Button 
                variant="ghost" 
                className="font-bold text-primary hover:bg-accent hover:text-accent-foreground dark:text-white dark:hover:text-purple-400"
                onClick={() => onSort(showSold ? 'soldPrice' : 'value')}
              >
                {showSold ? 'Sold For' : 'Value'} <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === (showSold ? 'soldPrice' : 'value') ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TableHead>
            <TableHead className="w-32">
              <Button 
                variant="ghost" 
                className="font-bold text-primary hover:bg-accent hover:text-accent-foreground dark:text-white dark:hover:text-purple-400"
                onClick={() => onSort('ebaySold')}
              >
                eBay Sold <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'ebaySold' ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TableHead>
            <TableHead className="w-32">
              <Button 
                variant="ghost" 
                className="font-bold text-primary hover:bg-accent hover:text-accent-foreground dark:text-white dark:hover:text-purple-400"
                onClick={() => onSort('ebayListed')}
              >
                eBay Listed <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'ebayListed' ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TableHead>
            {showSold && (
              <TableHead className="w-32">
                <Button 
                  variant="ghost" 
                  className="font-bold text-primary hover:bg-accent hover:text-accent-foreground dark:text-white dark:hover:text-purple-400"
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
              <TableRow key={index} className="bg-white hover:bg-purple-50 dark:bg-gray-900/30 dark:hover:bg-gray-900/50 transition-colors">
                <TableCell className="p-2"><Skeleton className="h-20 w-20 dark:bg-gray-800/50" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32 dark:bg-gray-800/50" /></TableCell>
                <TableCell><Skeleton className="h-4 w-36 dark:bg-gray-800/50" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24 dark:bg-gray-800/50" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24 dark:bg-gray-800/50" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16 dark:bg-gray-800/50" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16 dark:bg-gray-800/50" /></TableCell>
                {showSold && <TableCell><Skeleton className="h-4 w-24 dark:bg-gray-800/50" /></TableCell>}
                <TableCell><Skeleton className="h-8 w-8 dark:bg-gray-800/50" /></TableCell>
              </TableRow>
            ))
          ) : (
            items.map((item) => (
              <TableRow key={item.id} className="bg-card hover:bg-muted/50 dark:bg-gray-900/30 dark:hover:bg-gray-900/50 dark:border-purple-500/10 transition-colors">
                <TableCell className="p-2">
                  <Link href={`/item/${item.id}`}>
                    <Image
                      src={item.image || placeholderImage}
                      alt={item.name}
                      width={80}
                      height={80}
                      style={{ objectFit: 'cover' }}
                      className="rounded-md cursor-pointer"
                    />
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Link href={`/item/${item.id}`} className="text-sm font-medium hover:text-primary dark:text-white dark:hover:text-purple-400 transition-colors">
                      {item.name}
                    </Link>
                    <div className="text-sm text-muted-foreground dark:text-gray-400">
                      {item.type}
                    </div>
                    <div className="text-sm text-muted-foreground dark:text-gray-400">
                      {item.franchise}
                    </div>
                    {item.brand && (
                      <div className="text-sm text-muted-foreground dark:text-gray-400">
                        {item.brand}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="dark:text-gray-300">
                  {formatDate(item.acquired)}
                </TableCell>
                <TableCell className="text-right dark:text-gray-300">£{item.cost.toFixed(2)}</TableCell>
                <TableCell className="text-right font-bold text-primary dark:text-purple-400">
                  £{(showSold ? (item.soldPrice ?? 0) : item.value).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <span className="whitespace-nowrap dark:text-gray-300">£{item.ebaySold?.toFixed(2) || 'N/A'}</span>
                    {onEbayRefresh && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEbayRefresh(item.id, item.name, 'sold')}
                        className="h-8 w-8 p-0 dark:text-gray-400 dark:hover:text-purple-400"
                        disabled={loadingSoldItemId === item.id}
                      >
                        {loadingSoldItemId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <span className="whitespace-nowrap dark:text-gray-300">£{item.ebayListed?.toFixed(2) || 'N/A'}</span>
                    {onEbayRefresh && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEbayRefresh(item.id, item.name, 'listed')}
                        className="h-8 w-8 p-0 dark:text-gray-400 dark:hover:text-purple-400"
                        disabled={loadingListedItemId === item.id}
                      >
                        {loadingListedItemId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </TableCell>
                {showSold && (
                  <TableCell className="dark:text-gray-300">{item.soldDate ? formatDate(item.soldDate) : 'N/A'}</TableCell>
                )}
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive-foreground hover:bg-destructive/20 dark:text-red-400 dark:hover:text-white dark:hover:bg-red-500/20"
                        disabled={loadingItemId === item.id}
                      >
                        {loadingItemId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="dark:bg-gray-900/80 dark:border-gray-800">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-white">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-gray-300">
                          This action cannot be undone. This will permanently delete the item from your collection.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:border-purple-500/20">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(item.id)} className="dark:bg-purple-600 dark:hover:bg-purple-700">Delete</AlertDialogAction>
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