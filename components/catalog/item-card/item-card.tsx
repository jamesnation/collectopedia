/**
 * Item Card Component
 * 
 * Displays a single item in the catalog with its image and basic details.
 * Used in both grid and list views.
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ItemImage from '../item-card/item-image';
import { formatCurrency } from '../utils/format-utils';
import { CatalogItem, hasEbayPrice } from '../utils/item-types';
import { useCatalogContext } from '../context/catalog-context';
import { HighlightedText } from '../utils/search-utils';

interface ItemCardProps {
  item: CatalogItem;
  showSold?: boolean;
  loadingItemId?: string | null;
  onClick?: (item: CatalogItem) => void;
  className?: string;
}

export default function ItemCard({
  item,
  showSold = false,
  loadingItemId = null,
  onClick,
  className = '',
}: ItemCardProps) {
  const router = useRouter();
  const { filters } = useCatalogContext();
  const isLoading = loadingItemId === item.id;
  const isSold = item.isSold;
  
  // Handle click on the card
  const handleClick = () => {
    if (onClick) {
      onClick(item);
    } else {
      router.push(`/item/${item.id}`);
    }
  };

  // Format item details
  const formattedValue = formatCurrency(item.value || 0);
  const displayYear = item.year ? `(${item.year})` : '';
  
  return (
    <Card 
      className={`group h-full overflow-hidden transition-all hover:shadow-md ${
        isSold ? 'bg-muted/30 dark:bg-muted/20' : ''
      } ${className}`}
      onClick={handleClick}
      data-item-id={item.id}
    >
      <div className="relative aspect-square overflow-hidden">
        <ItemImage 
          itemId={item.id} 
          size="medium"
          priority={false}
          isLoading={isLoading}
        />
        
        {/* Sold overlay */}
        {isSold && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Badge className="bg-red-500 text-white">Sold</Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-3">
        <div className="space-y-1">
          <h3 className="font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            <HighlightedText
              text={`${item.name} ${displayYear}`}
              searchQuery={filters.search}
            />
          </h3>
          <div className="text-sm text-muted-foreground">
            {item.franchise && (
              <span className="block truncate">
                <HighlightedText
                  text={item.franchise}
                  searchQuery={filters.search}
                />
              </span>
            )}
            <span className="block truncate">
              <HighlightedText
                text={item.type}
                searchQuery={filters.search}
              />
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-3 pt-0 flex justify-between items-center">
        <div className="text-sm font-medium">
          {formattedValue}
        </div>
        {hasEbayPrice(item) && (
          <div className="text-sm text-muted-foreground">
            <span className="text-xs">eBay: </span>
            {formatCurrency(item.ebayPrice || 0)}
          </div>
        )}
      </CardFooter>
    </Card>
  );
} 