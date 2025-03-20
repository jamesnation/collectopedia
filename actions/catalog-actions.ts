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
  });
  
  const isProduction = process.env.NODE_ENV === 'production';
  const hasImages = !!item.images && Array.isArray(item.images) && item.images.length > 0;
  
  try {
    // Generate a unique ID
    const id = crypto.randomUUID();
    
    // VERCEL OPTIMIZATION: For Vercel, create item first without ANY images
    // and then handle images separately to avoid timeouts
    const { images = [], ...itemData } = item; // Default to empty array
    
    // For the primary image, using the first image from the array
    const primaryImage = hasImages && images.length > 0 ? images[0] : null;
    
    // Prepare data to match the expected createItemAction parameters
    const { 
      notes, 
      soldDate, 
      soldPrice, 
      ebayListed, 
      ebaySold,
      image, // Ignore passed image and use primaryImage instead
      ...rest 
    } = itemData;
    
    console.log("[SERVER-ACTION] Creating item with" + (primaryImage ? " primary image" : "out images"));
    
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
    }).catch(error => {
      console.error("💡 [SERVER-ACTION] createItemAction error:", error);
      throw error; // Re-throw to be caught by outer catch
    });
    
    if (!result.isSuccess || !result.data) {
      console.error("[SERVER-ACTION] createItemAction failed:", result.error);
      throw new Error(result.error || "Failed to add catalog item");
    }
    
    // VERCEL OPTIMIZATION: Process only a maximum of 3 images to avoid timeouts
    if (hasImages && images.length > 0) {
      const imagesToProcess = isProduction 
        ? images.slice(0, 3) // In production, limit to 3 images initially
        : images;
        
      console.log(`[SERVER-ACTION] Processing ${imagesToProcess.length} images (${isProduction ? 'limited for production' : 'all'})...`);
      
      try {
        // Process images in batches of 1 for better reliability in production
        const { createImageAction } = await import("./images-actions");
        const batchSize = isProduction ? 1 : 3; // Single images in production
        
        for (let i = 0; i < imagesToProcess.length; i += batchSize) {
          const batch = imagesToProcess.slice(i, i + batchSize);
          console.log(`[SERVER-ACTION] Processing image batch ${Math.ceil(i/batchSize) + 1}/${Math.ceil(imagesToProcess.length/batchSize)}`);
          
          // Process each batch sequentially in production for reliability
          if (isProduction) {
            for (const url of batch) {
              try {
                console.log(`[SERVER-ACTION] Creating image record for URL: ${url.substring(0, 30)}...`);
                await createImageAction({
                  url,
                  itemId: id,
                  userId: item.userId,
                  order: i // Preserve order
                });
              } catch (imgError) {
                console.error(`[SERVER-ACTION] Error creating image:`, imgError);
              }
            }
          } else {
            // In development, process in parallel for speed
            await Promise.all(batch.map(async (url, index) => {
              try {
                await createImageAction({
                  url,
                  itemId: id,
                  userId: item.userId,
                  order: i + index // Preserve order
                });
              } catch (imgError) {
                console.error(`[SERVER-ACTION] Error creating image ${i + index}:`, imgError);
              }
            }));
          }
        }
        
        console.log('[SERVER-ACTION] Initial images processed');
        
        // VERCEL OPTIMIZATION: If there are more images, log them for separate processing
        if (isProduction && images.length > 3) {
          console.log(`[SERVER-ACTION] ${images.length - 3} additional images will need separate processing`);
          // In a real system, you might queue these for background processing
        }
      } catch (imageError) {
        console.error('[SERVER-ACTION] Error processing images:', imageError);
        // Continue anyway - we've already created the item
      }
    }
    
    // Revalidate paths with a one-second delay to ensure DB writes are complete
    setTimeout(() => {
      try {
        // Generate a cache-busting timestamp for the item paths
        const timestamp = Date.now();
        console.log("[SERVER-ACTION] Revalidating paths...");
        revalidatePath(`/?t=${timestamp}`);
        revalidatePath(`/my-collection?t=${timestamp}`);
        revalidatePath(`/item/${id}?t=${timestamp}`);
      } catch (revalidateError) {
        console.error("[SERVER-ACTION] Error revalidating paths:", revalidateError);
      }
    }, 1000);
    
    console.timeEnd('addCatalogItem');
    return result.data;
  } catch (error) {
    console.timeEnd('addCatalogItem');
    console.error("[SERVER-ACTION] addCatalogItem error:", error);
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