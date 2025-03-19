/**
 * Catalog Page - Main component for the catalog view
 * 
 * This component serves as the primary content for the catalog page,
 * bringing together all the subcomponents like filters, grid/list views, etc.
 * Updated to use named exports per TypeScript standards.
 * Removed debug info section to clean up the UI.
 * Consolidated filter controls into a top bar with dropdown menu.
 */

'use client';

import React, { useEffect, useMemo } from 'react';
import { useCatalogContext } from './context/catalog-context';
import { Package, Plus, Grid, List as ListIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FiltersDropdown } from './filter-controls/filters-dropdown';
import { GridView } from './layout/grid-view';
import { ListView } from './layout/list-view';
import { ImageCacheProvider } from './context/image-cache-context';
import { CatalogProvider } from './context/catalog-provider';
import { SortDropdown, defaultSortOptions } from './sorting';
import { CatalogItem } from './utils';
import { SummaryPanel, SummaryValues, AddItemModal } from './ui';

/**
 * SummaryPanelAdapter - Adapts context summary values to the expected SummaryPanel props
 */
function SummaryPanelAdapter({
  summaryValues,
  showSold,
  view,
  onViewChange,
  className
}: {
  summaryValues: any;
  showSold: boolean;
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  className?: string;
}) {
  // Create a compatible summaryValues object
  const adaptedSummaryValues: SummaryValues = {
    totalValue: summaryValues.totalValue || 0,
    totalCost: summaryValues.totalCost || 0,
    totalProfit: summaryValues.totalProfit || 0,
    profitMargin: summaryValues.profitMargin || 0,
    aiEstimate: summaryValues.aiEstimate || 0,
    totalSold: summaryValues.totalSold || 0,
    totalSoldValue: summaryValues.totalSoldValue || 0,
    totalSpent: summaryValues.totalSpent || 0,
  };

  return (
    <SummaryPanel
      summaryValues={adaptedSummaryValues}
      showSold={showSold}
      view={view}
      onViewChange={onViewChange}
      className={className}
    />
  );
}

/**
 * The main catalog page content that displays once data is loaded
 */
export function CatalogPageContent() {
  const { 
    items,
    isLoading,
    viewType,
    setViewType,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    addItem,
    updateItem,
    deleteItem,
    summaryValues,
    loadingItemId,
    refetchItems,
    customTypes,
    customFranchises,
    customBrands,
    loadCustomTypes,
    loadCustomFranchises,
    loadCustomBrands
  } = useCatalogContext();

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type) count++;
    if (filters.franchise) count++;
    if (filters.year) count++;
    if (filters.showWithImages) count++;
    return count;
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  // Handle filter reset
  const handleFilterReset = () => {
    setFilters({
      search: filters.search,
      showSold: filters.showSold,
      soldYear: filters.soldYear,
      type: '',
      franchise: '',
      year: '',
      showWithImages: false
    });
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
  };

  // Handle show sold toggle
  const handleShowSoldToggle = () => {
    setFilters({ ...filters, showSold: !filters.showSold });
  };

  // Debug: log context values
  useEffect(() => {
    console.log('[CATALOG-PAGE] Context values:', {
      itemsCount: items.length,
      isLoading,
      viewType,
      filters,
      sortBy
    });
  }, [items.length, isLoading, viewType, filters, sortBy]);

  // Trigger a manual fetch to ensure data is loaded
  useEffect(() => {
    console.log('[CATALOG-PAGE] Initializing, will fetch items if empty');
    if (items.length === 0 && !isLoading) {
      console.log('[CATALOG-PAGE] No items, triggering refetch');
      refetchItems().catch(err => 
        console.error('[CATALOG-PAGE] Error fetching items:', err)
      );
    }
  }, [items.length, isLoading, refetchItems]);

  // Handle sort change
  const handleSortChange = (newSort: typeof sortBy) => {
    console.log('[CATALOG-PAGE] Changing sort to:', newSort);
    setSortBy(newSort);
  };

  // Handle sort column click in list view
  const handleColumnSort = (column: string) => {
    const newDirection = sortBy.column === column && sortBy.direction === 'asc' ? 'desc' : 'asc';
    console.log(`[CATALOG-PAGE] Column sort: ${column} ${newDirection}`);
    setSortBy({
      column,
      direction: newDirection
    });
  };

  return (
    <div className="min-h-screen text-foreground transition-colors duration-200 
      bg-slate-50 dark:bg-black/30">
      <main className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
          <h1 className="text-4xl font-serif text-foreground dark:text-foreground">
            Your Collection <span className="text-foreground dark:text-foreground">Catalog</span>
          </h1>
        </div>

        {/* Summary Panel */}
        <SummaryPanelAdapter
          summaryValues={summaryValues}
          showSold={filters.showSold}
          view={viewType}
          onViewChange={setViewType}
          className="mb-6"
        />

        {/* Consolidated Top Bar */}
        <div className="mb-6 flex items-center gap-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          {/* Search and Primary Controls */}
          <div className="flex-1 flex items-center gap-4">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search your collection..."
                value={filters.search || ''}
                onChange={handleSearchChange}
                className="w-full bg-muted/50 rounded-md border border-border pl-9 pr-4 py-2 text-sm"
              />
            </div>

            {/* Show Sold Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={filters.showSold ? "bg-accent" : ""}
                onClick={handleShowSoldToggle}
              >
                Show Sold
              </Button>
            </div>

            {/* Filters Dropdown */}
            <FiltersDropdown
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleFilterReset}
              customTypes={customTypes}
              customFranchises={customFranchises}
              activeFilterCount={activeFilterCount}
            />
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="bg-muted rounded-md p-1 inline-flex shadow-sm">
              <Button
                size="sm"
                variant={viewType === 'grid' ? 'default' : 'ghost'}
                className={viewType === 'grid' ? 'bg-violet-600' : 'bg-transparent hover:bg-muted-foreground/10'}
                onClick={() => setViewType('grid')}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewType === 'list' ? 'default' : 'ghost'}
                className={viewType === 'list' ? 'bg-violet-600' : 'bg-transparent hover:bg-muted-foreground/10'}
                onClick={() => setViewType('list')}
                title="List View"
              >
                <ListIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Add Item Button */}
            <AddItemModal
              customTypes={customTypes}
              customFranchises={customFranchises}
              customBrands={customBrands}
              onLoadCustomTypes={loadCustomTypes}
              onLoadCustomFranchises={loadCustomFranchises}
              onLoadCustomBrands={loadCustomBrands}
              isLoading={isLoading}
            />

            {/* Sort Dropdown */}
            <SortDropdown
              value={sortBy}
              onChange={handleSortChange}
              options={defaultSortOptions}
              className="w-52"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && items.length === 0 && (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <Package className="w-12 h-12 animate-pulse text-gray-400" />
              <p className="mt-4 text-gray-500">Loading your collection...</p>
            </div>
          </div>
        )}

        {/* Content */}
        {!isLoading || items.length > 0 ? (
          <div className="mt-4">
            {viewType === 'grid' ? (
              <GridView 
                items={items}
                isLoading={isLoading}
                loadingItemId={loadingItemId}
                showSold={filters.showSold}
              />
            ) : (
              <ListView 
                items={items}
                isLoading={isLoading}
                loadingItemId={loadingItemId}
                showSold={filters.showSold}
                sortDescriptor={sortBy}
                onSort={handleColumnSort}
                onEdit={(item: CatalogItem) => updateItem(item.id, {})}
                onDelete={(item: CatalogItem) => deleteItem(item.id)}
              />
            )}
          </div>
        ) : null}

        {/* Empty State When Not Loading */}
        {!isLoading && items.length === 0 && (
          <div className="flex flex-col justify-center items-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <Package className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400 mb-2">
              {filters.search || filters.type || filters.franchise ? 
                'No items match your filters' : 
                'Your collection is empty'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
              {filters.search || filters.type || filters.franchise ? 
                'Try adjusting your filters to see more items.' : 
                'Start adding items to your collection to see them here.'}
            </p>
            <div className="flex gap-4">
              <AddItemModal
                customTypes={customTypes}
                customFranchises={customFranchises}
                customBrands={customBrands}
                onLoadCustomTypes={loadCustomTypes}
                onLoadCustomFranchises={loadCustomFranchises}
                onLoadCustomBrands={loadCustomBrands}
                isLoading={isLoading}
              />
              <Button 
                variant="outline"
                onClick={() => refetchItems()}
              >
                Refresh Items
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * The container component that sets up the context provider
 */
interface CatalogPageProps {
  initialItems?: CatalogItem[];
  initialTypes?: { id: string; name: string }[];
  initialFranchises?: { id: string; name: string }[];
  initialBrands?: { id: string; name: string }[];
}

export default function CatalogPage({
  initialItems = [],
  initialTypes = [],
  initialFranchises = [],
  initialBrands = [],
}: CatalogPageProps) {
  // Debug initial props
  useEffect(() => {
    console.log('[CATALOG-PAGE] Initializing with:', {
      initialItemsCount: initialItems.length,
      initialTypes: initialTypes.length,
    });
  }, [initialItems.length, initialTypes.length]);

  return (
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
  );
} 