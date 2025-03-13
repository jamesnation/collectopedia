"use server";

import { getItemHistoryByItemId, insertItemHistory } from "@/db/queries/item-history-queries";
import { SelectItemHistory, InsertItemHistory } from "@/db/schema/item-history-schema";
import { auth } from "@clerk/nextjs/server";

type ActionResult<T> = {
  isSuccess: boolean;
  data?: T;
  error?: string;
};

// Get history events for an item
export const getItemHistoryAction = async (itemId: string): Promise<ActionResult<SelectItemHistory[]>> => {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return {
        isSuccess: false,
        error: "Unauthorized"
      };
    }
    
    const events = await getItemHistoryByItemId(itemId);
    return {
      isSuccess: true,
      data: events
    };
  } catch (error) {
    console.error("Failed to get item history:", error);
    return {
      isSuccess: false,
      error: "Failed to get item history"
    };
  }
};

// Record a history event
export const recordItemHistoryAction = async (data: Omit<InsertItemHistory, "id" | "timestamp">): Promise<ActionResult<SelectItemHistory>> => {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return {
        isSuccess: false,
        error: "Unauthorized"
      };
    }
    
    // Make sure the user ID is included
    const historyData: InsertItemHistory = {
      ...data,
      userId: data.userId || userId
    };
    
    const inserted = await insertItemHistory(historyData);
    return {
      isSuccess: true,
      data: inserted
    };
  } catch (error) {
    console.error("Failed to record item history:", error);
    return {
      isSuccess: false,
      error: "Failed to record item history"
    };
  }
}; 