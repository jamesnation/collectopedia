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
  // Generate a unique ID
  const id = crypto.randomUUID();
  
  // Debug logging for image data
  console.log('addCatalogItem received image data:', {
    primaryImage: item.image ? 'Has primary image' : 'No primary image',
    additionalImages: item.images?.length || 0
  });
  
  // Prepare data to match the expected createItemAction parameters
  const { 
    notes, 
    soldDate, 
    soldPrice, 
    ebayListed, 
    ebaySold,
    image,
    images,
    ...rest 
  } = item;
  
  const result = await createItemAction({
    id,
    ...rest,
    notes: notes || '',
    soldDate: soldDate || undefined,
    soldPrice: soldPrice || undefined,
    ebayListed: ebayListed || undefined,
    ebaySold: ebaySold || undefined,
    image: image || undefined,
    images: images // Pass the entire images array to the createItemAction
  });
  
  if (!result.isSuccess || !result.data) {
    throw new Error(result.error || "Failed to add catalog item");
  }
  
  console.log('Item successfully created with images:', {
    itemId: result.data.id,
    primaryImage: result.data.image ? 'Has primary image' : 'No primary image'
  });
  
  return result.data;
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