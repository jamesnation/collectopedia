/**
 * Catalog Provider - Provides the CatalogContext to children
 * 
 * This component sets up all the state and handlers needed for the catalog,
 * combining the functionality from various hooks into a unified context.
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import CatalogContext, { FilterState, SortOption } from './catalog-context';
import { useCatalogItems } from '../hooks/use-catalog-items';
import { useCatalogFilters } from '../hooks/use-catalog-filters';
import { useCustomEntities } from '../hooks/use-custom-entities';
import { useImageCache } from './image-cache-context';
import { CatalogItem } from '../utils/item-types';
import { ensureCompatibleItems } from '../utils/schema-adapter';

// Default values
const initialFilters: FilterState = {
  search: '',
  type: '',
  franchise: '',
  year: '',
  showSold: false,
  soldYear: '',
  showWithImages: false,
};

const defaultSort: SortOption = {
  column: 'createdAt',
  direction: 'desc',
};

interface CatalogProviderProps {
  children: React.ReactNode;
  initialItems?: CatalogItem[];
  initialTypes?: { id: string; name: string }[];
  initialFranchises?: { id: string; name: string }[];
  initialBrands?: { id: string; name: string }[];
}

export function CatalogProvider({
  children,
  initialItems = [],
  initialTypes = [],
  initialFranchises = [],
  initialBrands = [],
}: CatalogProviderProps) {
  // View and pagination state
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  
  // Force fetch on first mount
  const [firstLoadCompleted, setFirstLoadCompleted] = useState(false);
  
  // Initialize hooks with initial data, ensuring type compatibility
  const { 
    items, 
    isLoading,
    loadingItemId,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    setItems
  } = useCatalogItems({ 
    initialItems: ensureCompatibleItems(initialItems)
  } as any);

  // Debug: log items from useCatalogItems - only log in development
  useEffect(() => {
    console.log('[CATALOG-PROVIDER] Items count:', items.length);
    console.log('[CATALOG-PROVIDER] isLoading:', isLoading);
    console.log('[CATALOG-PROVIDER] Is items array an array?', Array.isArray(items));
    
    if (items.length > 0) {
      console.log('[CATALOG-PROVIDER] First few items:', items.slice(0, 3).map(item => ({
        id: item.id,
        name: item.name
      })));
    }
  }, [items, isLoading]);

  const {
    customTypes,
    loadCustomTypes,
    customFranchises,
    loadCustomFranchises,
    customBrands,
    loadCustomBrands,
  } = useCustomEntities({
    initialTypes,
    initialFranchises,
    initialBrands
  });

  // Image cache for item images
  const { 
    imageCache, 
    isLoading: isLoadingImages, 
    loadImages
  } = useImageCache();

  // Filter and sort state
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [sortBy, setSortBy] = useState<SortOption>(defaultSort);

  // Log the current filters and sort state
  useEffect(() => {
    console.log('[CATALOG-PROVIDER] Current filters:', filters);
    console.log('[CATALOG-PROVIDER] Current sort:', sortBy);
  }, [filters, sortBy]);

  // Memoize the parameters sent to useCatalogFilters to prevent unnecessary rerenders
  const filterParams = useMemo(() => {
    console.log('[CATALOG-PROVIDER] Creating filter params with showSold =', filters.showSold);
    return {
      items: ensureCompatibleItems(items),
      searchQuery: filters.search,
      typeFilter: filters.type,
      franchiseFilter: filters.franchise,
      yearFilter: filters.year,
      showSold: filters.showSold,
      soldYearFilter: filters.soldYear,
      showWithImages: filters.showWithImages,
      sortDescriptor: {
        column: sortBy.column,
        direction: sortBy.direction === 'asc' ? 'ascending' as const : 'descending' as const
      }
    };
  }, [items, filters, sortBy]);

  // Calculate filtered and sorted items using the original parameters
  const {
    filteredAndSortedItems,
    summaryValues: originalSummaryValues,
    availableYears,
    availableSoldYears,
  } = useCatalogFilters(filterParams);

  // Create enhanced summary values to match expected structure
  const summaryValues = useMemo(() => {
    console.log('[CATALOG-PROVIDER] Original summary values:', originalSummaryValues);
    
    const soldItems = items.filter(item => item.isSold);
    const unsoldItems = items.filter(item => !item.isSold);
    
    const totalValue = originalSummaryValues?.totalValue || 0;
    const totalCost = originalSummaryValues?.totalCost || 0;
    const totalProfit = totalValue - totalCost;
    const profitMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
    
    return {
      totalItems: filteredAndSortedItems.length,
      totalValue: totalValue,
      totalCost: totalCost,
      totalProfit: totalProfit,
      profitMargin: profitMargin,
      totalSold: soldItems.length,
      totalSoldValue: soldItems.reduce((sum, item) => sum + (item.value || 0), 0),
      totalSpent: originalSummaryValues?.totalCost || 0,
      ebayListedValue: originalSummaryValues?.ebayListedValue || 0,
      ebaySoldValue: originalSummaryValues?.ebaySoldValue || 0,
      unsoldTotalCost: originalSummaryValues?.unsoldTotalCost || 0,
      aiEstimate: originalSummaryValues?.ebayListedValue || 0, // Use eBay value as AI estimate
    };
  }, [originalSummaryValues, items, filteredAndSortedItems.length]);

  // Debug: log filtered items - only log in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[CATALOG-PROVIDER] Filtered items count:', filteredAndSortedItems.length);
    }
  }, [filteredAndSortedItems.length]);

  // Fetch items on first mount or if we don't have any
  useEffect(() => {
    if (!firstLoadCompleted) {
      console.log('[CATALOG-PROVIDER] Performing initial fetch');
      fetchItems().then(result => {
        console.log('[CATALOG-PROVIDER] Initial fetchItems completed, result items:', result?.length || 0);
        setFirstLoadCompleted(true);
      }).catch(error => {
        console.error('[CATALOG-PROVIDER] Initial fetchItems error:', error);
        setFirstLoadCompleted(true);
      });
    }
  }, [firstLoadCompleted, fetchItems]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  // Refetch items
  const refetchItems = useCallback(async () => {
    console.log('[CATALOG-PROVIDER] Manually refetching items');
    await fetchItems();
  }, [fetchItems]);

  // Calculate total items count
  const totalItems = useMemo(() => {
    return filteredAndSortedItems.length;
  }, [filteredAndSortedItems]);

  // Create context value
  const contextValue = useMemo(() => ({
    // Items and pagination
    items: filteredAndSortedItems,
    isLoading,
    loadingItemId,
    totalItems,
    
    // Filters
    filters,
    setFilters,
    clearFilters,
    
    // Search specific
    searchTerms: filters.search ? filters.search.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0) : [],
    
    // Filter data
    customTypes,
    customFranchises,
    customBrands,
    availableYears: availableYears?.map(year => year.toString()) || [],
    availableSoldYears: availableSoldYears?.map(year => year.toString()) || [],
    
    // Sorting
    sortBy,
    setSortBy,
    
    // View settings
    viewType,
    setViewType,
    
    // Pagination
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    
    // Item operations
    addItem,
    updateItem,
    deleteItem,
    
    // Custom entity operations
    loadCustomTypes: async () => {
      const result = await loadCustomTypes();
      return;
    },
    loadCustomFranchises: async () => {
      const result = await loadCustomFranchises();
      return;
    },
    loadCustomBrands: async () => {
      const result = await loadCustomBrands();
      return;
    },
    
    // Refetch data
    refetchItems,

    // Summary values
    summaryValues,
  }), [
    filteredAndSortedItems,
    isLoading,
    loadingItemId,
    totalItems,
    filters,
    setFilters,
    clearFilters,
    customTypes,
    customFranchises,
    customBrands,
    availableYears,
    availableSoldYears,
    sortBy,
    setSortBy,
    viewType,
    setViewType,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    addItem,
    updateItem,
    deleteItem,
    loadCustomTypes,
    loadCustomFranchises,
    loadCustomBrands,
    refetchItems,
    summaryValues,
  ]);

  return (
    <CatalogContext.Provider value={contextValue}>
      {children}
    </CatalogContext.Provider>
  );
} 