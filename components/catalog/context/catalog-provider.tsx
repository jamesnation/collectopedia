/**
 * Catalog Provider - Provides the CatalogContext to children
 * 
 * This component sets up all the state and handlers needed for the catalog,
 * combining the functionality from various hooks into a unified context.
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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

  // Create enhanced summary values to match expected structure - with debouncing
  const summaryValuesRef = useRef<any>(null);
  const lastOriginalSummaryRef = useRef<any>(null);
  
  const summaryValues = useMemo(() => {
    // CRITICAL FIX: Skip recalculation if the values haven't changed
    if (
      lastOriginalSummaryRef.current && 
      summaryValuesRef.current &&
      JSON.stringify(originalSummaryValues) === JSON.stringify(lastOriginalSummaryRef.current) &&
      filteredAndSortedItems.length === summaryValuesRef.current.totalItems
    ) {
      return summaryValuesRef.current;
    }
    
    // Only log if we're recalculating
    console.log('[CATALOG-PROVIDER] Recalculating summary values');
    
    const soldItems = items.filter(item => item.isSold);
    const unsoldItems = items.filter(item => !item.isSold);
    
    const totalValue = originalSummaryValues?.totalValue || 0;
    const totalCost = originalSummaryValues?.totalCost || 0;
    const totalProfit = totalValue - totalCost;
    const profitMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
    
    // Calculate once and save in ref
    const result = {
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
    
    // Store for future comparison
    lastOriginalSummaryRef.current = originalSummaryValues;
    summaryValuesRef.current = result;
    
    return result;
  }, [originalSummaryValues, items, filteredAndSortedItems.length]);

  // Debug: log filtered items - but only do it once per significant change
  const lastFilteredCountRef = useRef<number>(0);
  
  useEffect(() => {
    if (
      process.env.NODE_ENV === 'development' && 
      Math.abs(lastFilteredCountRef.current - filteredAndSortedItems.length) > 5
    ) {
      console.log('[CATALOG-PROVIDER] Filtered items count:', filteredAndSortedItems.length);
      lastFilteredCountRef.current = filteredAndSortedItems.length;
    }
  }, [filteredAndSortedItems.length]);

  // Fetch items on first mount or if we don't have any
  useEffect(() => {
    // CRITICAL FIX: Don't fetch if we already have items from SSR
    if (!firstLoadCompleted) {
      console.log('[CATALOG-PROVIDER] Initial items count:', initialItems.length);
      
      // Only perform fetch if we don't have initial items from SSR
      if (initialItems.length === 0) {
        console.log('[CATALOG-PROVIDER] No initial items, performing fetch');
        fetchItems().then(result => {
          console.log('[CATALOG-PROVIDER] Initial fetchItems completed, result items:', result?.length || 0);
          setFirstLoadCompleted(true);
        }).catch(error => {
          console.error('[CATALOG-PROVIDER] Initial fetchItems error:', error);
          setFirstLoadCompleted(true);
        });
      } else {
        console.log('[CATALOG-PROVIDER] Using initial items from SSR, skipping fetch');
        setFirstLoadCompleted(true);
      }
    }
  }, [firstLoadCompleted, fetchItems, initialItems.length]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  // Refetch items - with debouncing to prevent loops
  const refetchItems = useCallback(async () => {
    console.log('[CATALOG-PROVIDER] Manual refetch requested');
    
    // Use a timestamp in localStorage to prevent rapid refetches
    const now = Date.now();
    const lastRefetch = localStorage.getItem('lastCatalogRefetch');
    
    if (lastRefetch) {
      const timeSinceLastRefetch = now - parseInt(lastRefetch);
      if (timeSinceLastRefetch < 5000) { // 5 seconds minimum between manual refetches
        console.log(`[CATALOG-PROVIDER] Skipping refetch - last refetch was ${timeSinceLastRefetch}ms ago`);
        return;
      }
    }
    
    localStorage.setItem('lastCatalogRefetch', now.toString());
    console.log('[CATALOG-PROVIDER] Performing manual refetch');
    
    // Force refresh by passing {force: true} to fetchItems
    await fetchItems({ force: true });
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