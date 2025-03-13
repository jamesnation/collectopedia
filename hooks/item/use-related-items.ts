/**
 * use-related-items.ts
 * 
 * A custom hook for fetching and managing related items based on franchise.
 */

import { useState, useEffect, useCallback } from 'react';
import { getRelatedItemsAction } from "@/actions/items-actions";
import { SelectItem as SelectItemType } from "@/db/schema/items-schema";

interface UseRelatedItemsResult {
  relatedItems: SelectItemType[];
  isLoading: boolean;
  error: string | null;
  refetchRelatedItems: () => Promise<void>;
}

/**
 * Hook for fetching and managing related items
 * @param franchise - The franchise to find related items for
 * @param itemId - The ID of the current item (to exclude from results)
 * @param isSold - Whether to fetch sold or unsold related items
 * @returns Object with related items data and operations
 */
export function useRelatedItems(
  franchise: string | undefined,
  itemId: string,
  isSold: boolean = false
): UseRelatedItemsResult {
  const [relatedItems, setRelatedItems] = useState<SelectItemType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRelatedItems = useCallback(async () => {
    if (!franchise || !itemId) {
      setRelatedItems([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getRelatedItemsAction(franchise, itemId, isSold);
      
      if (result.isSuccess && result.data) {
        setRelatedItems(result.data);
      } else {
        setError(result.error || "Failed to fetch related items");
        console.error("Failed to fetch related items:", result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching related items:", error);
    } finally {
      setIsLoading(false);
    }
  }, [franchise, itemId, isSold]);

  useEffect(() => {
    if (franchise && itemId) {
      fetchRelatedItems();
    }
  }, [franchise, itemId, isSold, fetchRelatedItems]);

  return {
    relatedItems,
    isLoading,
    error,
    refetchRelatedItems: fetchRelatedItems
  };
} 