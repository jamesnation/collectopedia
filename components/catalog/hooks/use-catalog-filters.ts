import { useState, useMemo, useCallback, useEffect, useContext } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { CatalogItem } from '../utils/schema-adapter';
import { useImageCache } from '../context/image-cache-context';
import { usePersistentFilters } from './use-persistent-filters';

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
  
  // Use our persistent filters hook
  const { filters, updateFilter, resetFilters, isLoaded } = usePersistentFilters();
  
  // Set up local state with initial values from default or localStorage
  // Only set the initial values once, subsequent updates happen through event handlers
  const [view, setView] = useState<'list' | 'grid'>(filters.view);
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(filters.searchQuery);
  const [typeFilter, setTypeFilter] = useState<string>(filters.typeFilter);
  const [franchiseFilter, setFranchiseFilter] = useState<string>(filters.franchiseFilter);
  const [yearFilter, setYearFilter] = useState<string>(filters.yearFilter);
  const [showSold, setShowSold] = useState(filters.showSold);
  const [soldYearFilter, setSoldYearFilter] = useState<string>(filters.soldYearFilter);
  const [showWithImages, setShowWithImages] = useState(filters.showWithImages);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>(filters.sortDescriptor);
  
  // Sync local state with persistent filters only when isLoaded changes from false to true
  useEffect(() => {
    if (isLoaded) {
      // This should only run once when the filters are initially loaded
      setView(filters.view);
      setSearchQuery(filters.searchQuery);
      setDebouncedSearchQuery(filters.searchQuery);
      setTypeFilter(filters.typeFilter);
      setFranchiseFilter(filters.franchiseFilter);
      setYearFilter(filters.yearFilter);
      setShowSold(filters.showSold);
      setSoldYearFilter(filters.soldYearFilter);
      setShowWithImages(filters.showWithImages);
      setSortDescriptor(filters.sortDescriptor);
    }
  }, [
    isLoaded, 
    filters.view,
    filters.searchQuery,
    filters.typeFilter,
    filters.franchiseFilter,
    filters.yearFilter,
    filters.showSold,
    filters.soldYearFilter,
    filters.showWithImages,
    filters.sortDescriptor
  ]); // Include all dependencies

  // Create a debounced search handler
  const debouncedSetSearch = useDebouncedCallback(
    (value) => {
      setDebouncedSearchQuery(value);
      // Update persistent filter
      updateFilter('searchQuery', value);
    },
    300
  );

  // Handler for search input changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    debouncedSetSearch(value);
  }, [debouncedSetSearch]);

  // Create wrapped handlers that update both local and persistent state
  const handleViewChange = useCallback((newView: 'list' | 'grid') => {
    setView(newView);
    updateFilter('view', newView);
  }, [updateFilter]);

  const handleTypeFilterChange = useCallback((value: string) => {
    setTypeFilter(value);
    updateFilter('typeFilter', value);
  }, [updateFilter]);

  const handleFranchiseFilterChange = useCallback((value: string) => {
    setFranchiseFilter(value);
    updateFilter('franchiseFilter', value);
  }, [updateFilter]);

  const handleYearFilterChange = useCallback((value: string) => {
    setYearFilter(value);
    updateFilter('yearFilter', value);
  }, [updateFilter]);

  const handleShowSoldChange = useCallback((value: boolean) => {
    setShowSold(value);
    updateFilter('showSold', value);
  }, [updateFilter]);

  const handleSoldYearFilterChange = useCallback((value: string) => {
    setSoldYearFilter(value);
    updateFilter('soldYearFilter', value);
  }, [updateFilter]);

  const handleShowWithImagesChange = useCallback((value: boolean) => {
    setShowWithImages(value);
    updateFilter('showWithImages', value);
  }, [updateFilter]);

  // Handler for sort changes
  const handleSort = useCallback((column: string) => {
    const newSortDescriptor = {
      column,
      direction: sortDescriptor.column === column && sortDescriptor.direction === 'ascending' 
        ? 'descending' 
        : 'ascending'
    } as SortDescriptor;
    
    setSortDescriptor(newSortDescriptor);
    updateFilter('sortDescriptor', newSortDescriptor);
  }, [sortDescriptor, updateFilter]);

  // Custom reset function that updates both local state and persistent storage
  const handleResetFilters = useCallback(() => {
    // Reset local state
    setView('grid');
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setTypeFilter('all');
    setFranchiseFilter('all');
    setYearFilter('all');
    setShowSold(false);
    setSoldYearFilter('all');
    setShowWithImages(false);
    setSortDescriptor({
      column: 'name',
      direction: 'ascending'
    });
    
    // Reset persistent storage
    resetFilters();
  }, [resetFilters]);

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
      .filter(item => !hasCompletedLoading[item.id])
      .map(item => item.id);
  }, [items, showWithImages, hasCompletedLoading]);

  // Calculate total count for display
  const totalCount = useMemo(() => {
    return filteredAndSortedItems.length;
  }, [filteredAndSortedItems]);

  return {
    searchQuery,
    setSearchQuery: handleSearchChange,
    typeFilter,
    setTypeFilter: handleTypeFilterChange,
    franchiseFilter,
    setFranchiseFilter: handleFranchiseFilterChange,
    yearFilter,
    setYearFilter: handleYearFilterChange,
    showSold,
    setShowSold: handleShowSoldChange,
    soldYearFilter,
    setSoldYearFilter: handleSoldYearFilterChange,
    showWithImages,
    setShowWithImages: handleShowWithImagesChange,
    filteredAndSortedItems,
    summaryValues,
    availableYears,
    availableSoldYears,
    totalCount,
    sortDescriptor,
    handleSort,
    itemsNeedingImageCheck,
    resetFilters: handleResetFilters,
    view,
    setView: handleViewChange
  };
} 