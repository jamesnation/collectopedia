"use client"

import { useEffect, useState, useCallback } from 'react';
import { SelectItem } from '@/db/schema/items-schema';
import { itemTypeEnum, franchiseEnum } from '@/db/schema/items-schema';
import { Button } from "@/components/ui/button";
import { PlusCircle, Package, Moon, Sun } from "lucide-react";
import { FilterBar } from './ui/filter-bar';
import SummaryPanel from './ui/summary-panel';
import { ItemListView } from './ui/item-list-view';
import { ItemGridView } from './ui/item-grid-view';
import { AddItemModal } from './ui/add-item-modal';
import { DEFAULT_BRANDS } from './utils/schema-adapter';
import { toast } from "@/components/ui/use-toast";

// Import custom hooks
import { useCatalogItems } from './hooks/use-catalog-items';
import { useCustomEntities } from './hooks/use-custom-entities';
import { useCatalogFilters } from './hooks/use-catalog-filters';

interface CatalogProps {
  initialItems: SelectItem[];
  initialTypes: { id: string; name: string }[];
  initialFranchises: { id: string; name: string }[];
  initialBrands: { id: string; name: string }[];
  theme?: string;
  setTheme?: (theme: string) => void;
}

export default function Catalog({
  initialItems = [],
  initialTypes = [],
  initialFranchises = [],
  initialBrands = [],
  theme,
  setTheme
}: CatalogProps) {
  // Initialize hooks with initial data
  const { 
    items, 
    isLoading,
    loadingItemId,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    setItems
  } = useCatalogItems({ initialItems });

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

  const {
    view,
    setView,
    searchQuery,
    setSearchQuery,
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
    filteredAndSortedItems,
    summaryValues,
    availableYears,
    availableSoldYears,
    totalCount,
    sortDescriptor,
    handleSort
  } = useCatalogFilters({ items });

  // State for eBay refresh loading states
  const [loadingListedItemId, setLoadingListedItemId] = useState<string | null>(null);
  const [loadingSoldItemId, setLoadingSoldItemId] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    fetchItems();
    loadCustomTypes();
    loadCustomFranchises();
    loadCustomBrands();
  }, [fetchItems, loadCustomTypes, loadCustomFranchises, loadCustomBrands]);

  // Handle eBay refresh
  const handleEbayRefresh = async (id: string, name: string, type: 'sold' | 'listed') => {
    if (type === 'sold') {
      setLoadingSoldItemId(id);
    } else {
      setLoadingListedItemId(id);
    }

    try {
      // Call the real eBay API through our server action
      const { updateEbayPrices } = await import('@/actions/ebay-actions');
      const result = await updateEbayPrices(id, name, type);
      
      if (result.success) {
        console.log('eBay update result:', result);
        
        // Update the local state with the new value
        const updatedItems = items.map(item => {
          if (item.id === id) {
            return {
              ...item,
              ebayListed: type === 'listed' ? result.prices.median : item.ebayListed,
              ebaySold: type === 'sold' ? result.prices.median : item.ebaySold
            };
          }
          return item;
        });
        
        // Update the items state with the new values
        setItems(updatedItems);
        
        // No need to call updateItem since the server action already updated the database
        
        // Toast notification for success
        toast({
          title: "eBay prices updated",
          description: `Successfully updated ${type} prices for ${name}.`,
        });
      } else {
        throw new Error(result.error || `Failed to update ${type} value`);
      }
    } catch (error) {
      console.error(`Error refreshing eBay ${type} value for ${name}:`, error);
      toast({
        title: "Error",
        description: `Failed to update ${type} prices. Please try again.`,
        variant: "destructive",
      });
    } finally {
      if (type === 'sold') {
        setLoadingSoldItemId(null);
      } else {
        setLoadingListedItemId(null);
      }
    }
  };

  // Create custom entity handlers
  const createCustomType = useCallback(async (name: string): Promise<boolean> => {
    try {
      // This would be your actual implementation
      // For example: await createCustomTypeAction({ name });
      console.log('Creating custom type:', name);
      return true;
    } catch (error) {
      console.error('Error creating custom type:', error);
      return false;
    }
  }, []);

  const createCustomFranchise = useCallback(async (name: string): Promise<boolean> => {
    try {
      // This would be your actual implementation
      // For example: await createCustomFranchiseAction({ name });
      console.log('Creating custom franchise:', name);
      return true;
    } catch (error) {
      console.error('Error creating custom franchise:', error);
      return false;
    }
  }, []);

  const createCustomBrand = useCallback(async (name: string): Promise<boolean> => {
    try {
      // This would be your actual implementation
      // For example: await createCustomBrandAction({ name });
      console.log('Creating custom brand:', name);
      return true;
    } catch (error) {
      console.error('Error creating custom brand:', error);
      return false;
    }
  }, []);

  // Handle theme toggle
  const toggleTheme = () => {
    if (setTheme) {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <div className="min-h-screen text-foreground transition-colors duration-200 
      bg-slate-50 dark:bg-[#0A0118] dark:text-white">
      <main className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
          <h1 className="text-4xl font-serif text-primary dark:text-white">Your Collection <span className="dark:text-purple-400">Catalog</span></h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline" 
              size="icon"
              onClick={toggleTheme}
              className="rounded-full w-10 h-10 dark:bg-gray-900/50 dark:text-white dark:border-purple-500/20 dark:hover:bg-gray-800 dark:hover:border-purple-500/40 mr-2"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-purple-400" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            
            <AddItemModal
              onAddItem={addItem}
              customTypes={customTypes}
              customFranchises={customFranchises}
              customBrands={customBrands}
              onLoadCustomTypes={loadCustomTypes}
              onLoadCustomFranchises={loadCustomFranchises}
              onLoadCustomBrands={loadCustomBrands}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Summary Panel */}
        <SummaryPanel
          totalValue={summaryValues.totalValue}
          totalCost={summaryValues.totalCost}
          totalItems={filteredAndSortedItems.length}
          ebayListedValue={summaryValues.ebayListedValue}
          ebaySoldValue={summaryValues.ebaySoldValue}
          showSold={showSold}
        />

        {/* Filter Bar */}
        <FilterBar
          view={view}
          setView={setView}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          franchiseFilter={franchiseFilter}
          setFranchiseFilter={setFranchiseFilter}
          yearFilter={yearFilter}
          setYearFilter={setYearFilter}
          showSold={showSold}
          setShowSold={setShowSold}
          soldYearFilter={soldYearFilter}
          setSoldYearFilter={setSoldYearFilter}
          availableYears={availableYears}
          availableSoldYears={availableSoldYears}
          defaultTypeOptions={itemTypeEnum.enumValues}
          customTypes={customTypes}
          defaultFranchiseOptions={franchiseEnum.enumValues}
          customFranchises={customFranchises}
        />

        {/* Main Content - Conditional rendering based on view type */}
        <div className="mt-6">
          {view === 'list' ? (
            <ItemListView
              items={filteredAndSortedItems}
              isLoading={isLoading}
              onDelete={deleteItem}
              onEbayRefresh={handleEbayRefresh}
              loadingListedItemId={loadingListedItemId}
              loadingSoldItemId={loadingSoldItemId}
              loadingItemId={loadingItemId}
              onSort={handleSort}
              sortDescriptor={sortDescriptor}
              showSold={showSold}
            />
          ) : (
            <ItemGridView
              items={filteredAndSortedItems}
              isLoading={isLoading}
              onDelete={deleteItem}
              showSold={showSold}
              loadingItemId={loadingItemId}
            />
          )}
        </div>

        {/* Empty state */}
        {!isLoading && filteredAndSortedItems.length === 0 && (
          <div className="bg-card dark:bg-gray-900/50 dark:border-gray-800 dark:border-l-purple-400/50 dark:border-l-4 p-8 rounded-lg border border-border mt-6 text-center">
            <h3 className="text-lg font-medium mb-2 dark:text-white">No items found</h3>
            <p className="text-muted-foreground dark:text-gray-300 mb-4">
              {showSold 
                ? "You don't have any sold items matching your filters." 
                : "Your collection is empty or no items match your current filters."}
            </p>
            <AddItemModal
              onAddItem={addItem}
              customTypes={customTypes}
              customFranchises={customFranchises}
              customBrands={customBrands}
              onLoadCustomTypes={loadCustomTypes}
              onLoadCustomFranchises={loadCustomFranchises}
              onLoadCustomBrands={loadCustomBrands}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Items count footer */}
        <div className="mt-6 text-sm text-muted-foreground dark:text-gray-400 text-center">
          {isLoading ? 'Loading items...' : `Showing ${totalCount} ${totalCount === 1 ? 'item' : 'items'}`}
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-border dark:border-purple-500/10">
        <div className="text-center text-sm text-muted-foreground dark:text-gray-400">
          © 2024 <span className="dark:text-purple-400">Collectopedia</span>. All rights reserved.
        </div>
      </footer>
    </div>
  );
} 