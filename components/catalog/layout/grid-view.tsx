/**
 * Grid View Component
 * 
 * Displays items in a responsive grid layout.
 * Updated to use named exports per TypeScript standards.
 */

'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { ItemCard } from '../item-card';
import { Package } from 'lucide-react';
import { CatalogItem } from '../utils/item-types';

export interface GridViewProps {
  items: CatalogItem[];
  isLoading?: boolean;
  loadingItemId?: string | null;
  showSold?: boolean;
  onItemClick?: (item: CatalogItem) => void;
  gridClassName?: string;
  itemClassName?: string;
}

export function GridView({
  items,
  isLoading = false,
  loadingItemId = null,
  showSold = false,
  onItemClick,
  gridClassName = '',
  itemClassName = '',
}: GridViewProps) {
  // Memoize the item click handler to prevent unnecessary re-renders
  const handleItemClick = useCallback((item: CatalogItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
  }, [onItemClick]);

  // If loading and no items yet, show a loading state
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

  // If no items, show an empty state
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
    <div 
      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 ${gridClassName}`}
    >
      {items.map((item) => (
        <Link 
          key={item.id} 
          href={`/item/${item.id}`} 
          className={`block transition-transform hover:scale-105 ${itemClassName}`}
        >
          <ItemCard
            item={item}
            showSold={showSold}
            loadingItemId={loadingItemId}
            onClick={handleItemClick}
          />
        </Link>
      ))}
    </div>
  );
} 