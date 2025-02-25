import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Trash2, RefreshCw, Loader2, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { CatalogItem } from '../utils/schema-adapter';
import { SortDescriptor } from '../hooks/use-catalog-filters';

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
  return (
    <div className="bg-card rounded-lg overflow-hidden border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-24">Image</TableHead>
            <TableHead className="w-1/4">
              <Button 
                variant="ghost" 
                className="font-bold text-primary hover:bg-accent hover:text-accent-foreground"
                onClick={() => onSort('name')}
              >
                Item Details <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'name' ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TableHead>
            <TableHead className="w-32">
              <Button 
                variant="ghost" 
                className="font-bold text-primary hover:bg-accent hover:text-accent-foreground"
                onClick={() => onSort('acquired')}
              >
                Acquired <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'acquired' ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TableHead>
            <TableHead className="w-24 text-right">
              <Button 
                variant="ghost" 
                className="font-bold text-primary hover:bg-accent hover:text-accent-foreground"
                onClick={() => onSort('cost')}
              >
                Cost <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'cost' ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TableHead>
            <TableHead className="w-24 text-right">
              <Button 
                variant="ghost" 
                className="font-bold text-primary hover:bg-accent hover:text-accent-foreground"
                onClick={() => onSort(showSold ? 'soldPrice' : 'value')}
              >
                {showSold ? "Sold Price" : "Value"} <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === (showSold ? 'soldPrice' : 'value') ? 'opacity-100' : 'opacity-50'}`} />
              </Button>
            </TableHead>
            <TableHead className="w-32 text-right">eBay Sold</TableHead>
            <TableHead className="w-32 text-right">eBay Listed</TableHead>
            {showSold && (
              <TableHead className="w-32">
                <Button 
                  variant="ghost" 
                  className="font-bold text-primary hover:bg-accent hover:text-accent-foreground"
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
              <TableRow key={index} className="bg-white hover:bg-purple-50 transition-colors">
                <TableCell className="p-2"><Skeleton className="h-20 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                {showSold && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))
          ) : (
            items.map((item) => (
              <TableRow key={item.id} className="bg-card hover:bg-muted/50 transition-colors">
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
                    <Link href={`/item/${item.id}`} className="text-sm font-medium hover:text-primary transition-colors">
                      {item.name}
                    </Link>
                    <div className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {item.type}
                    </div>
                    <div className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {item.franchise}
                    </div>
                    {item.brand && (
                      <div className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        {item.brand}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {formatDate(item.acquired)}
                </TableCell>
                <TableCell className="text-right">£{item.cost.toFixed(2)}</TableCell>
                <TableCell className="text-right font-bold text-primary">
                  £{(showSold ? (item.soldPrice ?? 0) : item.value).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <span className="whitespace-nowrap">£{item.ebaySold?.toFixed(2) || 'N/A'}</span>
                    {onEbayRefresh && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEbayRefresh(item.id, item.name, 'sold')}
                        className="h-8 w-8 p-0"
                        disabled={loadingSoldItemId === item.id}
                      >
                        {loadingSoldItemId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <span className="whitespace-nowrap">£{item.ebayListed?.toFixed(2) || 'N/A'}</span>
                    {onEbayRefresh && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEbayRefresh(item.id, item.name, 'listed')}
                        className="h-8 w-8 p-0"
                        disabled={loadingListedItemId === item.id}
                      >
                        {loadingListedItemId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </TableCell>
                {showSold && (
                  <TableCell>{item.soldDate ? formatDate(item.soldDate) : 'N/A'}</TableCell>
                )}
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 