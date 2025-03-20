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
      if (!userId) throw new Error("User not authenticated");
      
      console.log('Adding item with images:', {
        imageCount: newItem.images?.length || 0,
        primaryImage: newItem.image
      });
      
      // Convert catalog item to schema format
      const schemaItem = mapCatalogItemToSchemaItem({
        ...newItem,
        id: crypto.randomUUID(), // Temporary ID for mapping
        userId
      });
      
      // Get current date for timestamps
      const now = new Date();
      
      // Manually create a properly typed object for the addCatalogItem function
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
        image: newItem.image, // Use the original image URL directly
        images: newItem.images, // Preserve the original images array
        condition: schemaItem.condition,
        ebayLastUpdated: schemaItem.ebayLastUpdated || null,
        createdAt: now,
        updatedAt: now
      };
      
      console.log('Prepared item data for server action:', {
        hasImage: !!itemToAdd.image,
        imagesCount: itemToAdd.images?.length || 0
      });
      
      const result = await addCatalogItem(itemToAdd);
      
      return mapSchemaItemToCatalogItem(result);
    },
    onSuccess: (newItem) => {
      // Invalidate catalog queries to refetch
      queryClient.invalidateQueries({ queryKey: ['catalog', userId] });
      
      // Also invalidate the image cache for this item
      // This ensures the UI will display the new images
      if (typeof window !== 'undefined') {
        console.log('[MUTATION] Adding item succeeded, invalidating image cache for:', newItem.id);
        
        // First invalidate React Query cache for item images
        queryClient.invalidateQueries({ queryKey: ['images', newItem.id] });
        
        // Then trigger the DOM event for local cache invalidation
        const cacheEvent = new CustomEvent('invalidate-image-cache', {
          detail: { itemId: newItem.id }
        });
        window.dispatchEvent(cacheEvent);
        
        // Also trigger a direct page refresh, since this is a new item
        // This helps ensure images are reloaded correctly after adding a new item
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['catalog'] });
        }, 500);
      }
      
      toast({
        title: "Success",
        description: "Item added successfully to your collection."
      });
    },
    onError: (error) => {
      console.error("Error adding item:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item",
        variant: "destructive",
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
      queryClient.invalidateQueries({ queryKey: ['catalog', userId] });
    },
    onSuccess: (updatedItem) => {
      // Also invalidate the image cache for this item
      if (typeof window !== 'undefined') {
        console.log('[MUTATION] Update succeeded, invalidating image cache for:', updatedItem.id);
        
        // First invalidate React Query cache
        queryClient.invalidateQueries({ queryKey: ['images', updatedItem.id] });
        
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
      queryClient.invalidateQueries({ queryKey: ['catalog', userId] });
    },
    onSuccess: () => {
      toast({
        title: "Item deleted",
        description: "The item has been removed from your collection."
      });
    }
  });
} 