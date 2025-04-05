"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import {
  itemsTable,
  imagesTable,
  soldItemsTable,
  profilesTable,
  ebayHistoryTable,
  customAttributesTable
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

// Define ActionResult type
type ActionResult<T = void> = {
  isSuccess: boolean;
  data?: T;
  error?: string;
};

/**
 * Server action to delete all user data including:
 * - User profile
 * - Collection items
 * - Item images
 * - Sold items history
 * - eBay price history
 * - Custom attributes (brands, franchises, types)
 * 
 * This provides complete data deletion in compliance with privacy regulations.
 */
export const deleteUserDataAction = async (): Promise<ActionResult> => {
  try {
    // Get the current authenticated user
    const { userId } = auth();
    
    if (!userId) {
      return { 
        isSuccess: false, 
        error: "Authentication error: Not authenticated" 
      };
    }

    // Execute all deletions in a transaction
    await db.transaction(async (tx) => {
      // Delete all collection items for the user
      await tx
        .delete(itemsTable)
        .where(eq(itemsTable.userId, userId));
      
      // Delete all custom attributes (brands, types, franchises) for the user
      await tx
        .delete(customAttributesTable)
        .where(eq(customAttributesTable.userId, userId));
      
      // Delete all images uploaded by the user
      await tx
        .delete(imagesTable)
        .where(eq(imagesTable.userId, userId));
        
      // Delete all sold items records for the user
      await tx
        .delete(soldItemsTable)
        .where(eq(soldItemsTable.userId, userId));
        
      // Delete all eBay price history for the user
      await tx
        .delete(ebayHistoryTable)
        .where(eq(ebayHistoryTable.userId, userId));
        
      // Delete the user's profile
      await tx
        .delete(profilesTable)
        .where(eq(profilesTable.userId, userId));
    });

    // Revalidate all paths that might display user data
    revalidatePath("/");
    revalidatePath("/collection");
    revalidatePath("/settings");

    return { 
      isSuccess: true 
    };
  } catch (error) {
    console.error("Failed to delete user data:", error);
    return { 
      isSuccess: false, 
      error: error instanceof Error 
        ? `Failed to delete user data: ${error.message}` 
        : "Failed to delete user data: Unknown error" 
    };
  }
}; 