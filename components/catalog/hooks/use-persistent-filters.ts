import { useState, useEffect, useRef } from 'react';

// Define the structure of our persisted filters
export interface PersistedFilters {
  searchQuery: string;
  typeFilter: string;
  franchiseFilter: string;
  yearFilter: string;
  showSold: boolean;
  soldYearFilter: string;
  showWithImages: boolean;
  view: 'list' | 'grid';
  sortDescriptor: {
    column: string;
    direction: 'ascending' | 'descending';
  };
}

// Default filter values
const defaultFilters: PersistedFilters = {
  searchQuery: '',
  typeFilter: 'all',
  franchiseFilter: 'all',
  yearFilter: 'all',
  showSold: false,
  soldYearFilter: 'all',
  showWithImages: false,
  view: 'grid',
  sortDescriptor: {
    column: 'name',
    direction: 'ascending'
  }
};

const STORAGE_KEY = 'collectopedia-catalog-filters';

export function usePersistentFilters() {
  // Track if we've loaded from localStorage yet
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Use useRef to track previous filters to avoid unnecessary localStorage updates
  const previousFiltersRef = useRef<string>('');
  
  // Initialize state with default values
  const [filters, setFilters] = useState<PersistedFilters>(defaultFilters);

  // Load filters from localStorage on mount (only once)
  useEffect(() => {
    if (typeof window === 'undefined' || isLoaded) return;
    
    try {
      const savedFilters = localStorage.getItem(STORAGE_KEY);
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters);
        console.log('[FILTERS] Loaded filters from localStorage:', parsedFilters);
        setFilters(parsedFilters);
        previousFiltersRef.current = savedFilters;
      }
    } catch (error) {
      console.error('[FILTERS] Error loading filters from localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, [isLoaded]);

  // Save filters to localStorage whenever they change (but only if needed)
  useEffect(() => {
    // Only save if filters have been loaded from localStorage
    if (!isLoaded || typeof window === 'undefined') return;
    
    try {
      const filtersJson = JSON.stringify(filters);
      
      // Only update localStorage if filters have actually changed
      if (filtersJson !== previousFiltersRef.current) {
        localStorage.setItem(STORAGE_KEY, filtersJson);
        previousFiltersRef.current = filtersJson;
        console.log('[FILTERS] Saved filters to localStorage');
      }
    } catch (error) {
      console.error('[FILTERS] Error saving filters to localStorage:', error);
    }
  }, [filters, isLoaded]);

  // Update a single filter value
  const updateFilter = <K extends keyof PersistedFilters>(
    key: K, 
    value: PersistedFilters[K]
  ) => {
    setFilters(prev => {
      // Only update if the value has actually changed
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
  };

  // Reset all filters to default values
  const resetFilters = () => {
    setFilters(defaultFilters);
    try {
      localStorage.removeItem(STORAGE_KEY);
      previousFiltersRef.current = '';
      console.log('[FILTERS] Reset filters to defaults');
    } catch (error) {
      console.error('[FILTERS] Error removing filters from localStorage:', error);
    }
  };

  return {
    filters,
    updateFilter,
    resetFilters,
    isLoaded
  };
} 