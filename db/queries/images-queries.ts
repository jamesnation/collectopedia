import { db } from "@/db/db";
import { imagesTable, InsertImage, SelectImage } from "@/db/schema/images-schema";
import { eq, asc } from "drizzle-orm";

export const getImagesByItemId = async (itemId: string): Promise<SelectImage[]> => {
  // Always sort images by order, with fallback to createdAt for images with the same order
  return db
    .select()
    .from(imagesTable)
    .where(eq(imagesTable.itemId, itemId))
    .orderBy(imagesTable.order, imagesTable.createdAt);
};

export const insertImage = async (image: InsertImage): Promise<SelectImage[]> => {
  return db.insert(imagesTable).values(image).returning();
};

export const deleteImage = async (id: string): Promise<void> => {
  await db.delete(imagesTable).where(eq(imagesTable.id, id));
};

export const updateImageOrder = async (imageId: string, newOrder: number): Promise<SelectImage[]> => {
  return db
    .update(imagesTable)
    .set({ order: newOrder, updatedAt: new Date() })
    .where(eq(imagesTable.id, imageId))
    .returning();
};

export const updateMultipleImageOrders = async (
  imageOrders: { id: string; order: number }[]
): Promise<void> => {
  // Use a transaction to ensure all updates are done atomically
  await db.transaction(async (tx) => {
    for (const { id, order } of imageOrders) {
      await tx
        .update(imagesTable)
        .set({ order, updatedAt: new Date() })
        .where(eq(imagesTable.id, id));
    }
  });
};