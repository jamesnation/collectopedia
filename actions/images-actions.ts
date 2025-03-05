"use server";

import { revalidatePath } from "next/cache";
import { getImagesByItemId, insertImage, deleteImage } from "@/db/queries/images-queries";
import { InsertImage, SelectImage } from "@/db/schema/images-schema";
import crypto from 'crypto';

type ActionResult<T> = {
  isSuccess: boolean;
  data?: T;
  error?: string;
};

export const getImagesByItemIdAction = async (itemId: string): Promise<ActionResult<SelectImage[]>> => {
  try {
    console.log(`Fetching images for item ${itemId}`);
    const images = await getImagesByItemId(itemId);
    console.log(`Successfully fetched ${images.length} images for item ${itemId}`);
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

export const createImageAction = async (image: Omit<InsertImage, 'id'>): Promise<ActionResult<SelectImage>> => {
  try {
    const imageWithId = { ...image, id: crypto.randomUUID() };
    const [createdImage] = await insertImage(imageWithId);
    
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