import { db } from "@/db/db";
import { imagesTable, InsertImage, SelectImage } from "@/db/schema/images-schema";
import { eq } from "drizzle-orm";

export const getImagesByItemId = async (itemId: string): Promise<SelectImage[]> => {
  return db.select().from(imagesTable).where(eq(imagesTable.itemId, itemId));
};

export const insertImage = async (image: InsertImage): Promise<SelectImage[]> => {
  return db.insert(imagesTable).values(image).returning();
};

export const deleteImage = async (id: string): Promise<void> => {
  await db.delete(imagesTable).where(eq(imagesTable.id, id));
};