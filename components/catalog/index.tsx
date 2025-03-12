/*
 * Updated: Modified to use the new unified image service for optimized image loading.
 * The ImageLoaderComponent and ImagePreloader have been replaced with the new
 * ImageLoader component that provides better performance and mobile optimization.
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
import { ImageLoader } from './image-loader';
import { useImageService } from '@/services/image-service';
import { SelectImage } from '@/db/schema/images-schema';

interface CatalogProps {
  initialItems: SelectItemType[];
  initialTypes: { id: string; name: string }[];
  initialFranchises: { id: string; name: string }[];
  initialBrands: { id: string; name: string }[];
}

export default function Catalog({
  initialItems = [],
  initialTypes = [],
  initialFranchises = [],
  initialBrands = [],
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
  
  // Get access to the new image service
  const imageService = useImageService();

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

  // Map catalog items to image map for the new ImageLoader
  const createImagesMap = useCallback(() => {
    const imagesMap: Record<string, SelectImage[]> = {};
    
    // Process images from items
    items.forEach((item: SelectItemType) => {
      // Check if the item has images
      if (imageCache[item.id] && imageCache[item.id].length > 0) {
        // imageCache already contains SelectImage objects, so just use them directly
        imagesMap[item.id] = imageCache[item.id];
      }
    });
    
    return imagesMap;
  }, [items, imageCache]);

  // Pre-process item images with our new service
  useEffect(() => {
    if (!isLoading && items.length > 0) {
      // Extract all unique item IDs
      const allItemIds = items.map((item: SelectItemType) => item.id);
      // Create image map
      const imagesMap = createImagesMap();
      
      // Use the service to preload images
      if (Object.keys(imagesMap).length > 0) {
        console.log(`[CATALOG] Preloading images for ${Object.keys(imagesMap).length} items with the image service`);
        imageService.preloadItemImages(allItemIds, imagesMap);
      }
    }
  }, [items.length, isLoading, imageService, createImagesMap]);

  const handleShowSoldChange = (show: boolean) => {
    console.log('[CATALOG] Toggling showSold to', show);
    
    // Preload images for both sold and unsold items before changing the filter
    // This prevents the image reloading issue when toggling between views
    const soldItems = items.filter((item: SelectItemType) => item.isSold).map((item: SelectItemType) => item.id);
    const unsoldItems = items.filter((item: SelectItemType) => !item.isSold).map((item: SelectItemType) => item.id);
    
    console.log('[CATALOG] Preloading images for', soldItems.length, 'sold items and', unsoldItems.length, 'unsold items');
    
    // Use both the legacy preloadItemImages and the new image service for smooth transition
    preloadItemImages(soldItems, unsoldItems);
    
    // Also use the new image service
    const imagesMap = createImagesMap();
    imageService.preloadItemImages([...soldItems, ...unsoldItems], imagesMap);
    
    // Then update the filter state
    setShowSold(show);
  };

  return (
    <>
      {/* Use the new ImageLoader instead of the old components */}
      {!isLoading && (
        <ImageLoader 
          itemIds={items.map((item: SelectItemType) => item.id)} 
          images={createImagesMap()} 
          isLoading={isLoading}
        />
      )}
      
      <div className="min-h-screen text-foreground transition-colors duration-200 
        bg-slate-50 dark:bg-black/30">
        <main className="container mx-auto px-4 py-12">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
            <h1 className="text-4xl font-serif text-foreground dark:text-foreground">Your Collection <span className="text-foreground dark:text-foreground">Catalog</span></h1>
            <div className="flex items-center space-x-2">
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

          {/* Item List/Grid View */}
          {view === 'list' ? (
            <ItemListView
              items={filteredAndSortedItems}
              isLoading={isLoading || isUpdatingAllPrices || isUpdatingAllPricesEnhanced}
              loadingItemId={loadingItemId}
              loadingListedItemId={loadingListedItemId}
              loadingSoldItemId={loadingSoldItemId}
              sortDescriptor={sortDescriptor}
              onSort={handleSort}
              showSold={showSold}
            />
          ) : (
            <ItemGridView
              items={filteredAndSortedItems}
              isLoading={isLoading || isUpdatingAllPrices || isUpdatingAllPricesEnhanced}
              loadingItemId={loadingItemId}
              showSold={showSold}
            />
          )}

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