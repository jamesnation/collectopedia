/**
 * Catalog Actions
 * 
 * Server actions specifically for the catalog view to be used with React Query.
 * These functions wrap the existing items-actions for better integration with
 * React Query and to provide a more specific API for the catalog.
 */

"use server";

import { getItemsByUserIdAction, getItemByIdAction, createItemAction, updateItemAction, deleteItemAction } from "./items-actions";
import { getImagesByItemIdAction, createImageAction, deleteImageAction } from "./images-actions";
import { SelectItem } from "@/db/schema/items-schema";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { itemsTable } from "@/db/schema/items-schema";
import crypto from 'crypto';

// Type for catalog query parameters
export interface CatalogQueryParams {
  userId: string;
  search?: string;
  type?: string;
  franchise?: string;
  year?: string;
  showSold?: boolean;
  soldYear?: string;
  showWithImages?: boolean;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

// Type for catalog response
export interface CatalogResponse {
  items: SelectItem[];
  totalItems: number;
  page: number;
  totalPages: number;
}

/**
 * Fetch catalog items with optional filtering and sorting
 */
export async function fetchCatalogItems(params: CatalogQueryParams): Promise<CatalogResponse> {
  const { userId } = params;
  
  if (!userId) {
    throw new Error("User ID is required");
  }
  
  // For now, we're using the existing action that fetches all items
  // In the future, we could add server-side filtering and pagination
  const result = await getItemsByUserIdAction(userId);
  
  if (!result.isSuccess || !result.data) {
    throw new Error(result.error || "Failed to fetch catalog items");
  }
  
  return {
    items: result.data,
    totalItems: result.data.length,
    page: 1,
    totalPages: 1
  };
}

/**
 * Add a new catalog item
 */
export async function addCatalogItem(item: Omit<SelectItem, 'id'> & { userId: string, images?: string[] }): Promise<SelectItem> {
  console.time('addCatalogItem');
  console.log("[SERVER-ACTION] addCatalogItem received:", {
    name: item.name,
    hasPrimaryImage: !!item.image
  });
  
  try {
    // Generate a unique ID
    const id = crypto.randomUUID();
    
    // CRITICAL: Only handle creating the basic item with at most one image
    // Additional images will be handled one by one after item creation
    const { images, ...itemData } = item;
    
    console.log("[SERVER-ACTION] Creating item with ID:", id);
    
    // Prepare a clean object with all fields properly typed
    const preparedData = {
      id,
      userId: itemData.userId,
      name: itemData.name,
      type: itemData.type,
      franchise: itemData.franchise,
      brand: itemData.brand || undefined,
      year: itemData.year || undefined,
      condition: itemData.condition,
      acquired: itemData.acquired,
      cost: itemData.cost,
      value: itemData.value,
      notes: itemData.notes || '',
      soldDate: itemData.soldDate || undefined,
      soldPrice: itemData.soldPrice || undefined,
      ebayListed: itemData.ebayListed || undefined,
      ebaySold: itemData.ebaySold || undefined,
      ebayLastUpdated: itemData.ebayLastUpdated || undefined,
      image: itemData.image || undefined,
      isSold: itemData.isSold,
      createdAt: itemData.createdAt,
      updatedAt: itemData.updatedAt,
    };
    
    // Pass properly typed data to createItemAction
    const result = await createItemAction(preparedData).catch(error => {
      console.error("[SERVER-ACTION] createItemAction error:", error);
      throw error;
    });
    
    if (!result.isSuccess || !result.data) {
      console.error("[SERVER-ACTION] createItemAction failed:", result.error);
      throw new Error(result.error || "Failed to add catalog item");
    }
    
    // Revalidate paths
    try {
      const timestamp = Date.now();
      revalidatePath(`/?t=${timestamp}`);
      revalidatePath(`/my-collection?t=${timestamp}`);
      revalidatePath(`/item/${id}?t=${timestamp}`);
    } catch (revalidateError) {
      console.error("[SERVER-ACTION] Error revalidating paths:", revalidateError);
      // Non-critical error, don't throw
    }
    
    console.timeEnd('addCatalogItem');
    console.log("[SERVER-ACTION] Item created successfully:", {
      id: result.data.id,
      name: result.data.name
    });
    
    return result.data;
  } catch (error) {
    console.timeEnd('addCatalogItem');
    console.error("[SERVER-ACTION] addCatalogItem error:", error);
    throw error;
  }
}

/**
 * Update an existing catalog item
 */
export async function updateCatalogItem(id: string, updates: Partial<SelectItem> & { images?: string[] }): Promise<SelectItem> {
  // Debug logging for image data
  if ('image' in updates || 'images' in updates) {
    console.log('updateCatalogItem received image updates:', {
      itemId: id,
      primaryImage: updates.image !== undefined ? (updates.image ? 'Updated primary image' : 'Removed primary image') : 'No change to primary image',
      additionalImages: updates.images?.length || 0
    });
  }
  
  // Handle null vs undefined conversions for optional fields
  const processedUpdates = { ...updates };
  
  if ('notes' in updates) {
    processedUpdates.notes = updates.notes || '';
  }
  
  if ('soldDate' in updates && updates.soldDate === null) {
    processedUpdates.soldDate = undefined;
  }
  
  if ('soldPrice' in updates && updates.soldPrice === null) {
    processedUpdates.soldPrice = undefined;
  }
  
  if ('ebayListed' in updates && updates.ebayListed === null) {
    processedUpdates.ebayListed = undefined;
  }
  
  if ('ebaySold' in updates && updates.ebaySold === null) {
    processedUpdates.ebaySold = undefined;
  }
  
  if ('image' in updates && updates.image === null) {
    processedUpdates.image = undefined;
  }
  
  // Handle the images array separately to avoid TypeScript errors
  const { images, ...updatesWithoutImages } = processedUpdates;
  
  const result = await updateItemAction(id, updatesWithoutImages);
  
  if (!result.isSuccess || !result.data) {
    throw new Error(result.error || "Failed to update catalog item");
  }
  
  // If there are new images, update them in the images table
  if (images && images.length > 0) {
    try {
      // First get existing images
      const existingImagesResult = await getImagesByItemIdAction(id);
      const existingImages = existingImagesResult.isSuccess ? existingImagesResult.data || [] : [];
      
      // If we have existing images, we need to handle updates carefully
      // For now, we'll use a simple approach: delete all existing images and add the new ones
      if (existingImages.length > 0) {
        console.log(`Deleting ${existingImages.length} existing images for item ${id}`);
        for (const img of existingImages) {
          await deleteImageAction(img.id, id);
        }
      }
      
      // Now add the new images
      for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i];
        await createImageAction({
          itemId: id,
          userId: result.data[0].userId,
          url: imageUrl,
          order: i
        });
      }
      
      console.log(`Successfully updated ${images.length} images for item ${id}`);
    } catch (error) {
      console.error(`Error updating images for item ${id}:`, error);
      // Don't fail the whole update if image handling fails
    }
  }
  
  return result.data[0];
}

/**
 * Delete a catalog item
 */
export async function deleteCatalogItem(id: string): Promise<{ success: boolean }> {
  const result = await deleteItemAction(id);
  
  if (!result.isSuccess) {
    throw new Error(result.error || "Failed to delete catalog item");
  }
  
  return { success: true };
}

/**
 * Debug function - minimal item creation for testing
 */
export async function addMinimalItem(name: string): Promise<SelectItem> {
  const id = crypto.randomUUID();
  
  console.log(`[SERVER-DEBUG] Starting minimal item creation for '${name}' with ID: ${id}`);
  
  try {
    // Create the item directly using Drizzle
    const [item] = await db.insert(itemsTable).values({
      id,
      userId: 'test-user',
      name,
      type: 'Other',
      franchise: 'Other',
      acquired: new Date(),
      cost: 0,
      value: 0,
      condition: 'Used',
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isSold: false
    }).returning();
    
    console.log(`[SERVER-DEBUG] Minimal item created:`, {
      id: item.id,
      name: item.name
    });
    
    return item;
  } catch (error) {
    console.error(`[SERVER-DEBUG] Error in minimal item creation:`, error);
    throw error;
  }
} 