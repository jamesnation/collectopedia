"use server";

import { revalidatePath } from "next/cache";
import { getImagesByItemId, insertImage, deleteImage, updateImageOrder, updateMultipleImageOrders } from "@/db/queries/images-queries";
import { InsertImage, SelectImage } from "@/db/schema/images-schema";
import { updateItem } from "@/db/queries/items-queries";
import crypto from 'crypto';

type ActionResult<T> = {
  isSuccess: boolean;
  data?: T;
  error?: string;
};

// Helper for conditional logging based on environment
const debugLog = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, ...args);
  }
};

export const getImagesByItemIdAction = async (itemId: string): Promise<ActionResult<SelectImage[]>> => {
  try {
    // Minimize logging to reduce console output
    const images = await getImagesByItemId(itemId);
    
    // Only log if there are actually images found
    if (images.length > 0) {
      debugLog(`Successfully fetched ${images.length} images for item ${itemId}`);
    }
    
    return { isSuccess: true, data: images };
  } catch (error) {
    console.error(`Failed to get images for item ${itemId}:`, error);
    return { 
      isSuccess: false, 
      error: error instanceof Error ? error.message : "Failed to get images",
      data: [] // Return empty array instead of undefined for easier handling
    };
  }
};

/**
 * New batched action to get images for multiple items at once
 * This significantly reduces the number of network requests needed when loading the catalog
 */
export const getBatchImagesByItemIdsAction = async (itemIds: string[]): Promise<ActionResult<Record<string, SelectImage[]>>> => {
  try {
    if (!itemIds.length) {
      return { isSuccess: true, data: {} };
    }
    
    // Log the batch request
    console.log(`[BATCH-IMAGES] Fetching images for ${itemIds.length} items in a single request`);
    
    // Create a map to store images by item ID
    const imagesMap: Record<string, SelectImage[]> = {};
    
    // Use Promise.all to fetch all images in parallel
    await Promise.all(
      itemIds.map(async (itemId) => {
        try {
          const images = await getImagesByItemId(itemId);
          imagesMap[itemId] = images;
        } catch (error) {
          console.error(`Failed to get images for item ${itemId} in batch:`, error);
          imagesMap[itemId] = []; // Set empty array for failed items
        }
      })
    );
    
    // Log completion
    console.log(`[BATCH-IMAGES] Successfully fetched images for ${Object.keys(imagesMap).length} items`);
    
    return { isSuccess: true, data: imagesMap };
  } catch (error) {
    console.error("Failed to get batch images:", error);
    return { isSuccess: false, error: "Failed to get batch images", data: {} };
  }
};

export const createImageAction = async (image: Omit<InsertImage, 'id'>): Promise<ActionResult<SelectImage>> => {
  try {
    // Get the current images to determine the next order
    const currentImages = await getImagesByItemId(image.itemId);
    const nextOrder = currentImages.length;
    
    const imageWithId = { 
      ...image, 
      id: crypto.randomUUID(),
      order: nextOrder // Set the order to be at the end of the list
    };
    
    const [createdImage] = await insertImage(imageWithId);
    
    // Update the imagesUpdatedAt timestamp on the item
    // Always log this for troubleshooting the sync issue
    console.log(`[IMAGES] Updating imagesUpdatedAt timestamp for item ${image.itemId}`);
    const now = new Date();
    await updateItem(image.itemId, { 
      imagesUpdatedAt: now
    });
    debugLog(`[IMAGES] Timestamp updated to ${now.toISOString()}`);
    
    // Add a cache-busting timestamp to ensure fresh data
    const timestamp = Date.now();
    
    // Revalidate all paths that might display this item's images
    revalidatePath(`/?t=${timestamp}`);  // Home page with catalog
    revalidatePath(`/item/${image.itemId}?t=${timestamp}`);  // Item details page
    revalidatePath(`/my-collection?t=${timestamp}`);  // Collection page
    
    return { isSuccess: true, data: createdImage };
  } catch (error) {
    console.error("Failed to create image:", error);
    return { isSuccess: false, error: "Failed to create image" };
  }
};

export const deleteImageAction = async (id: string, itemId?: string): Promise<ActionResult<void>> => {
  try {
    await deleteImage(id);
    
    // Update the imagesUpdatedAt timestamp on the item if itemId is provided
    if (itemId) {
      // Always log this for troubleshooting the sync issue
      console.log(`[IMAGES] Updating imagesUpdatedAt timestamp for item ${itemId} after deleting image`);
      const now = new Date();
      await updateItem(itemId, { 
        imagesUpdatedAt: now
      });
      debugLog(`[IMAGES] Timestamp updated to ${now.toISOString()}`);
    }
    
    // Add a cache-busting timestamp to ensure fresh data
    const timestamp = Date.now();
    
    // Revalidate all paths that might display this item's images
    revalidatePath(`/?t=${timestamp}`);  // Home page with catalog
    if (itemId) {
      revalidatePath(`/item/${itemId}?t=${timestamp}`);  // Item details page
    }
    revalidatePath(`/my-collection?t=${timestamp}`);  // Collection page
    
    return { isSuccess: true };
  } catch (error) {
    console.error("Failed to delete image:", error);
    return { isSuccess: false, error: "Failed to delete image" };
  }
};

export const createMultipleImagesAction = async (images: Omit<InsertImage, 'id'>[]): Promise<ActionResult<SelectImage[]>> => {
  try {
    const createdImages = await Promise.all(
      images.map(async (image) => {
        const imageWithId = { ...image, id: crypto.randomUUID() };
        const [createdImage] = await insertImage(imageWithId);
        return createdImage;
      })
    );
    revalidatePath("/");
    return { isSuccess: true, data: createdImages };
  } catch (error) {
    console.error("Failed to create multiple images:", error);
    return { isSuccess: false, error: "Failed to create multiple images" };
  }
};

export const updateImageOrderAction = async (
  imageId: string, 
  newOrder: number, 
  itemId: string
): Promise<ActionResult<SelectImage>> => {
  try {
    const [updatedImage] = await updateImageOrder(imageId, newOrder);
    
    // Add a cache-busting timestamp to ensure fresh data
    const timestamp = Date.now();
    
    // Revalidate all paths that might display this item's images
    revalidatePath(`/?t=${timestamp}`);  // Home page with catalog
    revalidatePath(`/item/${itemId}?t=${timestamp}`);  // Item details page
    revalidatePath(`/my-collection?t=${timestamp}`);  // Collection page
    
    return { isSuccess: true, data: updatedImage };
  } catch (error) {
    console.error("Failed to update image order:", error);
    return { isSuccess: false, error: "Failed to update image order" };
  }
};

export const reorderImagesAction = async (
  itemId: string,
  imageOrders: { id: string; order: number }[]
): Promise<ActionResult<void>> => {
  try {
    await updateMultipleImageOrders(imageOrders);
    
    // Update the imagesUpdatedAt timestamp on the item
    // Always log this for troubleshooting the sync issue
    console.log(`[IMAGES] Updating imagesUpdatedAt timestamp for item ${itemId} after reordering images`);
    const now = new Date();
    await updateItem(itemId, { 
      imagesUpdatedAt: now
    });
    debugLog(`[IMAGES] Timestamp updated to ${now.toISOString()}`);
    
    // Add a cache-busting timestamp to ensure fresh data
    const timestamp = Date.now();
    
    // Revalidate all paths that might display this item's images
    revalidatePath(`/?t=${timestamp}`);  // Home page with catalog
    revalidatePath(`/item/${itemId}?t=${timestamp}`);  // Item details page
    revalidatePath(`/my-collection?t=${timestamp}`);  // Collection page
    
    return { isSuccess: true };
  } catch (error) {
    console.error("Failed to reorder images:", error);
    return { isSuccess: false, error: "Failed to reorder images" };
  }
};