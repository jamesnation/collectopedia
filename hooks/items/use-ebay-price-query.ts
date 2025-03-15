"use client";

/**
 * hooks/items/use-ebay-price-query.ts
 * 
 * This file contains React Query hooks for eBay pricing operations.
 * It provides caching and optimistic updates for eBay API calls.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ItemCondition } from "@/types/item-types";
import { ITEM_QUERY_KEYS } from "./use-item-query";

// Interface for enhanced eBay price result
interface EnhancedEbayPriceResult {
  price: number | null;
  textBased?: { median?: number };
  imageBased?: { median?: number };
  combined?: { median?: number };
  debugData?: any;
}

// Interface for eBay price request
interface EbayPriceRequest {
  title: string;
  image?: string;
  condition: ItemCondition;
  franchise: string;
  region: string;
}

/**
 * Hook to get eBay price estimates using both text and image search
 */
export function useEbayPriceQuery(
  request: EbayPriceRequest | null,
  debugMode: boolean = false
) {
  return useQuery({
    queryKey: ['ebay', 'price', request?.title, request?.condition, request?.franchise, request?.region],
    queryFn: async () => {
      if (!request) throw new Error("No request provided");
      
      const { getEnhancedEbayPrices } = await import('@/actions/ebay-actions');
      
      const result = await getEnhancedEbayPrices(request, debugMode);
      
      // Ensure the response matches our expected interface
      const priceResult: EnhancedEbayPriceResult = {
        price: (result.combined?.median || result.imageBased?.median || result.textBased?.median || null),
        textBased: result.textBased,
        imageBased: result.imageBased,
        combined: result.combined,
        debugData: result.debugData
      };
      
      return priceResult;
    },
    // Disable by default until explicitly needed
    enabled: false,
    // Cache for 24 hours since eBay prices don't change that often
    staleTime: 1000 * 60 * 60 * 24,
    // Retry only once
    retry: 1,
  });
}

// Interface to represent a price result that might be an object or just a number
interface PriceResult {
  price?: number | null;
  debugData?: any;
}

interface MutationContext {
  previousItem: any;
}

/**
 * Hook to refresh an item's AI price with optimistic updates
 */
export function useRefreshItemAiPriceMutation(
  refreshAiPrice: (id: string) => Promise<number | null>
) {
  const queryClient = useQueryClient();
  
  return useMutation<PriceResult | number | null, Error, string, MutationContext>({
    mutationFn: async (itemId: string) => {
      // Call the pricing API
      const result = await refreshAiPrice(itemId);
      
      // If the result is an object with debugData, return it
      if (typeof result === 'object' && result !== null) {
        return result as PriceResult;
      }
      
      // Otherwise, just return the price
      return result;
    },
    
    onMutate: async (itemId) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ITEM_QUERY_KEYS.detail(itemId) });
      
      // Snapshot the previous item value
      const previousItem = queryClient.getQueryData(ITEM_QUERY_KEYS.detail(itemId));
      
      // Optimistically update the UI by setting isLoadingAiPrice to true
      if (previousItem) {
        queryClient.setQueryData(ITEM_QUERY_KEYS.detail(itemId), {
          ...previousItem,
          isLoadingAiPrice: true
        });
      }
      
      return { previousItem };
    },
    
    onSuccess: (result, itemId) => {
      const item = queryClient.getQueryData(ITEM_QUERY_KEYS.detail(itemId));
      
      if (item) {
        // Get the price from the result, which can be either a number or an object
        let newPrice: number | null = null;
        
        if (typeof result === 'object' && result !== null) {
          newPrice = result.price !== undefined ? result.price : null;
        } else {
          newPrice = result;
        }
        
        // If we got a price, update the item
        if (newPrice !== null) {
          queryClient.setQueryData(ITEM_QUERY_KEYS.detail(itemId), {
            ...item,
            value: newPrice,
            isLoadingAiPrice: false
          });
          
          toast.success("AI price updated successfully");
        }
      }
    },
    
    onError: (error, itemId, context) => {
      console.error("Error refreshing AI price:", error);
      
      // Revert to the previous value if we have it
      if (context?.previousItem) {
        queryClient.setQueryData(
          ITEM_QUERY_KEYS.detail(itemId),
          {
            ...context.previousItem,
            isLoadingAiPrice: false
          }
        );
      }
      
      toast.error("Failed to update AI price");
    },
    
    onSettled: (_, __, itemId) => {
      // Always refetch after error or success to ensure data is consistent
      queryClient.invalidateQueries({ queryKey: ITEM_QUERY_KEYS.detail(itemId) });
    }
  });
} 