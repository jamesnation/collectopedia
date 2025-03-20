/**
 * Catalog Query Hooks
 * 
 * Custom React Query hooks for catalog data operations.
 * These hooks provide a data fetching and state management layer
 * using React Query for better cache control and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { CatalogItem } from "../utils/item-types";
import { mapSchemaItemToCatalogItem, mapCatalogItemToSchemaItem } from "../utils/schema-adapter";
import { SelectItem } from "@/db/schema/items-schema";
import { useToast } from "@/components/ui/use-toast";
import { 
  fetchCatalogItems, 
  addCatalogItem, 
  updateCatalogItem, 
  deleteCatalogItem,
  CatalogQueryParams
} from "@/actions/catalog-actions";

/**
 * Hook for fetching catalog items with React Query
 */
export function useCatalogItemsQuery(params: Omit<CatalogQueryParams, "userId">) {
  const { userId } = useAuth();
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['catalog', userId, params],
    queryFn: async () => {
      if (!userId) throw new Error("User not authenticated");
      
      try {
        const response = await fetchCatalogItems({
          userId,
          ...params
        });
        
        // Map schema items to catalog items
        return {
          ...response,
          items: response.items.map(mapSchemaItemToCatalogItem)
        };
      } catch (error) {
        console.error("Error fetching catalog items:", error);
        toast({
          title: "Error",
          description: "Failed to load your items. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for adding a new catalog item
 */
export function useAddItemMutation() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (newItem: Omit<CatalogItem, 'id' | 'userId'>) => {
      console.error(`[ADD-ITEM] Starting to add item: ${newItem.name}`);
      console.log(`[ADD-ITEM-DEBUG] Item data:`, newItem);
      
      // CRITICAL FIX: Create an absolute timeout for the entire operation
      // This guarantees the function will complete within a reasonable time
      return new Promise<CatalogItem>((resolve, reject) => {
        // Set a hard timeout for the entire operation - REDUCED from 3 minutes to 15 seconds
        const abortTimeout = setTimeout(() => {
          console.error('[ADD-ITEM] Hard timeout reached, aborting operation');
          reject(new Error('Operation timed out after 15 seconds'));
        }, 15000); // 15 second hard timeout - much shorter for testing
        
        // Run the actual operation as an async IIFE
        (async () => {
          try {
            console.log('[ADD-ITEM-DEBUG] Starting async operation');
            if (!userId) {
              console.log('[ADD-ITEM-DEBUG] No userId, aborting');
              clearTimeout(abortTimeout);
              reject(new Error("User not authenticated"));
              return;
            }
            
            // Convert catalog item to schema format
            const schemaItem = mapCatalogItemToSchemaItem({
              ...newItem,
              id: crypto.randomUUID(),
              userId
            });
            
            // Simplify the item creation - focus on core data
            const itemToAdd = {
              userId,
              name: schemaItem.name,
              type: schemaItem.type,
              franchise: schemaItem.franchise,
              brand: schemaItem.brand,
              year: schemaItem.year,
              acquired: schemaItem.acquired,
              cost: schemaItem.cost,
              value: schemaItem.value,
              notes: schemaItem.notes || '',
              isSold: schemaItem.isSold,
              soldDate: schemaItem.soldDate || null,
              soldPrice: schemaItem.soldPrice || null,
              ebayListed: schemaItem.ebayListed || null,
              ebaySold: schemaItem.ebaySold || null,
              ebayLastUpdated: schemaItem.ebayLastUpdated || null,
              image: newItem.image,
              images: newItem.images,
              condition: schemaItem.condition,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            console.error(`[ADD-ITEM] Calling server action for: ${itemToAdd.name}`);
            console.log('[ADD-ITEM-DEBUG] ItemToAdd:', itemToAdd);
            
            // Create a timeout for just the server call - REDUCED from 3 minutes to 15 seconds
            const serverTimeout = 15000; // 15 seconds server timeout - reduced for testing
            
            // Using Promise.race to handle timeout for the server call
            try {
              console.log('[ADD-ITEM-DEBUG] About to call addCatalogItem with timeout:', serverTimeout);
              const result = await Promise.race([
                addCatalogItem(itemToAdd).then(result => {
                  console.log('[ADD-ITEM-DEBUG] addCatalogItem returned successfully:', result);
                  return result;
                }),
                new Promise<never>((_, rejectServer) => {
                  console.log('[ADD-ITEM-DEBUG] Setting up server timeout');
                  return setTimeout(() => {
                    console.log('[ADD-ITEM-DEBUG] SERVER TIMEOUT TRIGGERED');
                    rejectServer(new Error("Server request timed out"));
                  }, serverTimeout);
                })
              ]) as SelectItem;
              
              // If we get here, the server action completed successfully
              console.error(`[ADD-ITEM] Server action successful for: ${result.id}`);
              
              // Clear the abort timeout since we succeeded
              clearTimeout(abortTimeout);
              
              // Force refresh the catalog queries
              setTimeout(() => {
                queryClient.invalidateQueries({ 
                  queryKey: ['catalog'],
                  refetchType: 'none'
                });
              }, 500);
              
              // Resolve with the result
              resolve(mapSchemaItemToCatalogItem(result));
            } catch (serverError) {
              // Server call failed or timed out
              console.error(`[ADD-ITEM] Server action failed:`, serverError);
              
              // Trigger a catalog refresh in case the item was actually added
              setTimeout(() => {
                queryClient.invalidateQueries({ 
                  queryKey: ['catalog'],
                  refetchType: 'none'
                });
              }, 1000);
              
              // Clear the abort timeout and reject with the error
              clearTimeout(abortTimeout);
              reject(serverError);
            }
          } catch (outerError) {
            // Something went wrong outside the server call
            console.error(`[ADD-ITEM] Error in mutation:`, outerError);
            
            // Clear the abort timeout and reject with the error
            clearTimeout(abortTimeout);
            reject(outerError);
          }
        })();
      });
    },
    onSuccess: (newItem: CatalogItem) => {
      console.error(`[ADD-ITEM] Success callback for: ${newItem.id}`);
      
      // Invalidate cache ONCE, with a specific query key
      queryClient.invalidateQueries({ 
        queryKey: ['catalog'],
        // Don't refetch automatically - let components handle that
        refetchType: 'none'
      });
      
      // Show success message
      toast({
        title: "Success",
        description: "Item added successfully to your collection."
      });
    },
    onError: (error) => {
      // Log error in a more noticeable way
      console.error("████████████████████████████████████████");
      console.error("█ [ADD-ITEM] ERROR ADDING ITEM:        █");
      console.error("████████████████████████████████████████");
      console.error(error);
      
      // Store error in localStorage for debugging
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('lastAddItemError', JSON.stringify({
            message: error instanceof Error ? error.message : "Unknown error",
            time: new Date().toISOString(),
            stack: error instanceof Error ? error.stack : null
          }));
        } catch (e) {
          console.error("Could not save error to localStorage:", e);
        }
      }
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item",
        variant: "destructive",
        duration: 10000, // Show toast for 10 seconds
      });
      
      // Invalidate queries to ensure UI is in sync with server state
      queryClient.invalidateQueries({ 
        queryKey: ['catalog'],
        refetchType: 'none'
      });
    }
  });
}

/**
 * Hook for updating a catalog item
 */
export function useUpdateItemMutation() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<CatalogItem> }) => {
      if (!userId) throw new Error("User not authenticated");
      
      // Log image updates if present
      if ('image' in updates || 'images' in updates) {
        console.log('Updating item with image changes:', {
          itemId: id, 
          newPrimaryImage: updates.image ? 'Has new primary image' : 'No new primary image',
          newImagesCount: updates.images?.length || 0
        });
      }
      
      // Map to schema updates
      const schemaUpdates = mapCatalogItemToSchemaItem({
        ...updates,
        id,
        userId
      } as CatalogItem);
      
      // Add updated timestamp
      const updatesWithTimestamp = {
        ...schemaUpdates,
        updatedAt: new Date()
      };
      
      // Make sure images are preserved and not mapped incorrectly
      if (updates.images) {
        updatesWithTimestamp.images = updates.images;
      }
      
      // Make sure the primary image is preserved
      if (updates.image !== undefined) {
        updatesWithTimestamp.image = updates.image === null ? undefined : updates.image;
      }
      
      // Remove id and userId from updates
      const { id: _, userId: __, ...updatesWithoutIds } = updatesWithTimestamp;
      
      const result = await updateCatalogItem(id, updatesWithoutIds as Partial<SelectItem>);
      
      return mapSchemaItemToCatalogItem(result);
    },
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['catalog', userId] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['catalog', userId]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['catalog', userId], (old: any) => {
        if (!old || !old.items) return old;
        
        return {
          ...old,
          items: old.items.map((item: CatalogItem) => {
            if (item.id === id) {
              return { ...item, ...updates, updatedAt: new Date() };
            }
            return item;
          })
        };
      });
      
      // Return a context object with the snapshot
      return { previousData };
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(['catalog', userId], context.previousData);
      }
      
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always invalidate the cache to ensure fresh data
      queryClient.invalidateQueries({ 
        queryKey: ['catalog', userId],
        refetchType: 'none'
      });
    },
    onSuccess: (updatedItem) => {
      // Also invalidate the image cache for this item
      if (typeof window !== 'undefined') {
        console.log('[MUTATION] Update succeeded, invalidating image cache for:', updatedItem.id);
        
        // First invalidate React Query cache
        queryClient.invalidateQueries({ 
          queryKey: ['images', updatedItem.id],
          refetchType: 'none'
        });
        
        // Then trigger DOM event for local cache
        const cacheEvent = new CustomEvent('invalidate-image-cache', {
          detail: { itemId: updatedItem.id }
        });
        window.dispatchEvent(cacheEvent);
      }
      
      toast({
        title: "Success",
        description: "Item updated successfully."
      });
    }
  });
}

/**
 * Hook for deleting a catalog item
 */
export function useDeleteItemMutation() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error("User not authenticated");
      
      return deleteCatalogItem(id);
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['catalog', userId] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['catalog', userId]);
      
      // Optimistically remove the item
      queryClient.setQueryData(['catalog', userId], (old: any) => {
        if (!old || !old.items) return old;
        
        return {
          ...old,
          items: old.items.filter((item: CatalogItem) => item.id !== id),
          totalItems: old.totalItems - 1
        };
      });
      
      // Return a context object with the snapshot
      return { previousData };
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(['catalog', userId], context.previousData);
      }
      
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always invalidate the cache to ensure fresh data
      queryClient.invalidateQueries({ 
        queryKey: ['catalog', userId],
        refetchType: 'none'
      });
    },
    onSuccess: () => {
      toast({
        title: "Item deleted",
        description: "The item has been removed from your collection."
      });
    }
  });
} 