/**
 * use-sold-status.ts
 * 
 * A custom hook for managing the sold status and related details of an item.
 * This hook handles toggling sold status, managing sold price and date.
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { updateItemAction } from "@/actions/items-actions";
import { getSoldItemByItemIdAction } from "@/actions/sold-items-actions";
import { SelectItem as SelectItemType } from "@/db/schema/items-schema";
import { SelectSoldItem } from "@/db/schema/sold-items-schema";

interface UseSoldStatusResult {
  isSold: boolean;
  soldPrice: string;
  soldDate: string;
  soldItem: SelectSoldItem | null;
  setSoldPrice: (price: string) => void;
  setSoldDate: (date: string) => void;
  toggleSoldStatus: (checked: boolean) => Promise<boolean>;
  updateSoldDetails: () => Promise<boolean>;
}

/**
 * Hook for managing item sold status
 * @param itemId - The ID of the item
 * @param item - The item object
 * @returns Object with sold status data and operations
 */
export function useSoldStatus(
  itemId: string, 
  item: SelectItemType | null
): UseSoldStatusResult {
  const [isSold, setIsSold] = useState(false);
  const [soldPrice, setSoldPrice] = useState("");
  const [soldDate, setSoldDate] = useState("");
  const [soldItem, setSoldItem] = useState<SelectSoldItem | null>(null);
  const { toast } = useToast();

  // Initialize state based on item
  useEffect(() => {
    if (item) {
      setIsSold(item.isSold);
      
      if (item.isSold && item.soldPrice !== undefined && item.soldPrice !== null) {
        setSoldPrice(item.soldPrice.toString());
      }
      
      if (item.isSold && item.soldDate) {
        setSoldDate(new Date(item.soldDate).toISOString().split('T')[0]);
      }
    }
  }, [item]);

  // Fetch sold item details
  const fetchSoldItem = useCallback(async () => {
    if (!itemId) return;
    
    try {
      const result = await getSoldItemByItemIdAction(itemId);
      if (result.isSuccess && result.data) {
        setSoldItem(result.data);
        setIsSold(true);
        setSoldPrice(result.data.soldPrice.toString());
        setSoldDate(new Date(result.data.soldDate).toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error("Error fetching sold item:", error);
    }
  }, [itemId]);

  // Toggle sold status
  const toggleSoldStatus = useCallback(async (checked: boolean): Promise<boolean> => {
    if (!item) return false;
    
    setIsSold(checked);
    
    try {
      const updatedItem = { ...item, isSold: checked };
      const result = await updateItemAction(item.id, updatedItem);
      
      if (result.isSuccess) {
        toast({
          title: checked ? "Item marked as sold" : "Item unmarked as sold",
          description: checked ? "The item has been marked as sold." : "The item has been unmarked as sold.",
        });
        
        // Reset sold details if unsold
        if (!checked) {
          setSoldPrice("");
          setSoldDate("");
          setSoldItem(null);
        }
        
        return true;
      } else {
        throw new Error(result.error || 'Failed to update item sold status');
      }
    } catch (error) {
      console.error("Error toggling sold status:", error);
      toast({
        title: "Error",
        description: "Failed to update item sold status. Please try again.",
        variant: "destructive",
      });
      setIsSold(!checked); // Revert the toggle if update fails
      return false;
    }
  }, [item, toast]);

  // Update sold details
  const updateSoldDetails = useCallback(async (): Promise<boolean> => {
    if (!item || !isSold) return false;
    
    try {
      const updatedItem = {
        ...item,
        isSold: true,
        soldPrice: parseInt(soldPrice),
        soldDate: soldDate ? new Date(soldDate) : null,
      };
      
      const result = await updateItemAction(item.id, updatedItem);
      
      if (result.isSuccess && result.data) {
        toast({
          title: "Sold details saved",
          description: "The item has been marked as sold and details saved.",
        });
        return true;
      } else {
        throw new Error(result.error || 'Action failed');
      }
    } catch (error) {
      console.error("Error saving sold details:", error);
      toast({
        title: "Error",
        description: "Failed to save sold details. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [item, isSold, soldPrice, soldDate, toast]);

  // Fetch sold item on mount
  useEffect(() => {
    if (itemId) {
      fetchSoldItem();
    }
  }, [itemId, fetchSoldItem]);

  return {
    isSold,
    soldPrice,
    soldDate,
    soldItem,
    setSoldPrice,
    setSoldDate,
    toggleSoldStatus,
    updateSoldDetails
  };
} 