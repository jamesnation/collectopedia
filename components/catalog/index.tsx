/**
 * Catalog Index - Main entry point for the catalog view
 * 
 * This file has been refactored to use a component-based architecture
 * with context for state management and React Query for data fetching.
 * Updated to use named exports per TypeScript standards.
 */

"use client"

import React from 'react'
import { CatalogProvider } from './context/catalog-provider';
import { ImageCacheProvider } from './context/image-cache-context';
import { CatalogPageContent } from './catalog-page';
import { CatalogItem } from './utils/item-types';
import { CatalogQueryProvider } from './catalog-query-provider';

export interface CatalogProps {
  initialItems: CatalogItem[];
  initialTypes: { id: string; name: string }[];
  initialFranchises: { id: string; name: string }[];
  initialBrands: { id: string; name: string }[];
}

/**
 * Main catalog component that wraps everything in context providers
 */
export function Catalog({
  initialItems = [],
  initialTypes = [],
  initialFranchises = [],
  initialBrands = [],
}: CatalogProps) {
  return (
    <CatalogQueryProvider>
      <ImageCacheProvider>
        <CatalogProvider
          initialItems={initialItems}
          initialTypes={initialTypes}
          initialFranchises={initialFranchises}
          initialBrands={initialBrands}
        >
          <CatalogPageContent />
        </CatalogProvider>
      </ImageCacheProvider>
    </CatalogQueryProvider>
  );
}

// Export the main catalog page
export { CatalogPageContent } from './catalog-page';

// Export components for direct use elsewhere
export * from './context/catalog-context';
export * from './context/catalog-provider';
export * from './item-card';
export * from './layout';
export * from './sorting';
export * from './utils'; 