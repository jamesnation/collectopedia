"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { itemsTable } from "@/db/schema/items-schema";
import { customTypesTable } from "@/db/schema/custom-types-schema";
import { customFranchisesTable } from "@/db/schema/custom-franchises-schema";
import { customBrandsTable } from "@/db/schema/custom-brands-schema";
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
 * - Collection items
 * - Custom types
 * - Custom franchises
 * - Custom brands
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
      
      // Delete all custom types created by the user
      await tx
        .delete(customTypesTable)
        .where(eq(customTypesTable.userId, userId));
      
      // Delete all custom franchises created by the user
      await tx
        .delete(customFranchisesTable)
        .where(eq(customFranchisesTable.userId, userId));
      
      // Delete all custom brands created by the user
      await tx
        .delete(customBrandsTable)
        .where(eq(customBrandsTable.userId, userId));
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