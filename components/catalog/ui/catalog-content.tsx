/*
 * CatalogContent Component
 * 
 * This component contains the main content of the catalog page.
 * It is responsible for displaying the catalog items, filters, and summary.
 */

"use client"

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { SelectItem as SelectItemType } from "@/db/schema/items-schema"
import { useTheme } from 'next-themes'
import { useBackgroundUpdates } from '@/hooks/use-background-updates'
import { useAuth } from "@clerk/nextjs";
import { useImageCache } from '../context/image-cache-context';
import { useCatalogFilters } from '../hooks/use-catalog-filters';
import { Button } from "@/components/ui/button";
import { PlusCircle, Package, Moon, Sun, Loader2, RefreshCw, BarChart4 } from "lucide-react";
import { FilterBar } from './filter-bar';
import SummaryPanel from './summary-panel';
import { ItemListView } from './item-list-view';
import { ItemGridView } from './item-grid-view';
import { AddItemModal } from './add-item-modal';
import { DEFAULT_BRANDS } from '../utils/schema-adapter';
import { toast } from "@/components/ui/use-toast";
import { itemTypeEnum, franchiseEnum } from '@/db/schema/items-schema';
import { ImageLoader } from '../image-loader';
import { useImageService } from '@/services/image-service';
import { SelectImage } from '@/db/schema/images-schema';

// Add a debug logger helper at the top of the file
const debugLog = (message: string, ...args: any[]) => {
  // Only log in development environment
  if (process.env.NODE_ENV === 'development') {
    console.log(message, ...args);
  }
};

interface CatalogContentProps {
  items: any[];
  isLoading: boolean;
  loadingItemId: string | null;
  fetchItems: () => Promise<any>;
  addItem: (item: any) => Promise<boolean>;
  updateItem: (id: string, item: any) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
  customTypes: { id: string; name: string }[];
  loadCustomTypes: () => Promise<any>;
  customFranchises: { id: string; name: string }[];
  loadCustomFranchises: () => Promise<any>;
  customBrands: { id: string; name: string }[];
  loadCustomBrands: () => Promise<any>;
}

export function CatalogContent({
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
}: CatalogContentProps) {
  const { userId } = useAuth();

  // State for eBay refresh loading states
  const [loadingListedItemId, setLoadingListedItemId] = useState<string | null>(null);
  const [loadingSoldItemId, setLoadingSoldItemId] = useState<string | null>(null);

  // State for updating all prices
  const [isUpdatingAllPrices, setIsUpdatingAllPrices] = useState(false)
  const [isUpdatingAllPricesEnhanced, setIsUpdatingAllPricesEnhanced] = useState(false)

  // State for AI price loading
  const [loadingAiPrice, setLoadingAiPrice] = useState<string | null>(null);

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
    itemsNeedingImageCheck,
    resetFilters,
    view,
    setView
  } = useCatalogFilters({ items });

  // Update the createImagesMap function to reduce logging
  const createImagesMap = useCallback(() => {
    const imagesMap: Record<string, SelectImage[]> = {};
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      // Use debug logger instead of console.log
      debugLog('[CATALOG DEBUG] Creating images map from cache with', Object.keys(imageCache || {}).length, 'cached items');
    }
    
    // Process images from items
    if (items && Array.isArray(items)) {
      items.forEach((item: SelectItemType) => {
        // Check if the item has images
        if (item && item.id && imageCache && imageCache[item.id] && Array.isArray(imageCache[item.id]) && imageCache[item.id].length > 0) {
          // imageCache already contains SelectImage objects, so just use them directly
          imagesMap[item.id] = imageCache[item.id];
          
          // Only log a few sample items in development mode
          if (process.env.NODE_ENV === 'development') {
            // Log only the first item as a sample
            if (Object.keys(imagesMap).length === 1) {
              debugLog(`[CATALOG DEBUG] Sample item ${item.id} (${item.name}) using ${imageCache[item.id].length} images from cache`);
            }
          }
        }
      });
    }
    
    return imagesMap;
  }, [items, imageCache]);

  // Update the useEffect to reduce logging
  useEffect(() => {
    if (!isLoading && items && Array.isArray(items) && items.length > 0) {
      // Extract all unique item IDs
      const allItemIds = items.map((item: SelectItemType) => item.id).filter(Boolean);
      // Create image map
      const imagesMap = createImagesMap();
      
      // Use the service to preload images
      if (imagesMap && Object.keys(imagesMap).length > 0) {
        debugLog(`[CATALOG] Preloading images for ${Object.keys(imagesMap).length} items with the image service`);
        imageService.preloadItemImages(allItemIds, imagesMap);
      }
    }
  }, [items, isLoading, imageService, createImagesMap]);

  // Update the refresh cache effect
  useEffect(() => {
    // This effect should run when the component mounts or if items change
    if (!isLoading && items && Array.isArray(items) && items.length > 0) {
      debugLog('[CATALOG] Component mounted or items changed, refreshing image cache');
      
      // Check if we're coming back from an item detail page with invalidated cache
      let invalidatedItemId: string | null = null;
      if (typeof window !== 'undefined') {
        invalidatedItemId = sessionStorage.getItem('invalidated_item');
        const timestamp = sessionStorage.getItem('invalidated_timestamp');
        
        if (invalidatedItemId && timestamp) {
          // Only consider it valid if it happened in the last 10 seconds
          const timestampNum = parseInt(timestamp);
          const now = Date.now();
          const isRecent = (now - timestampNum) < 10000; // 10 seconds
          
          if (isRecent) {
            console.log(`[CATALOG] Detected recently invalidated item: ${invalidatedItemId}`);
            
            // Clear the session storage
            sessionStorage.removeItem('invalidated_item');
            sessionStorage.removeItem('invalidated_timestamp');
          } else {
            // Too old, ignore it
            invalidatedItemId = null;
          }
        }
      }
      
      // Remove most of the debug logging for localStorage cache
      if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
        try {
          const savedCache = localStorage.getItem('collectopedia-image-cache');
          if (savedCache) {
            const parsedCache = JSON.parse(savedCache);
            debugLog('[CATALOG DEBUG] localStorage cache contains', Object.keys(parsedCache || {}).length, 'items');
          }
        } catch (e) {
          console.error('[CATALOG DEBUG] Error reading localStorage cache:', e);
        }
      }
      
      // Extract IDs of items that might need fresh images
      const itemIds = items.map((item: SelectItemType) => item && item.id).filter(Boolean);
      
      if (invalidatedItemId) {
        // If we have a recently invalidated item, force reload just that one
        if (itemIds.includes(invalidatedItemId)) {
          console.log(`[CATALOG] Force reloading images for invalidated item: ${invalidatedItemId}`);
          loadImages([invalidatedItemId], true); // Force reload just this item
        }
        
        // Also load the rest normally 
        const otherIds = itemIds.filter((id: string) => id !== invalidatedItemId);
        if (otherIds.length > 0) {
          loadImages(otherIds); // Load other items normally
        }
      } else {
        // No recently invalidated items, just load everything normally
        loadImages(itemIds);
      }
    }
  }, [isLoading, items, loadImages]); // Depend on items to refresh when items array changes

  // Modify the timestamp check useEffect
  useEffect(() => {
    if (!isLoading && items && Array.isArray(items) && items.length > 0) {
      // We only need to run this timestamp initialization once per day at most
      // Check if we've run this check recently (within 24 hours)
      const lastCheckTimestamp = localStorage.getItem('last-timestamp-check');
      if (lastCheckTimestamp) {
        const lastCheck = parseInt(lastCheckTimestamp);
        const now = Date.now();
        const hoursSinceLastCheck = (now - lastCheck) / (1000 * 60 * 60);
        
        // Skip if checked within the last 24 hours
        if (hoursSinceLastCheck < 24) {
          debugLog(`[CATALOG] Skipping timestamp check (last checked ${hoursSinceLastCheck.toFixed(1)} hours ago)`);
          return;
        }
      }
        
      const checkImageTimestamps = async () => {
        try {
          // Call the API to update timestamps for items that don't have them
          const response = await fetch('/api/update-image-timestamps');
          const data = await response.json();
          
          debugLog('[CATALOG] Checking for items with missing image timestamps');
          
          if (data && data.success) {
            if (data.updatedCount > 0) {
              console.log(`[CATALOG] Updated ${data.updatedCount} items with missing image timestamps`);
              
              // Force a refresh of all images after updating timestamps
              const allItemIds = items.map((item: SelectItemType) => item && item.id).filter(Boolean);
              invalidateCache(); // Clear entire cache
              if (typeof loadImages === 'function' && allItemIds && allItemIds.length > 0) {
                loadImages(allItemIds, true); // Force reload all images
              }
            } else {
              debugLog('[CATALOG] All items already have timestamps set');
            }
          }
          
          // Store the current timestamp to prevent running too frequently
          // Use localStorage instead of sessionStorage to persist across browser sessions
          localStorage.setItem('last-timestamp-check', Date.now().toString());
        } catch (error) {
          console.error('[CATALOG] Error checking image timestamps:', error);
        }
      };
      
      // Run the timestamp check
      checkImageTimestamps();
    }
  }, [isLoading, items, invalidateCache, loadImages]); // Update dependency array to include full items array

  const handleShowSoldChange = (show: boolean) => {
    console.log('[CATALOG] Toggling showSold to', show);
    
    // Preload images for both sold and unsold items before changing the filter
    // This prevents the image reloading issue when toggling between views
    const soldItems = items && Array.isArray(items) ? 
      items.filter((item: SelectItemType) => item && item.isSold)
           .map((item: SelectItemType) => item.id)
           .filter(Boolean) : [];
           
    const unsoldItems = items && Array.isArray(items) ? 
      items.filter((item: SelectItemType) => item && !item.isSold)
           .map((item: SelectItemType) => item.id)
           .filter(Boolean) : [];
    
    console.log('[CATALOG] Preloading images for', soldItems.length, 'sold items and', unsoldItems.length, 'unsold items');
    
    // Use both the legacy preloadItemImages and the new image service for smooth transition
    preloadItemImages(soldItems, unsoldItems);
    
    // Also use the new image service
    const imagesMap = createImagesMap();
    if (imagesMap) {
      imageService.preloadItemImages([...soldItems, ...unsoldItems], imagesMap);
    }
    
    // Then update the filter state
    setShowSold(show);
  };

  return (
    <>
      {/* Use the new ImageLoader instead of the old components */}
      {!isLoading && items && Array.isArray(items) && items.length > 0 && (
        <ImageLoader 
          itemIds={items.map((item: SelectItemType) => item && item.id).filter(Boolean)} 
          images={createImagesMap()} 
          isLoading={isLoading}
        />
      )}
      
      <div className="min-h-screen text-foreground transition-colors duration-200 
        bg-slate-50 dark:bg-black/30">
        <main className="container mx-auto px-4 py-12">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
            <h1 className="text-4xl font-bold text-foreground dark:text-foreground">My Collection</h1>
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
            resetFilters={resetFilters}
          />

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
              onAddItem={addItem}
              deleteItem={deleteItem}
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

// Add a default export for easier importing
export default CatalogContent; 