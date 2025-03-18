/**
 * Catalog Context - Central state management for the catalog view
 * 
 * This context provides state and actions for the catalog page, including:
 * - Items and pagination
 * - Filters and sorting
 * - View settings
 * - Loading states
 */

import { createContext, useContext } from 'react';
import { CustomEntity } from '../filter-controls/filter-types';
import { CatalogItem } from '../utils/item-types';

// Filter state type
export interface FilterState {
  search: string;
  type: string;
  franchise: string;
  year: string;
  showSold: boolean;
  soldYear: string;
  showWithImages: boolean;
}

// Sort option type
export interface SortOption {
  column: string;
  direction: 'asc' | 'desc';
}

// Context type definition
export interface CatalogContextType {
  // Items and pagination
  items: CatalogItem[];
  isLoading: boolean;
  loadingItemId: string | null;
  totalItems: number;
  
  // Filters
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  clearFilters: () => void;
  
  // Search specific
  searchTerms: string[]; // Split search query into terms for highlighting
  
  // Filter data
  customTypes: CustomEntity[];
  customFranchises: CustomEntity[];
  customBrands: CustomEntity[];
  availableYears: string[];
  availableSoldYears: string[];
  
  // Sorting
  sortBy: SortOption;
  setSortBy: (option: SortOption) => void;
  
  // View settings
  viewType: 'grid' | 'list';
  setViewType: (type: 'grid' | 'list') => void;
  
  // Pagination
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (count: number) => void;
  
  // Item operations
  addItem: (item: Omit<CatalogItem, 'id'>) => Promise<any>;
  updateItem: (id: string, updates: Partial<CatalogItem>) => Promise<any>;
  deleteItem: (id: string) => Promise<any>;
  
  // Custom entity operations
  loadCustomTypes: () => Promise<void>;
  loadCustomFranchises: () => Promise<void>;
  loadCustomBrands: () => Promise<void>;
  
  // Refetch data
  refetchItems: () => Promise<void>;

  // Summary values for the collection
  summaryValues: {
    totalItems: number;
    totalValue: number;
    totalCost: number;
    totalSold: number;
    totalSoldValue: number;
    ebayListedValue: number;
    ebaySoldValue: number;
    unsoldTotalCost: number;
  };
}

// Create the context with a default undefined value
const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

// Create a custom hook for using this context
export function useCatalogContext() {
  const context = useContext(CatalogContext);
  if (context === undefined) {
    throw new Error('useCatalogContext must be used within a CatalogProvider');
  }
  return context;
}

export default CatalogContext; 