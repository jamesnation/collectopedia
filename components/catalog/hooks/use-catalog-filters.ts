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
}

export function useCatalogFilters({ items }: UseCatalogFiltersProps) {
  // Get image cache context
  const { imageCache, hasCompletedLoading, hasImages } = useImageCache();
  
  // View state
  const [view, setView] = useState<'list' | 'grid'>('list');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  // Filter state
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [franchiseFilter, setFranchiseFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [showSold, setShowSold] = useState(false);
  const [soldYearFilter, setSoldYearFilter] = useState<string>('all');
  const [showWithImages, setShowWithImages] = useState(false);
  
  // Sort state
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending'
  });

  // Create a debounced search handler
  const debouncedSetSearch = useDebouncedCallback(
    (value) => setDebouncedSearchQuery(value),
    300
  );

  // Handler for search input changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    debouncedSetSearch(value);
  }, [debouncedSetSearch]);

  // Handler for sort changes
  const handleSort = useCallback((column: string) => {
    setSortDescriptor(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'ascending' 
        ? 'descending' 
        : 'ascending'
    }));
  }, []);

  // Create a filtered and sorted list of items
  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter(item => showSold ? item.isSold : !item.isSold);
    
    // Apply search filter
    if (debouncedSearchQuery) {
      const lowercasedQuery = debouncedSearchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(lowercasedQuery) ||
        item.type.toLowerCase().includes(lowercasedQuery) ||
        item.franchise.toLowerCase().includes(lowercasedQuery) ||
        (item.brand && item.brand.toLowerCase().includes(lowercasedQuery))
      );
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter(item => item.type === typeFilter);
    }
    
    // Apply franchise filter
    if (franchiseFilter !== 'all') {
      result = result.filter(item => item.franchise === franchiseFilter);
    }
    
    // Apply year filter
    if (yearFilter !== 'all') {
      result = result.filter(item => {
        const acquiredYear = item.acquired instanceof Date 
          ? item.acquired.getFullYear().toString()
          : new Date(item.acquired).getFullYear().toString();
        return acquiredYear === yearFilter;
      });
    }

    // Apply sold year filter
    if (showSold && soldYearFilter !== 'all') {
      result = result.filter(item => {
        if (!item.soldDate) return false;
        const soldYear = item.soldDate instanceof Date
          ? item.soldDate.getFullYear().toString()
          : new Date(item.soldDate).getFullYear().toString();
        return soldYear === soldYearFilter;
      });
    }

    // Apply show with images filter - check for either image field or images array
    if (showWithImages) {
      // Add diagnostic logs before filtering
      console.log('[IMAGE FILTER] Before filtering: Items count =', result.length);
      
      // Log the first few items' image properties for debugging
      console.log('[IMAGE FILTER] Sample items image data:', 
        result.slice(0, 3).map(item => ({
          id: item.id,
          name: item.name,
          imageType: typeof item.image,
          imageValue: item.image,
          hasImage: Boolean(item.image),
          hasImagesArray: Array.isArray(item.images) && item.images.length > 0,
          imagesInCache: imageCache[item.id]?.length || 0,
          hasCompletedLoadingImages: hasCompletedLoading[item.id] || false
        }))
      );
      
      result = result.filter(item => {
        // Check if item has a direct image property that's non-empty
        const hasDirectImage = Boolean(item.image && String(item.image).trim() !== '');
        
        // Check if item has an images array property that's non-empty
        const hasImagesArray = Array.isArray(item.images) && item.images.length > 0;
        
        // Check if item has images in the image cache
        const hasImagesInCache = (imageCache[item.id]?.length || 0) > 0;
        
        // Log each item's filter evaluation for the first few items
        if (result.indexOf(item) < 5) {
          console.log(`[IMAGE FILTER] Item "${item.name}": hasDirectImage=${hasDirectImage}, hasImagesArray=${hasImagesArray}, hasImagesInCache=${hasImagesInCache}`);
        }
        
        // Consider the item as having images if any condition is true
        return hasDirectImage || hasImagesArray || hasImagesInCache;
      });
      
      // Add diagnostic logs after filtering
      console.log('[IMAGE FILTER] After filtering: Items count =', result.length);
    }

    // Apply sorting
    result.sort((a, b) => {
      const { column, direction } = sortDescriptor;
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

    return result;
  }, [
    items, 
    debouncedSearchQuery, 
    typeFilter, 
    franchiseFilter, 
    yearFilter, 
    sortDescriptor, 
    showSold, 
    soldYearFilter,
    showWithImages,
    imageCache,
    hasCompletedLoading
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
    
    // Search state
    searchQuery,
    setSearchQuery: handleSearchChange,
    
    // Filter state
    typeFilter,
    setTypeFilter,
    franchiseFilter,
    setFranchiseFilter,
    yearFilter,
    setYearFilter,
    showSold,
    setShowSold,
    soldYearFilter,
    setSoldYearFilter,
    showWithImages,
    setShowWithImages,
    
    // Sort state
    sortDescriptor,
    handleSort,
    
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