/**
 * List View Component
 * 
 * Displays items in a table layout with more detailed information.
 * Updated to use named exports per TypeScript standards.
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
  MoreHorizontal, 
  Edit, 
  Trash, 
  ChevronUp, 
  ChevronDown,
  Eye,
  Package,
  Loader2
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '../utils/format-utils';
import { CatalogItem } from '../utils/item-types';
import { SortOption } from '../context/catalog-context';
import { HighlightedText } from '../utils/search-utils';
import { useCatalogContext } from '../context/catalog-context';

export interface ListViewProps {
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

export function ListView({
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
  
  // Handle item view navigation
  const handleViewItem = useCallback((item: CatalogItem) => {
    router.push(`/item/${item.id}`);
  }, [router]);
  
  // Handle edit action
  const handleEditClick = useCallback((item: CatalogItem) => {
    if (onEdit) {
      onEdit(item);
    }
  }, [onEdit]);
  
  // Handle delete action
  const handleDeleteClick = useCallback((item: CatalogItem) => {
    if (onDelete) {
      onDelete(item);
    }
  }, [onDelete]);
  
  // Get sort indicator based on current sort state
  const getSortIndicator = (column: string) => {
    if (sortDescriptor.column !== column) {
      return null;
    }
    
    return sortDescriptor.direction === 'asc' 
      ? <ChevronUp className="ml-2 h-4 w-4" />
      : <ChevronDown className="ml-2 h-4 w-4" />;
  };
  
  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <Package className="w-12 h-12 animate-pulse text-gray-400" />
          <p className="mt-4 text-gray-500">Loading items...</p>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
        <Package className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400 mb-2">
          No items found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          Try adjusting your filters to see more items.
        </p>
      </div>
    );
  }
  
  return (
    <div className={`w-full overflow-auto ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead style={{ width: 60 }}></TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => onSort('name')}
            >
              <div className="flex items-center">
                Name
                {getSortIndicator('name')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => onSort('type')}
            >
              <div className="flex items-center">
                Type
                {getSortIndicator('type')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => onSort('franchise')}
            >
              <div className="flex items-center">
                Franchise
                {getSortIndicator('franchise')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => onSort('year')}
            >
              <div className="flex items-center">
                Year
                {getSortIndicator('year')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => onSort('acquired')}
            >
              <div className="flex items-center">
                Acquired
                {getSortIndicator('acquired')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary text-right"
              onClick={() => onSort('cost')}
            >
              <div className="flex items-center justify-end">
                Cost
                {getSortIndicator('cost')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary text-right"
              onClick={() => onSort('value')}
            >
              <div className="flex items-center justify-end">
                Value
                {getSortIndicator('value')}
              </div>
            </TableHead>
            {showSold && (
              <TableHead 
                className="cursor-pointer hover:text-primary text-right"
                onClick={() => onSort('soldPrice')}
              >
                <div className="flex items-center justify-end">
                  Sold Price
                  {getSortIndicator('soldPrice')}
                </div>
              </TableHead>
            )}
            <TableHead style={{ width: 60 }}></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isItemLoading = loadingItemId === item.id;
            const isSold = item.isSold;
            const yearDisplay = item.year || '-';
            
            return (
              <TableRow 
                key={item.id}
                className={cn(
                  "cursor-pointer hover:bg-secondary/20",
                  isSold && "bg-muted/30 dark:bg-muted/20",
                  isItemLoading && "opacity-50"
                )}
                onClick={() => handleViewItem(item)}
              >
                <TableCell className="p-2">
                  <div className="relative w-12 h-12 rounded overflow-hidden">
                    {isItemLoading ? (
                      <div className="w-full h-full flex items-center justify-center bg-muted/20">
                        <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                      </div>
                    ) : (
                      <ItemImage 
                        itemId={item.id} 
                        size="thumbnail" 
                        priority={false}
                      />
                    )}
                    {isSold && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Badge className="bg-red-500 text-white text-xs">Sold</Badge>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <HighlightedText
                    text={item.name}
                    searchQuery={filters.search}
                    highlightClassName="bg-yellow-200 dark:bg-yellow-800 font-medium"
                  />
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
                <TableCell>{yearDisplay}</TableCell>
                <TableCell>{formatDate(item.acquired)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.cost)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.value)}</TableCell>
                {showSold && (
                  <TableCell className="text-right">
                    {isSold && item.soldPrice ? formatCurrency(item.soldPrice) : '-'}
                  </TableCell>
                )}
                <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        disabled={isItemLoading}
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem 
                          onClick={() => handleViewItem(item)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          <span>View Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleEditClick(item)}
                          disabled={!onEdit || isItemLoading}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(item)}
                          disabled={!onDelete || isItemLoading}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
} 