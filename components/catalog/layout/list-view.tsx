/**
 * List View Component
 * 
 * Displays items in a table layout with more detailed information.
 */

'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ItemImage } from '../item-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ArrowUpDown, 
  ChevronDown, 
  ChevronUp, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Loader2,
  Eye
} from 'lucide-react';
import { SortOption } from '../context/catalog-context';
import { cn } from '@/lib/utils';
import { CatalogItem } from '../utils/item-types';
import { formatCurrency, formatDate } from '../utils/format-utils';
import { useCatalogContext } from '../context/catalog-context';
import { HighlightedText } from '../utils/search-utils';

interface ListViewProps {
  items: CatalogItem[];
  isLoading?: boolean;
  loadingItemId?: string | null;
  showSold?: boolean;
  sortDescriptor: SortOption;
  onSort: (column: string) => void;
  onEdit?: (item: CatalogItem) => void;
  onDelete?: (item: CatalogItem) => void;
  className?: string;
}

export default function ListView({
  items,
  isLoading = false,
  loadingItemId = null,
  showSold = false,
  sortDescriptor,
  onSort,
  onEdit,
  onDelete,
  className = '',
}: ListViewProps) {
  const router = useRouter();
  const { filters } = useCatalogContext();

  // Handle row click to navigate to item details
  const handleRowClick = useCallback((item: CatalogItem) => {
    router.push(`/item/${item.id}`);
  }, [router]);

  // Handle sort click
  const handleSortClick = useCallback((column: string) => {
    onSort(column);
  }, [onSort]);

  // Handle edit button click
  const handleEditClick = useCallback((e: React.MouseEvent, item: CatalogItem) => {
    e.stopPropagation(); // Prevent row click
    if (onEdit) {
      onEdit(item);
    } else {
      // For now, just navigate to the item page since we don't have an edit page
      router.push(`/item/${item.id}`);
    }
  }, [onEdit, router]);

  // Handle delete button click
  const handleDeleteClick = useCallback((e: React.MouseEvent, item: CatalogItem) => {
    e.stopPropagation(); // Prevent row click
    if (onDelete) {
      onDelete(item);
    }
  }, [onDelete]);

  // Generate sort indicator
  const getSortIndicator = (column: string) => {
    if (sortDescriptor.column !== column) {
      return <ArrowUpDown className="ml-1 h-4 w-4" />;
    }
    
    return sortDescriptor.direction === 'asc' 
      ? <ChevronUp className="ml-1 h-4 w-4" />
      : <ChevronDown className="ml-1 h-4 w-4" />;
  };

  return (
    <div className={cn("w-full overflow-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Image</TableHead>
            
            <TableHead className="cursor-pointer" onClick={() => handleSortClick('name')}>
              <div className="flex items-center">
                Name
                {getSortIndicator('name')}
              </div>
            </TableHead>
            
            <TableHead className="cursor-pointer" onClick={() => handleSortClick('type')}>
              <div className="flex items-center">
                Type
                {getSortIndicator('type')}
              </div>
            </TableHead>
            
            <TableHead className="cursor-pointer" onClick={() => handleSortClick('franchise')}>
              <div className="flex items-center">
                Franchise
                {getSortIndicator('franchise')}
              </div>
            </TableHead>
            
            <TableHead className="cursor-pointer" onClick={() => handleSortClick('year')}>
              <div className="flex items-center">
                Year
                {getSortIndicator('year')}
              </div>
            </TableHead>
            
            <TableHead className="cursor-pointer" onClick={() => handleSortClick('value')}>
              <div className="flex items-center">
                Value
                {getSortIndicator('value')}
              </div>
            </TableHead>
            
            {showSold && (
              <TableHead className="cursor-pointer" onClick={() => handleSortClick('soldPrice')}>
                <div className="flex items-center">
                  Sold Price
                  {getSortIndicator('soldPrice')}
                </div>
              </TableHead>
            )}
            
            <TableHead className="w-20 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {items.map((item) => {
            const isItemLoading = loadingItemId === item.id;
            
            return (
              <TableRow 
                key={item.id}
                className={cn(
                  "cursor-pointer hover:bg-muted/50",
                  item.isSold && "bg-muted/20"
                )}
                onClick={() => handleRowClick(item)}
              >
                <TableCell className="p-2">
                  <div className="relative w-12 h-12 rounded overflow-hidden">
                    <ItemImage 
                      itemId={item.id}
                      size="thumbnail"
                      isLoading={isItemLoading}
                    />
                    {item.isSold && (
                      <Badge className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1">
                        Sold
                      </Badge>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="font-medium">
                    <HighlightedText 
                      text={item.name}
                      searchQuery={filters.search}
                    />
                  </div>
                  {item.brand && (
                    <div className="text-sm text-muted-foreground">
                      <HighlightedText 
                        text={item.brand}
                        searchQuery={filters.search}
                      />
                    </div>
                  )}
                </TableCell>
                
                <TableCell>
                  <HighlightedText 
                    text={item.type}
                    searchQuery={filters.search}
                  />
                </TableCell>
                
                <TableCell>
                  <HighlightedText 
                    text={item.franchise}
                    searchQuery={filters.search}
                  />
                </TableCell>
                
                <TableCell>
                  <HighlightedText 
                    text={item.year ? item.year.toString() : ''}
                    searchQuery={filters.search}
                  />
                </TableCell>
                
                <TableCell>
                  <div className="font-medium">{formatCurrency(item.value || 0)}</div>
                  {item.cost > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Cost: {formatCurrency(item.cost)}
                    </div>
                  )}
                </TableCell>
                
                {showSold && (
                  <TableCell>
                    {item.isSold ? (
                      <div>
                        <div>{formatCurrency(item.soldPrice || 0)}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.soldDate ? formatDate(item.soldDate) : 'Unknown date'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not sold</span>
                    )}
                  </TableCell>
                )}
                
                <TableCell className="text-right">
                  <div className="flex justify-end items-center space-x-1">
                    {isItemLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-blue-500 hover:text-blue-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(item);
                          }}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-amber-500 hover:text-amber-700"
                          onClick={(e) => handleEditClick(e, item)}
                          title="Edit Item"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-700"
                          onClick={(e) => handleDeleteClick(e, item)}
                          title="Delete Item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
} 