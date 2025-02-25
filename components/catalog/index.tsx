"use client"

import { useEffect, useState, useCallback } from 'react';
import { SelectItem } from '@/db/schema/items-schema';
import { itemTypeEnum, brandEnum } from '@/db/schema/items-schema';
import { Button } from "@/components/ui/button";
import { PlusCircle, Package } from "lucide-react";
import { FilterBar } from './ui/filter-bar';
import SummaryPanel from './ui/summary-panel';
import { ItemListView } from './ui/item-list-view';
import { ItemGridView } from './ui/item-grid-view';
import { AddItemModal } from './ui/add-item-modal';
import { CSVImportButton } from './ui/csv-import-button';
import { DEFAULT_MANUFACTURERS } from './utils/schema-adapter';
import { toast } from "@/components/ui/use-toast";

// Import custom hooks
import { useCatalogItems } from './hooks/use-catalog-items';
import { useCustomEntities } from './hooks/use-custom-entities';
import { useCatalogFilters } from './hooks/use-catalog-filters';

interface CatalogProps {
  initialItems: SelectItem[];
  initialTypes: { id: string; name: string }[];
  initialBrands: { id: string; name: string }[];
  initialManufacturers: { id: string; name: string }[];
}

export default function Catalog({
  initialItems = [],
  initialTypes = [],
  initialBrands = [],
  initialManufacturers = []
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
    customBrands,
    loadCustomBrands,
    customManufacturers,
    loadCustomManufacturers,
  } = useCustomEntities({
    initialTypes,
    initialBrands,
    initialManufacturers
  });

  const {
    view,
    setView,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    brandFilter,
    setBrandFilter,
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
    loadCustomBrands();
    loadCustomManufacturers();
  }, [fetchItems, loadCustomTypes, loadCustomBrands, loadCustomManufacturers]);

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

  const createCustomManufacturer = useCallback(async (name: string): Promise<boolean> => {
    try {
      // This would be your actual implementation
      // For example: await createCustomManufacturerAction({ name });
      console.log('Creating custom manufacturer:', name);
      return true;
    } catch (error) {
      console.error('Error creating custom manufacturer:', error);
      return false;
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-foreground">
      <main className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
          <h1 className="text-4xl font-serif text-primary">Your Collection Catalog</h1>
          <div className="flex space-x-2">
            <AddItemModal
              onAddItem={addItem}
              customTypes={customTypes}
              customBrands={customBrands}
              customManufacturers={customManufacturers}
              onLoadCustomTypes={loadCustomTypes}
              onLoadCustomBrands={loadCustomBrands}
              onLoadCustomManufacturers={loadCustomManufacturers}
              isLoading={isLoading}
            />
            <CSVImportButton
              onAddItem={addItem}
              onCreateCustomType={createCustomType}
              onCreateCustomBrand={createCustomBrand}
              onCreateCustomManufacturer={createCustomManufacturer}
              onLoadCustomTypes={loadCustomTypes}
              onLoadCustomBrands={loadCustomBrands}
              onLoadCustomManufacturers={loadCustomManufacturers}
              defaultTypeOptions={itemTypeEnum.enumValues}
              defaultBrandOptions={brandEnum.enumValues}
              defaultManufacturerOptions={DEFAULT_MANUFACTURERS}
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
          brandFilter={brandFilter}
          setBrandFilter={setBrandFilter}
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
          defaultBrandOptions={brandEnum.enumValues}
          customBrands={customBrands}
        />

        {/* Main Content - Conditional rendering based on view type */}
        <div className="mt-6">
          {view === 'list' ? (
            <ItemListView
              items={filteredAndSortedItems}
              isLoading={isLoading}
              sortDescriptor={sortDescriptor}
              onSort={handleSort}
              onDelete={deleteItem}
              onEbayRefresh={handleEbayRefresh}
              showSold={showSold}
              loadingItemId={loadingItemId}
              loadingListedItemId={loadingListedItemId}
              loadingSoldItemId={loadingSoldItemId}
            />
          ) : (
            <ItemGridView
              items={filteredAndSortedItems}
              isLoading={isLoading}
              onDelete={deleteItem}
              onEbayRefresh={handleEbayRefresh}
              showSold={showSold}
              loadingItemId={loadingItemId}
              loadingListedItemId={loadingListedItemId}
              loadingSoldItemId={loadingSoldItemId}
            />
          )}
        </div>

        {/* Empty state */}
        {!isLoading && filteredAndSortedItems.length === 0 && (
          <div className="bg-card p-8 rounded-lg border border-border mt-6 text-center">
            <h3 className="text-lg font-medium mb-2">No items found</h3>
            <p className="text-muted-foreground mb-4">
              {showSold 
                ? "You don't have any sold items matching your filters." 
                : "Your collection is empty or no items match your current filters."}
            </p>
            <AddItemModal
              onAddItem={addItem}
              customTypes={customTypes}
              customBrands={customBrands}
              customManufacturers={customManufacturers}
              onLoadCustomTypes={loadCustomTypes}
              onLoadCustomBrands={loadCustomBrands}
              onLoadCustomManufacturers={loadCustomManufacturers}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Items count footer */}
        <div className="mt-6 text-sm text-muted-foreground text-center">
          {isLoading ? 'Loading items...' : `Showing ${totalCount} ${totalCount === 1 ? 'item' : 'items'}`}
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-border">
        <div className="text-center text-sm text-muted-foreground">
          © 2024 Collectopedia. All rights reserved.
        </div>
      </footer>
    </div>
  );
} 