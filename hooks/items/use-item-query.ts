"use client";

/**
 * hooks/items/use-item-query.ts
 * 
 * This file contains React Query hooks for item operations.
 * It provides fetching, caching, and optimistic updates for item data.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ItemCondition } from "@/types/item-types";

// Item and HistoryEvent types
interface Item {
  id: string;
  name: string;
  type: string;
  franchise: string;
  brand: string;
  year: number | null;
  condition: ItemCondition;
  acquired: Date | null;
  notes: string | null;
  cost: number;
  value: number;
  soldPrice: number | null;
  soldDate: Date | null;
  isSold: boolean;
  ebayListed: number | null;
  images: { id: string; url: string; alt?: string }[];
  isLoadingAiPrice?: boolean;
  debugData?: any;
}

interface HistoryEvent {
  id: string;
  type: 'created' | 'updated' | 'priceChange' | 'sold' | 'purchased' | 'statusChange';
  timestamp: string;
  details: {
    field?: string;
    oldValue?: string | number | null;
    newValue?: string | number | null;
    price?: number;
    note?: string;
  };
}

// Query keys
export const ITEM_QUERY_KEYS = {
  all: ['items'] as const,
  lists: () => ['items', 'list'] as const,
  list: (filters: string) => ['items', 'list', filters] as const,
  details: () => ['items', 'detail'] as const,
  detail: (id: string) => ['items', 'detail', id] as const,
  history: (id: string) => ['items', 'history', id] as const,
  prices: (id: string) => ['items', 'prices', id] as const,
};

/**
 * Hook for fetching a single item's details
 */
export function useItemQuery(
  itemId: string,
  loadItem: (id: string) => Promise<Item>
) {
  return useQuery({
    queryKey: ITEM_QUERY_KEYS.detail(itemId),
    queryFn: () => loadItem(itemId),
    enabled: !!itemId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for fetching an item's history events
 */
export function useItemHistoryQuery(
  itemId: string,
  loadHistoryEvents: (id: string) => Promise<HistoryEvent[]>
) {
  return useQuery({
    queryKey: ITEM_QUERY_KEYS.history(itemId),
    queryFn: () => loadHistoryEvents(itemId),
    enabled: !!itemId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for updating an item with optimistic updates
 */
export function useUpdateItemMutation(
  updateItem: (id: string, data: Partial<Item>) => Promise<Item>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Item> }) => 
      updateItem(id, data),
    
    // When mutate is called:
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches 
      await queryClient.cancelQueries({ queryKey: ITEM_QUERY_KEYS.detail(id) });
      
      // Snapshot the previous value
      const previousItem = queryClient.getQueryData<Item>(ITEM_QUERY_KEYS.detail(id));
      
      // Optimistically update to the new value
      if (previousItem) {
        queryClient.setQueryData<Item>(
          ITEM_QUERY_KEYS.detail(id),
          { ...previousItem, ...data }
        );
      }
      
      return { previousItem };
    },
    
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, { id }, context) => {
      if (context?.previousItem) {
        queryClient.setQueryData<Item>(
          ITEM_QUERY_KEYS.detail(id),
          context.previousItem
        );
      }
      toast.error("Failed to update item");
    },
    
    // Always refetch after error or success to ensure data is consistent
    // But avoid causing new state updates by setting stale time
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ 
        queryKey: ITEM_QUERY_KEYS.detail(id),
        refetchType: 'none' // Don't trigger immediate refetch
      });
      toast.success("Item updated successfully");
    },
  });
}

/**
 * Hook for deleting an item
 */
export function useDeleteItemMutation(
  deleteItem: (id: string) => Promise<void>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    
    onSuccess: (_, id) => {
      // Invalidate lists and remove from item cache
      queryClient.invalidateQueries({ queryKey: ITEM_QUERY_KEYS.lists() });
      queryClient.removeQueries({ queryKey: ITEM_QUERY_KEYS.detail(id) });
      
      toast.success("Item deleted successfully");
    },
    
    onError: () => {
      toast.error("Failed to delete item");
    },
  });
}

/**
 * Hook for refreshing an item's AI price
 */
export function useRefreshAiPriceMutation(
  refreshAiPrice: (id: string) => Promise<number | null | { price: number; debugData: any }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => refreshAiPrice(id),
    
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ITEM_QUERY_KEYS.detail(id) });
      await queryClient.cancelQueries({ queryKey: ITEM_QUERY_KEYS.prices(id) });
      
      const previousItem = queryClient.getQueryData<Item>(ITEM_QUERY_KEYS.detail(id));
      
      if (previousItem) {
        queryClient.setQueryData<Item>(
          ITEM_QUERY_KEYS.detail(id),
          { ...previousItem, isLoadingAiPrice: true }
        );
      }
      
      return { previousItem };
    },
    
    onSuccess: (result, id) => {
      // Get the current item data
      const item = queryClient.getQueryData<Item>(ITEM_QUERY_KEYS.detail(id));
      
      if (item) {
        // Extract the price value from the result which can be a number or an object
        let newPrice: number | null = null;
        let debugData = undefined;
        
        if (result !== null) {
          if (typeof result === 'object' && 'price' in result) {
            newPrice = result.price;
            debugData = result.debugData;
          } else if (typeof result === 'number') {
            newPrice = result;
          }
        }
        
        // Update only ebayListed property, not value
        if (newPrice !== null) {
          queryClient.setQueryData<Item>(
            ITEM_QUERY_KEYS.detail(id),
            { 
              ...item, 
              ebayListed: newPrice,
              isLoadingAiPrice: false,
              // Include debugData in the item
              debugData: debugData
            }
          );
        } else if (item) {
          // Just update the loading state if no price was returned
          queryClient.setQueryData<Item>(
            ITEM_QUERY_KEYS.detail(id),
            { ...item, isLoadingAiPrice: false }
          );
          
          // If we didn't get a price, show a message
          if (newPrice === null) {
            toast.error("No valid price estimate found. Try adjusting the item details.");
          }
        }
      }
    },
    
    onError: (error, id, context) => {
      if (context?.previousItem) {
        queryClient.setQueryData<Item>(
          ITEM_QUERY_KEYS.detail(id),
          { ...context.previousItem, isLoadingAiPrice: false }
        );
      }
      
      // Show a more detailed error message if possible
      const errorMessage = error instanceof Error ? error.message : "Failed to update AI price";
      toast.error(errorMessage);
    },
    
    onSettled: (_, __, id) => {
      queryClient.invalidateQueries({ 
        queryKey: ITEM_QUERY_KEYS.detail(id),
        refetchType: 'none' // Don't trigger immediate refetch
      });
    },
  });
} 