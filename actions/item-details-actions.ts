"use server";

import { auth } from "@clerk/nextjs/server";
import { getItemByIdAction, updateItemAction } from "./items-actions";
import { getItemHistoryAction, recordItemHistoryAction } from "./item-history-actions";
import { fetchEbayPrices } from "./ebay-actions";
import { revalidatePath } from "next/cache";

// Get a comprehensive item with all necessary data
export async function getItemDetailsAction(id: string) {
  const { userId } = auth();
  if (!userId) {
    return {
      isSuccess: false,
      error: "Unauthorized"
    };
  }

  try {
    // Get the item
    const itemResult = await getItemByIdAction(id);
    if (!itemResult.isSuccess || !itemResult.data) {
      return {
        isSuccess: false,
        error: itemResult.error || "Item not found"
      };
    }

    // Get item history
    const historyResult = await getItemHistoryAction(id);
    const historyEvents = historyResult.isSuccess ? historyResult.data || [] : [];

    return {
      isSuccess: true,
      data: {
        item: itemResult.data,
        history: historyEvents
      }
    };
  } catch (error) {
    console.error("Error fetching item details:", error);
    return {
      isSuccess: false,
      error: "Failed to load item details"
    };
  }
}

// Update an item with history tracking
export async function updateItemWithHistoryAction(
  id: string, 
  data: any, 
  fieldName?: string
) {
  const { userId } = auth();
  if (!userId) {
    return {
      isSuccess: false,
      error: "Unauthorized"
    };
  }

  try {
    // Get the current item to compare values
    const currentItemResult = await getItemByIdAction(id);
    if (!currentItemResult.isSuccess || !currentItemResult.data) {
      return {
        isSuccess: false,
        error: currentItemResult.error || "Item not found"
      };
    }
    
    const currentItem = currentItemResult.data;
    
    // Update the item
    const updateResult = await updateItemAction(id, data);
    if (!updateResult.isSuccess) {
      return {
        isSuccess: false,
        error: updateResult.error || "Failed to update item"
      };
    }
    
    // Record the history if we're tracking a specific field
    if (fieldName && Object.keys(data).includes(fieldName)) {
      const oldValue = currentItem[fieldName as keyof typeof currentItem];
      const newValue = data[fieldName];
      
      // Only record if the value actually changed
      if (oldValue !== newValue) {
        await recordItemHistoryAction({
          itemId: id,
          userId,
          type: 'updated',
          details: {
            field: fieldName,
            oldValue: oldValue as string | number | null,
            newValue: newValue as string | number | null
          }
        });
      }
    }
    
    // Special case for sold status change
    if ('isSold' in data && data.isSold !== currentItem.isSold) {
      await recordItemHistoryAction({
        itemId: id,
        userId,
        type: 'statusChange',
        details: {
          field: 'isSold',
          oldValue: currentItem.isSold ? 'sold' : 'in collection',
          newValue: data.isSold ? 'sold' : 'in collection'
        }
      });
    }
    
    // Special case for sold price
    if ('soldPrice' in data && data.soldPrice !== currentItem.soldPrice) {
      await recordItemHistoryAction({
        itemId: id,
        userId,
        type: 'sold',
        details: {
          price: data.soldPrice,
          note: "Item marked as sold"
        }
      });
    }
    
    // Revalidate the item page
    revalidatePath(`/item/${id}`);
    
    return {
      isSuccess: true,
      data: updateResult.data
    };
  } catch (error) {
    console.error("Error updating item:", error);
    return {
      isSuccess: false,
      error: "Failed to update item"
    };
  }
}

// Refresh the eBay price estimate
export async function refreshEbayPriceAction(id: string) {
  const { userId } = auth();
  if (!userId) {
    return {
      isSuccess: false,
      error: "Unauthorized"
    };
  }

  try {
    // Get the current item
    const itemResult = await getItemByIdAction(id);
    if (!itemResult.isSuccess || !itemResult.data) {
      return {
        isSuccess: false,
        error: itemResult.error || "Item not found"
      };
    }
    
    const item = itemResult.data;
    
    // Search eBay for the item
    const searchTerm = `${item.name} ${item.brand} ${item.franchise}`.trim();
    const ebayResults = await fetchEbayPrices(
      searchTerm,
      'listed',
      item.condition
    );
    
    if (!ebayResults || !ebayResults.lowest) {
      return {
        isSuccess: false,
        error: "No eBay results found"
      };
    }
    
    // Use the median price as our estimate
    const newPrice = ebayResults.median || ebayResults.lowest;
    
    if (!newPrice) {
      return {
        isSuccess: false,
        error: "No valid prices found on eBay"
      };
    }
    
    // Update the item with the new price
    const oldEbayListed = item.ebayListed;
    const updateResult = await updateItemAction(id, { ebayListed: newPrice });
    
    if (!updateResult.isSuccess) {
      return {
        isSuccess: false,
        error: updateResult.error || "Failed to update eBay price"
      };
    }
    
    // Record price change in history
    await recordItemHistoryAction({
      itemId: id,
      userId,
      type: 'priceChange',
      details: {
        oldValue: oldEbayListed,
        newValue: newPrice,
        note: "eBay price updated"
      }
    });
    
    // Revalidate the item page
    revalidatePath(`/item/${id}`);
    
    return {
      isSuccess: true,
      data: newPrice
    };
  } catch (error) {
    console.error("Error refreshing eBay price:", error);
    return {
      isSuccess: false,
      error: "Failed to refresh eBay price"
    };
  }
} 