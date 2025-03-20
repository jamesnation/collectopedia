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
  console.log("💡 [SERVER-ACTION] addCatalogItem received payload:", {
    name: item.name,
    hasImages: !!item.images && Array.isArray(item.images) && item.images.length > 0,
    imageCount: item.images?.length || 0,
    imageTypes: item.images?.map(url => url.substring(0, 20) + '...').join(', ')
  });
  
  // Capture payload size for diagnostics
  const payloadSize = JSON.stringify(item).length;
  console.log(`💡 [SERVER-ACTION] Payload size: ${Math.round(payloadSize / 1024)}KB`);

  const hasImages = !!item.images && Array.isArray(item.images) && item.images.length > 0;
  
  try {
    // Generate a unique ID
    const id = crypto.randomUUID();
    console.log("[SERVER-ACTION] Generated ID:", id);
    
    // Debug logging for image data
    console.log('[SERVER-ACTION] Item image data:', {
      primaryImage: item.image ? 'Has primary image' : 'No primary image',
      additionalImages: hasImages ? item.images!.length : 0
    });
    
    // IMPORTANT CHANGE: Create only minimal item data first, handle images separately
    // Extract images to process separately
    const { images, ...itemData } = item;
    
    // If there's a primary image in 'image' field but not in images array, add it
    const primaryImage = item.image;
    const allImages = hasImages ? [...item.images!] : [];
    
    // Only keep the primary image in the main item creation
    // This is similar to how item-details handles it
    console.log("[SERVER-ACTION] First creating item without additional images...");
    
    // Prepare data to match the expected createItemAction parameters
    const { 
      notes, 
      soldDate, 
      soldPrice, 
      ebayListed, 
      ebaySold,
      image,
      ...rest 
    } = itemData;
    
    console.log("[SERVER-ACTION] Calling createItemAction...");
    
    // Only pass necessary data to createItemAction to optimize the request
    const result = await createItemAction({
      id,
      ...rest,
      notes: notes || '',
      soldDate: soldDate || undefined,
      soldPrice: soldPrice || undefined,
      ebayListed: ebayListed || undefined,
      ebaySold: ebaySold || undefined,
      image: primaryImage || undefined, // Only include the primary image
      // Don't pass additional images in initial creation
    }).catch(error => {
      console.error("💡 [SERVER-ACTION] createItemAction threw error:", error);
      throw error; // Re-throw to be caught by outer catch
    });
    
    console.log("[SERVER-ACTION] createItemAction returned:", {
      success: result.isSuccess,
      hasData: !!result.data,
      error: result.error || 'none'
    });
    
    if (!result.isSuccess || !result.data) {
      console.error("[SERVER-ACTION-ERROR] createItemAction failed:", result.error);
      throw new Error(result.error || "Failed to add catalog item");
    }
    
    // Now handle additional images separately if there are any
    if (hasImages && allImages.length > 0 && allImages.length > 1) {
      console.log(`[SERVER-ACTION] Processing ${allImages.length} additional images...`);
      
      try {
        // Process images in batches for better performance
        const { createImageAction } = await import("./images-actions");
        const batchSize = 3; // Process 3 images at a time
        
        // Skip the first image if it's the same as the primary image
        const startIndex = (primaryImage && allImages[0] === primaryImage) ? 1 : 0;
        
        for (let i = startIndex; i < allImages.length; i += batchSize) {
          const batch = allImages.slice(i, i + batchSize);
          console.log(`[SERVER-ACTION] Processing image batch ${Math.ceil(i/batchSize) + 1}/${Math.ceil(allImages.length/batchSize)}`);
          
          // Process each batch in parallel
          await Promise.all(batch.map(async (url, index) => {
            if (url && url !== primaryImage) {
              try {
                await createImageAction({
                  url,
                  itemId: id,
                  userId: item.userId,
                  order: i + index // Preserve order
                });
              } catch (imgError) {
                console.error(`[SERVER-ACTION] Error creating image ${i + index}:`, imgError);
                // Continue with other images even if one fails
              }
            }
          }));
        }
        
        console.log('[SERVER-ACTION] All additional images processed');
      } catch (imageError) {
        console.error('[SERVER-ACTION] Error processing additional images:', imageError);
        // Continue anyway - we've already created the item
      }
    }
    
    console.log("[SERVER-ACTION] Item created successfully:", {
      id: result.data.id,
      name: result.data.name
    });
    
    try {
      // Generate a cache-busting timestamp for the item paths
      const timestamp = Date.now();
      
      // Revalidate necessary paths to ensure fresh data
      console.log("[SERVER-ACTION] Revalidating paths...");
      revalidatePath(`/?t=${timestamp}`);
      revalidatePath(`/my-collection?t=${timestamp}`);
      revalidatePath(`/item/${id}?t=${timestamp}`);
      console.log("[SERVER-ACTION] Paths revalidated");
    } catch (revalidateError) {
      console.error("[SERVER-ACTION-ERROR] Error revalidating paths:", revalidateError);
      // Non-critical error, don't throw
    }
    
    console.timeEnd('addCatalogItem');
    console.log("[SERVER-ACTION-COMPLETE] Returning created item");
    // Return the created item
    return result.data;
  } catch (error) {
    console.timeEnd('addCatalogItem');
    console.error("[SERVER-ACTION-FATAL] addCatalogItem error:", error);
    // Add more detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      stringified: String(error)
    };
    console.error("[SERVER-ACTION-FATAL] Error details:", errorDetails);
    throw error; // Re-throw to be handled by the client
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