"use server";

import { revalidatePath } from "next/cache";
import { getImagesByItemId, insertImage, deleteImage, updateImageOrder, updateMultipleImageOrders } from "@/db/queries/images-queries";
import { InsertImage, SelectImage } from "@/db/schema/images-schema";
import { updateItem } from "@/db/queries/items-queries";
import crypto from 'crypto';
import { auth } from "@clerk/nextjs/server";
import { CreateImageSchema, DeleteImageSchema, ReorderImagesSchema, UpdateImageOrderSchema } from "@/lib/schemas/image-schemas";
import { getItemById } from "@/db/queries/items-queries";
import { db } from "@/db/db";
import { imagesTable } from "@/db/schema/images-schema";
import { eq } from "drizzle-orm";

type ActionResult<T> = {
  isSuccess: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string[]>;
};

// Helper for conditional logging based on environment
const debugLog = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, ...args);
  }
};

/**
 * Fetches images associated with a specific item ID.
 * 
 * Security: If images are meant to be public, this verifies item ownership
 * to ensure only authorized users can access their own images.
 */
export const getImagesByItemIdAction = async (itemId: string): Promise<ActionResult<SelectImage[]>> => {
  try {
    // Get authenticated userId from Clerk session
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Authentication Required: User not logged in." };
    }
    
    // Verify the item belongs to the authenticated user
    const item = await getItemById(itemId);
    if (!item || item.length === 0) {
      return { isSuccess: false, error: "Item not found" };
    }
    
    if (item[0].userId !== userId) {
      return { isSuccess: false, error: "Authorization Failed: You don't have permission to access images for this item." };
    }
    
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
 * Batch retrieves images for multiple items at once.
 * 
 * Security: Verifies that the authenticated user owns all requested items
 * before returning their associated images.
 */
export const getBatchImagesByItemIdsAction = async (itemIds: string[]): Promise<ActionResult<Record<string, SelectImage[]>>> => {
  try {
    // Get authenticated userId from Clerk session
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Authentication Required: User not logged in." };
    }
    
    if (!itemIds.length) {
      return { isSuccess: true, data: {} };
    }
    
    // Log the batch request
    console.log(`[BATCH-IMAGES] Fetching images for ${itemIds.length} items in a single request`);
    
    // Verify that all itemIds belong to the authenticated user
    // This can be more efficient than checking each item individually
    const items = await db.select({
      id: imagesTable.itemId,
      userId: imagesTable.userId,
    })
    .from(imagesTable)
    .where(
      eq(imagesTable.userId, userId)
    );
    
    // Get the set of item IDs that the user owns
    const userItemIds = new Set(items.map(item => item.id));
    
    // Filter out item IDs that don't belong to the user
    const authorizedItemIds = itemIds.filter(id => userItemIds.has(id));
    
    // If none of the requested items belong to the user, return empty result
    if (authorizedItemIds.length === 0) {
      console.warn('[BATCH-IMAGES] None of the requested items belong to the authenticated user');
      return { isSuccess: true, data: {} };
    }
    
    // Create a map to store images by item ID
    const imagesMap: Record<string, SelectImage[]> = {};
    
    // Use Promise.all to fetch all images in parallel
    await Promise.all(
      authorizedItemIds.map(async (itemId) => {
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

/**
 * Creates a new image associated with an item.
 * 
 * Security: Validates input data and verifies that the authenticated user
 * owns the item before creating the image.
 */
export const createImageAction = async (imageData: unknown): Promise<ActionResult<SelectImage>> => {
  try {
    // Get authenticated userId from Clerk session
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Authentication Required: User not logged in." };
    }
    
    // Validate input with Zod schema
    const validationResult = CreateImageSchema.safeParse(imageData);
    if (!validationResult.success) {
      return {
        isSuccess: false,
        error: "Invalid image data",
        validationErrors: validationResult.error.formErrors.fieldErrors
      };
    }
    
    // Get the validated data
    const validatedImage = validationResult.data;
    
    // Verify the item belongs to the authenticated user
    const item = await getItemById(validatedImage.itemId);
    if (!item || item.length === 0) {
      return { isSuccess: false, error: "Item not found" };
    }
    
    if (item[0].userId !== userId) {
      return { isSuccess: false, error: "Authorization Failed: You don't have permission to add images to this item." };
    }
    
    // Get the current images to determine the next order
    const currentImages = await getImagesByItemId(validatedImage.itemId);
    const nextOrder = currentImages.length;
    
    // Create image with the authenticated userId, not the one from input
    const imageWithId = { 
      ...validatedImage, 
      id: crypto.randomUUID(),
      userId: userId, // Ensure we use the authenticated userId
      order: nextOrder // Set the order to be at the end of the list
    };
    
    const [createdImage] = await insertImage(imageWithId);
    
    // Update the imagesUpdatedAt timestamp on the item
    // Always log this for troubleshooting the sync issue
    console.log(`[IMAGES] Updating imagesUpdatedAt timestamp for item ${validatedImage.itemId}`);
    const now = new Date();
    await updateItem(validatedImage.itemId, { 
      imagesUpdatedAt: now
    });
    debugLog(`[IMAGES] Timestamp updated to ${now.toISOString()}`);
    
    // Add a cache-busting timestamp to ensure fresh data
    const timestamp = Date.now();
    
    // Revalidate all paths that might display this item's images
    revalidatePath(`/?t=${timestamp}`);  // Home page with catalog
    revalidatePath(`/item/${validatedImage.itemId}?t=${timestamp}`);  // Item details page
    revalidatePath(`/my-collection?t=${timestamp}`);  // Collection page
    
    return { isSuccess: true, data: createdImage };
  } catch (error) {
    console.error("Failed to create image:", error);
    return { isSuccess: false, error: "Failed to create image" };
  }
};

/**
 * Deletes an image by its ID.
 * 
 * Security: Verifies that the authenticated user owns the image
 * before deleting it.
 */
export const deleteImageAction = async (id: string, itemId?: string): Promise<ActionResult<void>> => {
  try {
    // Get authenticated userId from Clerk session
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Authentication Required: User not logged in." };
    }
    
    // Validate input with Zod schema
    const validationResult = DeleteImageSchema.safeParse({ id, itemId });
    if (!validationResult.success) {
      return {
        isSuccess: false,
        error: "Invalid image data",
        validationErrors: validationResult.error.formErrors.fieldErrors
      };
    }
    
    // Fetch the image to check ownership
    const [image] = await db
      .select()
      .from(imagesTable)
      .where(eq(imagesTable.id, id));
    
    if (!image) {
      return { isSuccess: false, error: "Image not found" };
    }
    
    // Verify the image belongs to the authenticated user
    if (image.userId !== userId) {
      return { isSuccess: false, error: "Authorization Failed: You don't have permission to delete this image." };
    }
    
    // If itemId is provided, verify that matches too for extra security
    if (itemId && image.itemId !== itemId) {
      return { isSuccess: false, error: "Image does not belong to the specified item" };
    }
    
    await deleteImage(id);
    
    // Use the itemId from the fetched image if not provided as an argument
    const actualItemId = itemId || image.itemId;
    
    // Update the imagesUpdatedAt timestamp on the item
    // Always log this for troubleshooting the sync issue
    console.log(`[IMAGES] Updating imagesUpdatedAt timestamp for item ${actualItemId} after deleting image`);
    const now = new Date();
    await updateItem(actualItemId, { 
      imagesUpdatedAt: now
    });
    debugLog(`[IMAGES] Timestamp updated to ${now.toISOString()}`);
    
    // Add a cache-busting timestamp to ensure fresh data
    const timestamp = Date.now();
    
    // Revalidate all paths that might display this item's images
    revalidatePath(`/?t=${timestamp}`);  // Home page with catalog
    revalidatePath(`/item/${actualItemId}?t=${timestamp}`);  // Item details page
    revalidatePath(`/my-collection?t=${timestamp}`);  // Collection page
    
    return { isSuccess: true };
  } catch (error) {
    console.error("Failed to delete image:", error);
    return { isSuccess: false, error: "Failed to delete image" };
  }
};

/**
 * Creates multiple images at once.
 * 
 * Security: Verifies that the authenticated user owns all items
 * associated with the images before creating them.
 */
export const createMultipleImagesAction = async (images: unknown): Promise<ActionResult<SelectImage[]>> => {
  try {
    // Get authenticated userId from Clerk session
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Authentication Required: User not logged in." };
    }
    
    // Validate that images is an array
    if (!Array.isArray(images)) {
      return { isSuccess: false, error: "Images must be an array" };
    }
    
    // Validate each image and check item ownership
    const validatedImages: InsertImage[] = [];
    const itemOwnershipMap = new Map<string, boolean>();
    
    for (const image of images) {
      // Validate the image data
      const validationResult = CreateImageSchema.safeParse(image);
      if (!validationResult.success) {
        return {
          isSuccess: false,
          error: `Invalid image data: ${validationResult.error.message}`,
          validationErrors: validationResult.error.formErrors.fieldErrors
        };
      }
      
      const validatedImage = validationResult.data;
      
      // Check item ownership if we haven't already checked this item
      if (!itemOwnershipMap.has(validatedImage.itemId)) {
        const item = await getItemById(validatedImage.itemId);
        if (!item || item.length === 0) {
          return { isSuccess: false, error: `Item ${validatedImage.itemId} not found` };
        }
        
        if (item[0].userId !== userId) {
          return { isSuccess: false, error: `Authorization Failed: You don't have permission to add images to item ${validatedImage.itemId}.` };
        }
        
        // Store the result so we don't need to check again for this item
        itemOwnershipMap.set(validatedImage.itemId, true);
      }
      
      // Add to validated images with correct userId
      validatedImages.push({
        ...validatedImage,
        id: crypto.randomUUID(),
        userId: userId // Ensure we use the authenticated userId
      });
    }
    
    // Create all the images
    const createdImages = await Promise.all(
      validatedImages.map(async (image) => {
        const [createdImage] = await insertImage(image);
        return createdImage;
      })
    );
    
    // For each unique itemId, update the imagesUpdatedAt timestamp
    const uniqueItemIds = [...new Set(validatedImages.map(img => img.itemId))];
    const now = new Date();
    
    await Promise.all(
      uniqueItemIds.map(async (itemId) => {
        console.log(`[IMAGES] Updating imagesUpdatedAt timestamp for item ${itemId} after adding multiple images`);
        await updateItem(itemId, { imagesUpdatedAt: now });
      })
    );
    
    // Revalidate paths with a cache-busting timestamp
    const timestamp = Date.now();
    revalidatePath(`/?t=${timestamp}`);
    revalidatePath(`/my-collection?t=${timestamp}`);
    
    // Revalidate item detail pages for each affected item
    uniqueItemIds.forEach(itemId => {
      revalidatePath(`/item/${itemId}?t=${timestamp}`);
    });
    
    return { isSuccess: true, data: createdImages };
  } catch (error) {
    console.error("Failed to create multiple images:", error);
    return { isSuccess: false, error: "Failed to create multiple images" };
  }
};

/**
 * Updates the order of a single image.
 * 
 * Security: Verifies that the authenticated user owns the image
 * and associated item before updating the order.
 */
export const updateImageOrderAction = async (
  imageId: string, 
  newOrder: number, 
  itemId: string
): Promise<ActionResult<SelectImage>> => {
  try {
    // Get authenticated userId from Clerk session
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Authentication Required: User not logged in." };
    }
    
    // Validate input with Zod schema
    const validationResult = UpdateImageOrderSchema.safeParse({ imageId, newOrder, itemId });
    if (!validationResult.success) {
      return {
        isSuccess: false,
        error: "Invalid order data",
        validationErrors: validationResult.error.formErrors.fieldErrors
      };
    }
    
    // Verify the item belongs to the authenticated user
    const item = await getItemById(itemId);
    if (!item || item.length === 0) {
      return { isSuccess: false, error: "Item not found" };
    }
    
    if (item[0].userId !== userId) {
      return { isSuccess: false, error: "Authorization Failed: You don't have permission to update images for this item." };
    }
    
    // Fetch the image to verify it belongs to this item and user
    const [image] = await db
      .select()
      .from(imagesTable)
      .where(eq(imagesTable.id, imageId));
    
    if (!image) {
      return { isSuccess: false, error: "Image not found" };
    }
    
    if (image.itemId !== itemId) {
      return { isSuccess: false, error: "Image does not belong to the specified item" };
    }
    
    if (image.userId !== userId) {
      return { isSuccess: false, error: "Authorization Failed: You don't have permission to update this image." };
    }
    
    const [updatedImage] = await updateImageOrder(imageId, newOrder);
    
    // Update the imagesUpdatedAt timestamp on the item
    console.log(`[IMAGES] Updating imagesUpdatedAt timestamp for item ${itemId} after updating image order`);
    const now = new Date();
    await updateItem(itemId, { 
      imagesUpdatedAt: now
    });
    
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

/**
 * Reorders multiple images for an item.
 * 
 * Security: Verifies that the authenticated user owns the item
 * before updating the image orders.
 */
export const reorderImagesAction = async (
  itemId: string,
  imageOrders: { id: string; order: number }[]
): Promise<ActionResult<void>> => {
  try {
    // Get authenticated userId from Clerk session
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Authentication Required: User not logged in." };
    }
    
    // Validate input with Zod schema
    const validationResult = ReorderImagesSchema.safeParse({ itemId, imageOrders });
    if (!validationResult.success) {
      return {
        isSuccess: false,
        error: "Invalid reordering data",
        validationErrors: validationResult.error.formErrors.fieldErrors
      };
    }
    
    // Verify the item belongs to the authenticated user
    const item = await getItemById(itemId);
    if (!item || item.length === 0) {
      return { isSuccess: false, error: "Item not found" };
    }
    
    if (item[0].userId !== userId) {
      return { isSuccess: false, error: "Authorization Failed: You don't have permission to reorder images for this item." };
    }
    
    // Get all the images for this item to verify they belong to this user
    const itemImages = await getImagesByItemId(itemId);
    const imageIds = new Set(itemImages.map(img => img.id));
    
    // Verify all requested image IDs are part of this item
    for (const { id } of imageOrders) {
      if (!imageIds.has(id)) {
        return { isSuccess: false, error: `Image ${id} does not belong to item ${itemId}` };
      }
    }
    
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