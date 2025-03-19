/**
 * Catalog Page - Main component for the catalog view
 * 
 * This component serves as the primary content for the catalog page,
 * bringing together all the subcomponents like filters, grid/list views, etc.
 * Updated to use named exports per TypeScript standards.
 */

'use client';

import React, { useEffect } from 'react';
import { useCatalogContext } from './context/catalog-context';
import { Package, Plus, Grid, List as ListIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Direct import for filter bar component
import { FilterBar } from './filter-controls/filter-bar';
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
          <div className="flex items-center space-x-4">
            <AddItemModal
              customTypes={customTypes}
              customFranchises={customFranchises}
              customBrands={customBrands}
              onLoadCustomTypes={loadCustomTypes}
              onLoadCustomFranchises={loadCustomFranchises}
              onLoadCustomBrands={loadCustomBrands}
              isLoading={isLoading}
            />
            <SortDropdown
              value={sortBy}
              onChange={handleSortChange}
              options={defaultSortOptions}
              className="w-52"
            />
          </div>
        </div>

        {/* Summary Panel */}
        <SummaryPanelAdapter
          summaryValues={summaryValues}
          showSold={filters.showSold}
          view={viewType}
          onViewChange={setViewType}
          className="mb-6"
        />

        {/* Filters Section */}
        <div className="mb-6 flex flex-col space-y-4">
          <FilterBar />
          
          {/* View Toggle */}
          <div className="flex justify-end mt-2">
            <div className="bg-gray-800 rounded-md p-1 inline-flex">
              <Button
                size="sm"
                variant={viewType === 'grid' ? 'default' : 'ghost'}
                className={viewType === 'grid' ? 'bg-violet-600' : 'bg-transparent hover:bg-gray-700'}
                onClick={() => setViewType('grid')}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewType === 'list' ? 'default' : 'ghost'}
                className={viewType === 'list' ? 'bg-violet-600' : 'bg-transparent hover:bg-gray-700'}
                onClick={() => setViewType('list')}
                title="List View"
              >
                <ListIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
          <p>Items: {items.length} | Loading: {isLoading ? 'Yes' : 'No'}</p>
          <p>View: {viewType} | Filter: {filters.search ? `"${filters.search}"` : 'None'}</p>
          <p>Show Sold: {filters.showSold ? 'Yes' : 'No'} | With Images: {filters.showWithImages ? 'Yes' : 'No'}</p>
          <p>
            Filters: Type: {filters.type || 'None'} | 
            Franchise: {filters.franchise || 'None'} | 
            Year: {filters.year || 'None'}
          </p>
          {items.length > 0 && (
            <p>First item: {items[0].name} (ID: {items[0].id.substring(0, 8)}...)</p>
          )}
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