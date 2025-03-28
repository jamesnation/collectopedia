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
import { getImagesByItemIdAction } from '@/actions/images-actions';

interface CatalogProps {
  initialItems: SelectItemType[];
  initialTypes: { id: string; name: string }[];
  initialFranchises: { id: string; name: string }[];
  initialBrands: { id: string; name: string }[];
}

// Add a debug logger helper at the top of the file
const debugLog = (message: string, ...args: any[]) => {
  // Only log in development environment
  if (process.env.NODE_ENV === 'development') {
    console.log(message, ...args);
  }
};

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
      debugLog('[CATALOG DEBUG] Creating images map from cache with', Object.keys(imageCache).length, 'cached items');
    }
    
    // Process images from items
    items.forEach((item: SelectItemType) => {
      // Check if the item has images
      if (imageCache[item.id] && imageCache[item.id].length > 0) {
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
    
    return imagesMap;
  }, [items, imageCache]);

  // Update the useEffect to reduce logging
  useEffect(() => {
    if (!isLoading && items.length > 0) {
      // Extract all unique item IDs
      const allItemIds = items.map((item: SelectItemType) => item.id);
      // Create image map
      const imagesMap = createImagesMap();
      
      // Use the service to preload images
      if (Object.keys(imagesMap).length > 0) {
        debugLog(`[CATALOG] Preloading images for ${Object.keys(imagesMap).length} items with the image service`);
        imageService.preloadItemImages(allItemIds, imagesMap);
      }
    }
  }, [items, isLoading, imageService, createImagesMap]);

  // Update the refresh cache effect
  useEffect(() => {
    // This effect should run when the component mounts or if items change
    if (!isLoading && items.length > 0) {
      debugLog('[CATALOG] Component mounted or items changed, refreshing image cache');
      
      // Check if we're coming back from an item detail page with invalidated cache
      let invalidatedItemId: string | null = null;
      let forceReloadImages = false;
      
      if (typeof window !== 'undefined') {
        invalidatedItemId = sessionStorage.getItem('invalidated_item');
        const timestamp = sessionStorage.getItem('invalidated_timestamp');
        forceReloadImages = sessionStorage.getItem('force_reload_images') === 'true';
        
        if (invalidatedItemId && timestamp) {
          // Only consider it valid if it happened in the last 30 seconds (increased from 10s)
          const timestampNum = parseInt(timestamp);
          const now = Date.now();
          const isRecent = (now - timestampNum) < 30000; // 30 seconds
          
          if (isRecent) {
            console.log(`[CATALOG] Detected recently invalidated item: ${invalidatedItemId}, forceReload: ${forceReloadImages}`);
            
            // Clear the session storage
            sessionStorage.removeItem('invalidated_item');
            sessionStorage.removeItem('invalidated_timestamp');
            sessionStorage.removeItem('force_reload_images');
          } else {
            // Too old, ignore it
            invalidatedItemId = null;
            forceReloadImages = false;
          }
        }
      }
      
      // Remove most of the debug logging for localStorage cache
      if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
        try {
          const savedCache = localStorage.getItem('collectopedia-image-cache');
          if (savedCache) {
            const parsedCache = JSON.parse(savedCache);
            debugLog('[CATALOG DEBUG] localStorage cache contains', Object.keys(parsedCache).length, 'items');
          }
        } catch (e) {
          console.error('[CATALOG DEBUG] Error reading localStorage cache:', e);
        }
      }
      
      // Extract IDs of items that might need fresh images
      const itemIds = items.map((item: SelectItemType) => item.id);
      
      if (invalidatedItemId) {
        // If we have a recently invalidated item, force reload just that one
        if (itemIds.includes(invalidatedItemId)) {
          console.log(`[CATALOG] Force reloading images for invalidated item: ${invalidatedItemId}`);
          
          // If force reload flag is set, invalidate cache first to ensure fresh data
          if (forceReloadImages) {
            invalidateCache(invalidatedItemId);
            // Add a small delay to ensure cache is cleared before loading
            setTimeout(() => {
              loadImages([invalidatedItemId], true); // Force reload just this item
            }, 50);
          } else {
            loadImages([invalidatedItemId], true); // Force reload just this item
          }
        }
        
        // Also load the rest normally (with a slight delay to prioritize the invalidated item)
        const otherIds = itemIds.filter((id: string) => id !== invalidatedItemId);
        if (otherIds.length > 0) {
          setTimeout(() => {
            console.log(`[CATALOG] Loading ${otherIds.length} other items after handling invalidated item`);
            loadImages(otherIds); // Load other items normally
          }, 100);
        }
      } else {
        // No recently invalidated items, just load everything normally
        console.log(`[CATALOG] No invalidated items detected, loading all ${itemIds.length} items normally`);
        loadImages(itemIds);
      }
    }
  // Use the items.length instead of the entire items array to reduce unnecessary renders
  }, [isLoading, items.length, loadImages, invalidateCache, items]);

  // Modify the timestamp check useEffect
  useEffect(() => {
    if (!isLoading && items.length > 0) {
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
          
          if (data.success) {
            if (data.updatedCount > 0) {
              console.log(`[CATALOG] Updated ${data.updatedCount} items with missing image timestamps`);
              
              // Force a refresh of all images after updating timestamps
              const allItemIds = items.map((item: SelectItemType) => item.id);
              invalidateCache(); // Clear entire cache
              loadImages(allItemIds, true); // Force reload all images
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
  }, [isLoading, items, loadImages, invalidateCache]); // Include all dependencies

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

  // Add a new useEffect for checking localStorage for invalidated items
  useEffect(() => {
    // This effect focuses specifically on localStorage refresh flags
    if (!isLoading && items.length > 0) {
      console.log('[CATALOG-CACHE-FIX] Checking localStorage for invalidated items');
      
      if (typeof window !== 'undefined') {
        // Check localStorage for invalidated items
        const localStorageInvalidatedItem = localStorage.getItem('collectopedia-force-refresh-item');
        const localStorageTimestamp = localStorage.getItem('collectopedia-force-refresh-timestamp');
        
        console.log(`[CATALOG-CACHE-FIX] localStorage check:
          - invalidated_item: ${localStorageInvalidatedItem || 'not set'}
          - timestamp: ${localStorageTimestamp || 'not set'}`);
        
        // Process localStorage invalidated item if recent
        if (localStorageInvalidatedItem && localStorageTimestamp) {
          const timestampNum = parseInt(localStorageTimestamp);
          const now = Date.now();
          const isRecent = (now - timestampNum) < 60000; // 60 seconds
          
          console.log(`[CATALOG-CACHE-FIX] localStorage timestamp check:
            - Timestamp: ${timestampNum}
            - Current time: ${now}
            - Difference: ${(now - timestampNum)/1000}s
            - Is recent: ${isRecent}`);
          
          if (isRecent) {
            console.log(`[CATALOG-CACHE-FIX] Found recent localStorage invalidation for item: ${localStorageInvalidatedItem}`);
            
            // Clear the flags
            localStorage.removeItem('collectopedia-force-refresh-item');
            localStorage.removeItem('collectopedia-force-refresh-timestamp');
            
            // Check if item exists in current items list
            const itemExists = items.some((item: SelectItemType) => item.id === localStorageInvalidatedItem);
            
            if (itemExists) {
              console.log(`[CATALOG-CACHE-FIX] Force refreshing item: ${localStorageInvalidatedItem}`);
              
              // Force direct refetch from backend
              getImagesByItemIdAction(localStorageInvalidatedItem)
                .then((result: { isSuccess: boolean; data?: SelectImage[] }) => {
                  if (result.isSuccess && result.data) {
                    console.log(`[CATALOG-CACHE-FIX] Fetched ${result.data.length} fresh images for item ${localStorageInvalidatedItem}`);
                    
                    // Directly update the local cache and force a rerender
                    try {
                      const cacheData = localStorage.getItem('collectopedia-image-cache');
                      if (cacheData) {
                        const cache = JSON.parse(cacheData);
                        if (cache[localStorageInvalidatedItem]) {
                          // Update the cache with fresh images and current timestamp
                          cache[localStorageInvalidatedItem] = {
                            images: result.data,
                            cachedAt: Date.now()
                          };
                          
                          // Save updated cache
                          localStorage.setItem('collectopedia-image-cache', JSON.stringify(cache));
                          console.log(`[CATALOG-CACHE-FIX] Updated localStorage cache for item ${localStorageInvalidatedItem}`);
                          
                          // Force reload in image cache context
                          loadImages([localStorageInvalidatedItem], true);
                          
                          // Force redraw by updating the map directly
                          createImagesMap();
                        }
                      }
                    } catch (error: any) {
                      console.error('[CATALOG-CACHE-FIX] Error updating cache:', error);
                    }
                  }
                })
                .catch((error: Error) => {
                  console.error(`[CATALOG-CACHE-FIX] Error fetching images:`, error);
                });
            } else {
              console.log(`[CATALOG-CACHE-FIX] Item ${localStorageInvalidatedItem} not found in current items list`);
            }
          } else {
            // Too old, clear the flags
            console.log(`[CATALOG-CACHE-FIX] Invalidation timestamp too old (${(now - timestampNum)/1000}s), clearing flags`);
            localStorage.removeItem('collectopedia-force-refresh-item');
            localStorage.removeItem('collectopedia-force-refresh-timestamp');
          }
        }
        
        // Also check for items with cachedAt=0 in the image cache (direct cache invalidation method)
        try {
          const cacheData = localStorage.getItem('collectopedia-image-cache');
          if (cacheData) {
            const cache = JSON.parse(cacheData);
            let foundInvalidated = false;
            
            // Check each item in cache
            Object.entries(cache).forEach(([itemId, data]: [string, any]) => {
              if (data.cachedAt === 0) {
                console.log(`[CATALOG-CACHE-FIX] Found item ${itemId} with cachedAt=0, forcing refresh`);
                foundInvalidated = true;
                
                // Check if item exists in current items list
                const itemExists = items.some((item: SelectItemType) => item.id === itemId);
                
                if (itemExists) {
                  // Force reload this item
                  getImagesByItemIdAction(itemId)
                    .then((result: { isSuccess: boolean; data?: SelectImage[] }) => {
                      if (result.isSuccess && result.data) {
                        console.log(`[CATALOG-CACHE-FIX] Fetched ${result.data.length} fresh images for invalidated cache item ${itemId}`);
                        
                        // Update the cache
                        cache[itemId] = {
                          images: result.data,
                          cachedAt: Date.now()
                        };
                        
                        // Save updated cache
                        localStorage.setItem('collectopedia-image-cache', JSON.stringify(cache));
                        
                        // Force reload in cache context
                        loadImages([itemId], true);
                      }
                    })
                    .catch((error: Error) => {
                      console.error(`[CATALOG-CACHE-FIX] Error fetching images for invalidated item ${itemId}:`, error);
                    });
                }
              }
            });
            
            if (foundInvalidated) {
              // Save the updated cache after processing all invalidated items
              localStorage.setItem('collectopedia-image-cache', JSON.stringify(cache));
            }
          }
        } catch (error) {
          console.error('[CATALOG-CACHE-FIX] Error checking cache for invalidated items:', error);
        }
      }
    }
  }, [isLoading, items, loadImages, createImagesMap]);

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
            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">My Collection</h1>
            </div>
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