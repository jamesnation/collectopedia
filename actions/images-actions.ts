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
    const images = await getImagesByItemId(itemId);
    return { isSuccess: true, data: images };
  } catch (error) {
    console.error("Failed to get images:", error);
    return { isSuccess: false, error: "Failed to get images" };
  }
};

export const createImageAction = async (image: Omit<InsertImage, 'id'>): Promise<ActionResult<SelectImage>> => {
  try {
    const imageWithId = { ...image, id: crypto.randomUUID() };
    const [createdImage] = await insertImage(imageWithId);
    revalidatePath("/");
    return { isSuccess: true, data: createdImage };
  } catch (error) {
    console.error("Failed to create image:", error);
    return { isSuccess: false, error: "Failed to create image" };
  }
};

export const deleteImageAction = async (id: string): Promise<ActionResult<void>> => {
  try {
    await deleteImage(id);
    revalidatePath("/");
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