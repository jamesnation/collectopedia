/**
 * use-item-details.ts
 * 
 * A custom hook for fetching, updating, and managing item details.
 * This hook centralizes all item-related data operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import { 
  getItemByIdAction, 
  updateItemAction, 
  deleteItemAction 
} from "@/actions/items-actions";
import { SelectItem as SelectItemType } from "@/db/schema/items-schema";

interface UseItemDetailsResult {
  item: SelectItemType | null;
  isLoading: boolean;
  updateItemField: (fieldName: string, value: any) => Promise<boolean>;
  updateItemFields: (fields: Partial<SelectItemType>) => Promise<boolean>;
  deleteItem: () => Promise<boolean>;
  refetchItem: () => Promise<void>;
}

/**
 * Hook for managing item details data and operations
 * @param id - The ID of the item to fetch and manage
 * @returns Object with item data and operations
 */
export function useItemDetails(id: string): UseItemDetailsResult {
  const [item, setItem] = useState<SelectItemType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  // Fetch item data
  const fetchItem = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const result = await getItemByIdAction(id);
      if (result.isSuccess && result.data) {
        setItem(result.data);
      } else {
        console.error("Failed to fetch item:", result.error);
        toast({
          title: "Error",
          description: "Failed to load item details. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching item:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading item details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  // Update a single field of the item
  const updateItemField = useCallback(async (fieldName: string, value: any): Promise<boolean> => {
    if (!item) return false;
    
    try {
      const updatedItem = { 
        ...item,
        [fieldName]: value 
      };
      
      const result = await updateItemAction(item.id, updatedItem);
      
      if (result.isSuccess && result.data) {
        setItem(result.data[0]);
        toast({
          title: "Success",
          description: "Item updated successfully.",
        });
        return true;
      } else {
        throw new Error(result.error || "Failed to update item");
      }
    } catch (error) {
      console.error(`Error updating field ${fieldName}:`, error);
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [item, toast]);

  // Update multiple fields at once
  const updateItemFields = useCallback(async (fields: Partial<SelectItemType>): Promise<boolean> => {
    if (!item) return false;
    
    try {
      const updatedItem = { 
        ...item,
        ...fields
      };
      
      const result = await updateItemAction(item.id, updatedItem);
      
      if (result.isSuccess && result.data) {
        setItem(result.data[0]);
        toast({
          title: "Success",
          description: "Item updated successfully.",
        });
        return true;
      } else {
        throw new Error(result.error || "Failed to update item");
      }
    } catch (error) {
      console.error("Error updating multiple fields:", error);
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [item, toast]);

  // Delete the item
  const deleteItem = useCallback(async (): Promise<boolean> => {
    if (!item) return false;
    
    try {
      const result = await deleteItemAction(item.id);
      
      if (result.isSuccess) {
        toast({
          title: "Item deleted",
          description: "The item has been deleted successfully.",
        });
        router.push('/my-collection');
        return true;
      } else {
        throw new Error(result.error || "Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [item, toast, router]);

  // Fetch item data on component mount and when ID changes
  useEffect(() => {
    if (id) {
      fetchItem();
    }
  }, [id, fetchItem]);

  return {
    item,
    isLoading,
    updateItemField,
    updateItemFields,
    deleteItem,
    refetchItem: fetchItem
  };
} 