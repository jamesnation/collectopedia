/*
 * Updated: Removed the onDelete prop from the ItemListView component since the 
 * delete functionality has been removed from the list view.
 * The delete functionality is still available in the item details page.
 */

"use client"

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { SelectItem as SelectItemType } from "@/db/schema/items-schema"
import { useTheme } from 'next-themes'
import { useBackgroundUpdates } from '@/hooks/use-background-updates'
import { useAuth } from "@clerk/nextjs";
import { ImageCacheProvider, useImageCache } from './context/image-cache-context';
import { useCatalogItems } from './hooks/use-catalog-items';
import { useCustomEntities } from './hooks/use-custom-entities';
import { useCatalogFilters } from './hooks/use-catalog-filters';
import { Button } from "@/components/ui/button";
import { PlusCircle, Package, Moon, Sun, Loader2, RefreshCw, BarChart4 } from "lucide-react";
import { FilterBar } from './ui/filter-bar';
import SummaryPanel from './ui/summary-panel';
import { ItemListView } from './ui/item-list-view';
import { ItemGridView } from './ui/item-grid-view';
import { AddItemModal } from './ui/add-item-modal';
import { DEFAULT_BRANDS } from './utils/schema-adapter';
import { toast } from "@/components/ui/use-toast";
import { itemTypeEnum, franchiseEnum } from '@/db/schema/items-schema';

interface CatalogProps {
  initialItems: SelectItemType[];
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
  const { userId } = useAuth();

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

  // Wrap everything in the ImageCacheProvider at the top level
  return (
    <ImageCacheProvider>
      <CatalogInner
        userId={userId}
        items={items}
        isLoading={isLoading}
        loadingItemId={loadingItemId}
        fetchItems={fetchItems}
        addItem={addItem}
        updateItem={updateItem}
        deleteItem={deleteItem}
        setItems={setItems}
        customTypes={customTypes}
        loadCustomTypes={loadCustomTypes}
        customFranchises={customFranchises}
        loadCustomFranchises={loadCustomFranchises}
        customBrands={customBrands}
        loadCustomBrands={loadCustomBrands}
        theme={theme}
        setTheme={setTheme}
      />
    </ImageCacheProvider>
  );
}

// Inner component with access to the image cache
function CatalogInner({
  userId,
  items,
  isLoading,
  loadingItemId,
  fetchItems,
  addItem,
  updateItem,
  deleteItem,
  setItems,
  customTypes,
  loadCustomTypes,
  customFranchises,
  loadCustomFranchises,
  customBrands,
  loadCustomBrands,
  theme,
  setTheme
}: {
  userId: string | null | undefined;
} & Record<string, any>) {
  // State for eBay refresh loading states
  const [loadingListedItemId, setLoadingListedItemId] = useState<string | null>(null);
  const [loadingSoldItemId, setLoadingSoldItemId] = useState<string | null>(null);

  // State for updating all prices
  const [isUpdatingAllPrices, setIsUpdatingAllPrices] = useState(false)
  const [isUpdatingAllPricesEnhanced, setIsUpdatingAllPricesEnhanced] = useState(false)

  // State for AI price loading
  const [loadingAiPrice, setLoadingAiPrice] = useState<string | null>(null);

  // State for view and filter
  const [view, setView] = useState<'list' | 'grid'>('grid');

  // Get imageCache context
  const { 
    imageCache, 
    isLoading: isLoadingImages, 
    loadImages,
    preloadItemImages,
    invalidateCache,
    hasImages
  } = useImageCache();

  const {
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
    handleSort,
    showWithImages,
    setShowWithImages,
    itemsNeedingImageCheck
  } = useCatalogFilters({ items });

  // Handle eBay refresh
  const handleEbayRefresh = async (id: string, name: string, type: 'sold' | 'listed') => {
    if (type === 'sold') {
      setLoadingSoldItemId(id);
    } else {
      setLoadingListedItemId(id);
    }

    try {
      // Find the item to get its condition
      const item = items.find((item: SelectItemType) => item.id === id);
      if (!item) {
        throw new Error('Item not found');
      }

      // Call the real eBay API through our server action
      const { updateEbayPrices } = await import('@/actions/ebay-actions');
      const result = await updateEbayPrices(id, name, type, item.condition, item.franchise);
      
      if (result.success) {
        console.log('eBay update result:', result);
        
        // Update the local state with the new value
        const updatedItems = items.map((item: SelectItemType) => {
          if (item.id === id) {
            return {
              ...item,
              ebayListed: type === 'listed' ? result.prices?.median || item.ebayListed : item.ebayListed,
              ebaySold: type === 'sold' ? result.prices?.median || item.ebaySold : item.ebaySold
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

  // Handle updating all prices for a user (only listed prices)
  const handleUpdateAllPrices = async () => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to update prices.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUpdatingAllPrices(true);
      
      const { refreshAllEbayPrices } = await import('@/actions/ebay-actions');
      const result = await refreshAllEbayPrices(userId);
      
      if (result.success) {
        toast({
          title: "Prices updated",
          description: `Successfully updated prices for ${result.totalUpdated} items.`,
        });
        
        // Refresh the items to get the latest prices
        await fetchItems();
      } else {
        throw new Error(result.error || 'Failed to update prices');
      }
    } catch (error) {
      console.error('Error updating all prices:', error);
      toast({
        title: "Error",
        description: "Failed to update prices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingAllPrices(false);
    }
  };
  
  // Handle updating all prices using enhanced image-based search
  const handleUpdateAllPricesEnhanced = async () => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to update prices.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUpdatingAllPricesEnhanced(true);
      
      const { refreshAllItemPricesEnhanced } = await import('@/actions/ebay-actions');
      const result = await refreshAllItemPricesEnhanced(userId);
      
      if (result.success) {
        toast({
          title: "Enhanced price update",
          description: `Updated prices for ${result.totalUpdated} items using text and image search.`,
        });
        
        // Refresh the items to get the latest prices
        await fetchItems();
      } else {
        throw new Error(result.error || 'Failed to update prices');
      }
    } catch (error) {
      console.error('Error updating all prices with enhanced search:', error);
      toast({
        title: "Error",
        description: "Failed to update prices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingAllPricesEnhanced(false);
    }
  };

  // Handle AI price update
  const handleRefreshAiPrice = async (id: string, name: string, type: 'listed' | 'sold') => {
    try {
      setLoadingAiPrice(id);
      const item = items.find((i: SelectItemType) => i.id === id);
      if (!item) {
        throw new Error('Item not found');
      }
      
      console.log('Refreshing AI price for item:', {
        name: item.name,
        franchise: item.franchise,
        condition: item.condition
      });
      
      const ebayActions = await import('@/actions/ebay-actions');
      const result = await ebayActions.updateEbayPrices(
        id,
        item.name.trim(), // Trim the name to remove any extra spaces
        type,
        item.condition,
        item.franchise
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update AI price');
      }
      
      // Update the item in the local state
      const updatedItems = items.map((i: SelectItemType) => {
        if (i.id === id) {
          return {
            ...i,
            [type === 'listed' ? 'ebayListed' : 'ebaySold']: result.prices?.median || null
          };
        }
        return i;
      });
      setItems(updatedItems);
      
      toast({
        title: "AI Price updated",
        description: `Successfully updated AI price for ${name}.`,
      });
    } catch (error) {
      console.error('Error updating AI price:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update AI price',
        variant: "destructive",
      });
    } finally {
      setLoadingAiPrice(null);
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

  // Load data on component mount
  useEffect(() => {
    fetchItems();
    loadCustomTypes();
    loadCustomFranchises();
    loadCustomBrands();
  }, [fetchItems, loadCustomTypes, loadCustomFranchises, loadCustomBrands]);

  const handleShowSoldChange = (show: boolean) => {
    console.log('[CATALOG] Toggling showSold to', show);
    
    // Preload images for both sold and unsold items before changing the filter
    // This prevents the image reloading issue when toggling between views
    const soldItems = items.filter((item: SelectItemType) => item.isSold).map((item: SelectItemType) => item.id);
    const unsoldItems = items.filter((item: SelectItemType) => !item.isSold).map((item: SelectItemType) => item.id);
    
    console.log('[CATALOG] Preloading images for', soldItems.length, 'sold items and', unsoldItems.length, 'unsold items');
    
    // Use the new preloadItemImages function to load all images at once
    preloadItemImages(soldItems, unsoldItems);
    
    // Then update the filter state
    setShowSold(show);
  };

  return (
    <>
      {/* Add ImagePreloader inside the ImageCacheProvider context */}
      <ImagePreloader items={items} />
      
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
            unsoldTotalCost={summaryValues.unsoldTotalCost}
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
            setShowSold={handleShowSoldChange}
            soldYearFilter={soldYearFilter}
            setSoldYearFilter={setSoldYearFilter}
            availableYears={availableYears}
            availableSoldYears={availableSoldYears}
            defaultTypeOptions={itemTypeEnum.enumValues}
            customTypes={customTypes}
            defaultFranchiseOptions={franchiseEnum.enumValues}
            customFranchises={customFranchises}
            showWithImages={showWithImages}
            setShowWithImages={setShowWithImages}
          />

          {/* If showWithImages is true and we have itemIds to check, use an inner component to handle image loading */}
          {showWithImages && itemsNeedingImageCheck.length > 0 && !isLoading && (
            <div key="image-loader-wrapper">
              <ImageLoaderComponent key={`image-loader-${Date.now()}`} itemIds={itemsNeedingImageCheck} />
            </div>
          )}
          
          <div className="mt-6">
            {view === 'list' ? (
              <ItemListView
                items={filteredAndSortedItems}
                isLoading={isLoading}
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
            <div className="bg-card dark:bg-card/60 dark:border-border dark:border-l-primary/30 dark:border-l-4 p-8 rounded-lg border border-border mt-6 text-center">
              <h3 className="text-lg font-medium mb-2 dark:text-foreground">No items found</h3>
              <p className="text-muted-foreground dark:text-muted-foreground mb-4">
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
          <div className="mt-6 text-sm text-muted-foreground dark:text-muted-foreground text-center">
            {isLoading ? 'Loading items...' : `Showing ${totalCount} ${totalCount === 1 ? 'item' : 'items'}`}
          </div>
        </main>

        <footer className="container mx-auto px-4 py-8 mt-12 border-t border-border dark:border-border">
          <div className="text-center text-sm text-muted-foreground dark:text-muted-foreground">
            © 2024 <span className="dark:text-purple-400">Collectopedia</span>. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}

// Create a helper component to load images when needed
function ImageLoaderComponent({ itemIds }: { itemIds: string[] }) {
  const { loadImages, imageCache, hasCompletedLoading } = useImageCache();
  
  // Store itemIds in a ref to prevent dependency changes that cause re-renders
  const itemIdsRef = useRef<string[]>(itemIds);
  
  // Add diagnostic logging - only run once when mounted
  useEffect(() => {
    console.log('[IMAGE LOADER] Component mounted with', itemIdsRef.current.length, 'items to check');
    
    // Log the current state of the image cache
    console.log('[IMAGE LOADER] Current image cache state:', {
      cacheKeys: Object.keys(imageCache).length,
      completedLoadingKeys: Object.keys(hasCompletedLoading).length,
      itemsWithImages: Object.keys(imageCache).filter((id: string) => imageCache[id]?.length > 0).length
    });
    
    // Only load images once when the component mounts
    if (itemIdsRef.current.length > 0) {
      console.log('[IMAGE LOADER] Loading images for items with "Has Images" filter:', itemIdsRef.current.length);
      loadImages(itemIdsRef.current);
      
      // Add a timeout to log cache state after images have had time to load
      const timer = setTimeout(() => {
        console.log('[IMAGE LOADER] Image cache state after timeout:', {
          cacheKeys: Object.keys(imageCache).length,
          completedLoadingKeys: Object.keys(hasCompletedLoading).length,
          itemsWithImages: Object.keys(imageCache).filter((id: string) => imageCache[id]?.length > 0).length
        });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  // Empty dependency array to ensure this only runs once when mounted
  }, []);
  
  // This is just a loading handler, doesn't render anything
  return null;
}

// Updated ImagePreloader to use the context directly
function ImagePreloader({ items }: { items: SelectItemType[] }) {
  // Get the preloadItemImages function from the context
  const { preloadItemImages } = useImageCache();
  
  // Only run this effect once when the component mounts
  useEffect(() => {
    if (items.length > 0) {
      console.log('[PRELOADER] Preloading images for all items on initial load');
      
      const soldItems = items.filter((item: SelectItemType) => item.isSold).map((item: SelectItemType) => item.id);
      const unsoldItems = items.filter((item: SelectItemType) => !item.isSold).map((item: SelectItemType) => item.id);
      
      // Preload all images at once
      preloadItemImages(soldItems, unsoldItems);
    }
  }, [items.length, preloadItemImages]); // Add preloadItemImages to dependencies

  // This component doesn't render anything visible
  return null;
} 