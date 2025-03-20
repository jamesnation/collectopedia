"use server";

import { revalidatePath } from "next/cache";
import { getImagesByItemId, insertImage, deleteImage, updateImageOrder, updateMultipleImageOrders } from "@/db/queries/images-queries";
import { InsertImage, SelectImage } from "@/db/schema/images-schema";
import crypto from 'crypto';

type ActionResult<T> = {
  isSuccess: boolean;
  data?: T;
  error?: string;
};

export const getImagesByItemIdAction = async (itemId: string): Promise<ActionResult<SelectImage[]>> => {
  try {
    const images = await getImagesByItemId(itemId);
    
    const result = {
      isSuccess: true,
      data: images.map(img => ({
        ...img,
        _lastModified: img.updatedAt || img.createdAt || new Date().toISOString()
      }))
    };
    
    return result;
  } catch (error) {
    console.error(`Failed to get images for item ${itemId}:`, error);
    return { 
      isSuccess: false, 
      error: error instanceof Error ? error.message : "Failed to get images",
      data: []
    };
  }
};

export const createImageAction = async (image: Omit<InsertImage, 'id'>): Promise<ActionResult<SelectImage>> => {
  try {
    const currentImages = await getImagesByItemId(image.itemId);
    const nextOrder = currentImages.length;
    
    const imageWithId = { 
      ...image, 
      id: crypto.randomUUID(),
      order: nextOrder
    };
    
    const [createdImage] = await insertImage(imageWithId);
    
    const timestamp = Date.now();
    
    const resultWithTimestamp = {
      ...createdImage,
      _lastModified: new Date().toISOString(),
      _timestamp: timestamp
    };
    
    revalidatePath(`/?t=${timestamp}`);
    revalidatePath(`/item/${image.itemId}?t=${timestamp}`);
    revalidatePath(`/my-collection?t=${timestamp}`);
    
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('invalidate-image-cache', { 
        detail: { itemId: image.itemId } 
      });
      window.dispatchEvent(event);
    }
    
    return { isSuccess: true, data: resultWithTimestamp };
  } catch (error) {
    console.error("Failed to create image:", error);
    return { isSuccess: false, error: "Failed to create image" };
  }
};

export const deleteImageAction = async (id: string, itemId?: string): Promise<ActionResult<void>> => {
  try {
    await deleteImage(id);
    
    const timestamp = Date.now();
    
    revalidatePath(`/?t=${timestamp}`);
    if (itemId) {
      revalidatePath(`/item/${itemId}?t=${timestamp}`);
    }
    revalidatePath(`/my-collection?t=${timestamp}`);
    
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
    
    const timestamp = Date.now();
    
    revalidatePath(`/?t=${timestamp}`);
    revalidatePath(`/item/${itemId}?t=${timestamp}`);
    revalidatePath(`/my-collection?t=${timestamp}`);
    
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
    
    const timestamp = Date.now();
    
    revalidatePath(`/?t=${timestamp}`);
    revalidatePath(`/item/${itemId}?t=${timestamp}`);
    revalidatePath(`/my-collection?t=${timestamp}`);
    
    return { isSuccess: true };
  } catch (error) {
    console.error("Failed to reorder images:", error);
    return { isSuccess: false, error: "Failed to reorder images" };
  }
};