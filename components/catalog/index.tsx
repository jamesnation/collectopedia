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
import { DEFAULT_BRANDS, CatalogItem } from './utils/schema-adapter';
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

  // Load data on component mount
  useEffect(() => {
    fetchItems();
    loadCustomTypes();
    loadCustomFranchises();
    loadCustomBrands();
  }, [fetchItems, loadCustomTypes, loadCustomFranchises, loadCustomBrands]);

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

  // Wrap addItem to return a boolean
  const handleAddItem = async (newItem: Omit<CatalogItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      await addItem(newItem);
      return true;
    } catch (error) {
      console.error('Error adding item:', error);
      return false;
    }
  };

  return (
    <div className="min-h-screen text-foreground transition-colors duration-200 
      bg-slate-50 dark:bg-black/30">
      <main className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
          <h1 className="text-4xl font-serif text-foreground dark:text-foreground">Your Collection <span className="text-foreground dark:text-foreground">Catalog</span></h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline" 
              size="icon"
              onClick={toggleTheme}
              className="rounded-full w-10 h-10 dark:bg-card/50 dark:text-foreground dark:border-border dark:hover:bg-card dark:hover:border-primary/40 mr-2"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-purple-400" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            
            <AddItemModal
              onAddItem={handleAddItem}
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
          aiEstimateLow={summaryValues.aiEstimateLow}
          aiEstimateHigh={summaryValues.aiEstimateHigh}
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

        {/* Item List/Grid View */}
        {view === 'list' ? (
          <ItemListView
            items={filteredAndSortedItems}
            isLoading={isLoading}
            sortDescriptor={sortDescriptor}
            onSort={handleSort}
            showSold={showSold}
          />
        ) : (
          <ItemGridView
            items={filteredAndSortedItems}
            isLoading={isLoading}
            showSold={showSold}
          />
        )}
      </main>
    </div>
  );
} 