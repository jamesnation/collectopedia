import { useState, useMemo, useCallback, useEffect, useContext } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { CatalogItem } from '../utils/schema-adapter';
import { useImageCache } from '../context/image-cache-context';

export type SortDirection = 'ascending' | 'descending';

export type SortDescriptor = {
  column: string;
  direction: SortDirection;
};

interface UseCatalogFiltersProps {
  items: CatalogItem[];
  // Filter parameters from context
  searchQuery?: string;
  typeFilter?: string;
  franchiseFilter?: string;
  yearFilter?: string;
  showSold?: boolean;
  soldYearFilter?: string;
  showWithImages?: boolean;
  sortDescriptor?: SortDescriptor;
}

/**
 * Deep equality check for filter parameter objects to prevent unnecessary recalculations
 */
function areFiltersEqual(prevFilters: any, nextFilters: any): boolean {
  // Quick identity check
  if (prevFilters === nextFilters) return true;
  
  // If one is null and the other isn't, they're not equal
  if (!prevFilters || !nextFilters) return false;
  
  // Check if both objects have the same keys
  const prevKeys = Object.keys(prevFilters);
  const nextKeys = Object.keys(nextFilters);
  
  if (prevKeys.length !== nextKeys.length) return false;
  
  // Check if all keys have the same values
  return prevKeys.every(key => {
    const prevValue = prevFilters[key];
    const nextValue = nextFilters[key];
    
    // Handle arrays (like images)
    if (Array.isArray(prevValue) && Array.isArray(nextValue)) {
      if (prevValue.length !== nextValue.length) return false;
      return prevValue.every((val, idx) => val === nextValue[idx]);
    }
    
    // Handle objects recursively
    if (
      typeof prevValue === 'object' && prevValue !== null &&
      typeof nextValue === 'object' && nextValue !== null
    ) {
      return areFiltersEqual(prevValue, nextValue);
    }
    
    // Handle primitive values
    return prevValue === nextValue;
  });
}

// The main hook implementation
export function useCatalogFilters({ 
  items,
  searchQuery = '',
  typeFilter = 'all',
  franchiseFilter = 'all',
  yearFilter = 'all',
  showSold = false,
  soldYearFilter = 'all',
  showWithImages = false,
  sortDescriptor: externalSortDescriptor
}: UseCatalogFiltersProps) {
  // Get image cache context
  const { imageCache, hasCompletedLoading, hasImages } = useImageCache();
  
  // View state - this doesn't seem to be used by the context
  const [view, setView] = useState<'list' | 'grid'>('list');
  
  // Use the external sortDescriptor or default
  const actualSortDescriptor = externalSortDescriptor || {
    column: 'name',
    direction: 'ascending'
  };

  // Store previous filter parameters for comparison
  const [prevFilterParams, setPrevFilterParams] = useState<any>(null);
  const [cachedResults, setCachedResults] = useState<CatalogItem[]>([]);
  
  // Combine all filter parameters into a single object for comparison
  const currentFilterParams = {
    itemsLength: items.length,
    searchQuery,
    typeFilter,
    franchiseFilter,
    yearFilter,
    showSold,
    soldYearFilter,
    showWithImages,
    sortDescriptor: actualSortDescriptor
  };
  
  // Create a filtered and sorted list of items
  const filteredAndSortedItems = useMemo(() => {
    // Check if we've already calculated results for these exact filter parameters
    if (
      prevFilterParams && 
      areFiltersEqual(prevFilterParams, currentFilterParams) &&
      cachedResults.length > 0
    ) {
      // Skip recalculation if nothing changed
      console.log('[CATALOG FILTER] Using cached results - filters unchanged');
      return cachedResults;
    }
    
    // Store current parameters for future comparison
    setPrevFilterParams(currentFilterParams);
    
    // Continue with the regular filtering logic
    console.log('[CATALOG FILTER] Filtering', items.length, 'items with filters:', { 
      search: searchQuery, 
      type: typeFilter,
      franchise: franchiseFilter,
      year: yearFilter,
      showSold,
      withImages: showWithImages
    });
    
    // Debug to see what items we have before filtering
    if (items.length === 0) {
      console.log('[CATALOG FILTER] No items to filter!');
      setCachedResults([]);
      return [];
    }
    
    if (items.length > 0) {
      console.log('[CATALOG FILTER] Sample of items before filtering:', 
        items.slice(0, 3).map(item => ({
          id: item.id,
          name: item.name,
          isSold: item.isSold,
          type: item.type,
          franchise: item.franchise,
          year: item.year
        }))
      );
    }
    
    let result = [...items]; // Start with a copy of all items
    
    // Apply sold status filter
    if (showSold) {
      // When showSold is true, we only show sold items
      result = result.filter(item => item.isSold);
      console.log('[CATALOG FILTER] Showing only sold items:', result.length);
    } else {
      // When showSold is false, we show all non-sold items
      result = result.filter(item => !item.isSold);
      console.log('[CATALOG FILTER] Showing only unsold items:', result.length);
    }
    
    // Add more detailed debugging around the sold filter
    const soldCount = items.filter(item => item.isSold).length;
    const unsoldCount = items.filter(item => !item.isSold).length;
    console.log(`[CATALOG FILTER] Items count: sold=${soldCount}, unsold=${unsoldCount}, showingSold=${showSold}`);
    
    // Check if we have items after the sold filter
    if (result.length === 0) {
      console.log('[CATALOG FILTER] No items after sold filter!');
      return []; // Early return if we have no items
    }
    
    // Apply search filter if search query exists
    if (searchQuery && searchQuery.trim() !== '') {
      const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
      console.log('[CATALOG FILTER] Applying search with terms:', searchTerms);
      
      if (searchTerms.length > 0) {
        result = result.filter(item => {
          // Check each search term independently
          return searchTerms.every(term => {
            // Fields to search in
            const fieldsToSearch = [
              item.name,
              item.type,
              item.franchise,
              item.brand || '',
              item.notes || '',
              item.year?.toString() || '',
            ];
            
            // Check if any field contains the search term
            return fieldsToSearch.some(field => {
              if (!field) return false;
              return field.toLowerCase().includes(term);
            });
          });
        });
        
        console.log(`[CATALOG FILTER] After search filter: ${result.length} items matching "${searchQuery}"`);
        
        // If search returns no results, should we return to the full list?
        if (result.length === 0) {
          console.log('[CATALOG FILTER] Search returned no results!');
        }
      }
    }
    
    // Apply type filter if specified
    if (typeFilter && typeFilter !== 'all' && typeFilter !== '') {
      result = result.filter(item => item.type === typeFilter);
      console.log(`[CATALOG FILTER] After type filter (${typeFilter}): ${result.length} items`);
      
      if (result.length === 0) {
        console.log('[CATALOG FILTER] Type filter returned no results!');
      }
    }
    
    // Apply franchise filter if specified
    if (franchiseFilter && franchiseFilter !== 'all' && franchiseFilter !== '') {
      result = result.filter(item => item.franchise === franchiseFilter);
      console.log(`[CATALOG FILTER] After franchise filter (${franchiseFilter}): ${result.length} items`);
      
      if (result.length === 0) {
        console.log('[CATALOG FILTER] Franchise filter returned no results!');
      }
    }
    
    // Apply year filter if specified
    if (yearFilter && yearFilter !== 'all' && yearFilter !== '') {
      result = result.filter(item => {
        const acquiredYear = item.acquired instanceof Date 
          ? item.acquired.getFullYear().toString()
          : new Date(item.acquired).getFullYear().toString();
        return acquiredYear === yearFilter;
      });
      console.log(`[CATALOG FILTER] After year filter (${yearFilter}): ${result.length} items`);
      
      if (result.length === 0) {
        console.log('[CATALOG FILTER] Year filter returned no results!');
      }
    }

    // Apply sold year filter if applicable
    if (showSold && soldYearFilter && soldYearFilter !== 'all' && soldYearFilter !== '') {
      result = result.filter(item => {
        if (!item.soldDate) return false;
        const soldYear = item.soldDate instanceof Date
          ? item.soldDate.getFullYear().toString()
          : new Date(item.soldDate).getFullYear().toString();
        return soldYear === soldYearFilter;
      });
      console.log(`[CATALOG FILTER] After sold year filter (${soldYearFilter}): ${result.length} items`);
      
      if (result.length === 0) {
        console.log('[CATALOG FILTER] Sold year filter returned no results!');
      }
    }

    // Apply show with images filter - check for either image field or images array
    if (showWithImages) {
      result = result.filter(item => {
        // Check if item has a direct image property that's non-empty
        const hasDirectImage = Boolean(item.image && String(item.image).trim() !== '');
        
        // Check if item has an images array property that's non-empty
        const hasImagesArray = Array.isArray(item.images) && item.images.length > 0;
        
        // Check if item has images in the image cache
        const hasImagesInCache = (imageCache[item.id]?.length || 0) > 0;
        
        // Consider the item as having images if any condition is true
        return hasDirectImage || hasImagesArray || hasImagesInCache;
      });
      console.log(`[CATALOG FILTER] After image filter: ${result.length} items`);
      
      if (result.length === 0) {
        console.log('[CATALOG FILTER] Image filter returned no results!');
      }
    }

    // If we have zero results after all filters, we should consider returning a default set
    if (result.length === 0) {
      console.log('[CATALOG FILTER] All filters combined returned no results!');
      // We could return all items or just an empty array based on requirements
      // result = items.filter(item => !item.isSold); // Option to return all unsold items
    }

    // Apply sorting if we have any items
    if (result.length > 0) {
      result.sort((a, b) => {
        const { column, direction } = actualSortDescriptor;
        let comparison = 0;
  
        switch (column) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'acquired':
            comparison = new Date(a.acquired).getTime() - new Date(b.acquired).getTime();
            break;
          case 'cost':
            comparison = a.cost - b.cost;
            break;
          case 'value':
          case 'soldPrice':
            comparison = (showSold ? (a.soldPrice ?? 0) - (b.soldPrice ?? 0) : a.value - b.value);
            break;
          case 'ebayListed':
            comparison = (a.ebayListed ?? 0) - (b.ebayListed ?? 0);
            break;
          case 'soldDate':
            if (a.soldDate && b.soldDate) {
              comparison = new Date(a.soldDate).getTime() - new Date(b.soldDate).getTime();
            } else if (a.soldDate) {
              comparison = 1;
            } else if (b.soldDate) {
              comparison = -1;
            }
            break;
        }
  
        return direction === 'ascending' ? comparison : -comparison;
      });
    }

    console.log('[CATALOG FILTER] Returning', result.length, 'filtered items');
    
    // Cache the results for future comparisons
    setCachedResults(result);
    return result;
  }, [
    items,
    searchQuery,
    typeFilter,
    franchiseFilter,
    yearFilter,
    showSold,
    soldYearFilter,
    showWithImages,
    actualSortDescriptor,
    imageCache
  ]);

  // Calculate summary values 
  const summaryValues = useMemo(() => {
    // Calculate the total cost of all unsold items
    const unsoldTotalCost = items
      .filter(item => !item.isSold)
      .reduce((sum, item) => sum + item.cost, 0);
      
    return filteredAndSortedItems.reduce((acc, item) => {
      acc.totalValue += showSold ? (item.soldPrice ?? 0) : item.value;
      acc.totalCost += item.cost;
      acc.ebayListedValue += (item.ebayListed ?? 0);
      acc.ebaySoldValue += (item.ebaySold ?? 0);
      return acc;
    }, {
      totalValue: 0,
      totalCost: 0,
      ebayListedValue: 0,
      ebaySoldValue: 0,
      unsoldTotalCost
    });
  }, [filteredAndSortedItems, showSold, items]);

  // Get unique years for filter options
  const availableYears = useMemo(() => {
    return Array.from(new Set(items.map(item => {
      const date = new Date(item.acquired);
      return date.getFullYear();
    }))).sort((a, b) => b - a);
  }, [items]);

  // Get unique sold years for filter options
  const availableSoldYears = useMemo(() => {
    return Array.from(new Set(
      items
        .filter(item => item.isSold && item.soldDate)
        .map(item => {
          const date = new Date(item.soldDate as Date);
          return date.getFullYear();
        })
    )).sort((a, b) => b - a);
  }, [items]);

  // Memoize the items needing image check to prevent unnecessary recalculations
  const itemsNeedingImageCheck = useMemo(() => {
    if (!showWithImages) return [];
    
    // Only return IDs for items that haven't completed loading yet
    return items
      .map(item => item.id)
      .filter(id => !hasCompletedLoading[id]);
  }, [items, showWithImages, hasCompletedLoading]);

  return {
    // View state
    view,
    setView,
    
    // Result data
    filteredAndSortedItems,
    summaryValues,
    
    // Metadata
    availableYears,
    availableSoldYears,
    totalCount: filteredAndSortedItems.length,
    
    // Helper data for image filtering
    itemsNeedingImageCheck,
  };
} 