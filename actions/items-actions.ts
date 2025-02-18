"use server";

import { revalidatePath } from "next/cache";
import { getItemsByUserId, getItemById, insertItem, updateItem, deleteItem } from "@/db/queries/items-queries";
import { itemsTable, SelectItem } from "@/db/schema/items-schema";
import { imagesTable } from "@/db/schema/images-schema"; // Add this line
import { eq, ne, and, or } from 'drizzle-orm';
import { db } from '@/db/db'; // Updated import
import { itemTypeEnum, brandEnum } from "@/db/schema/items-schema";
import crypto from 'crypto'; // Added import for crypto

// Define ActionResult type
type ActionResult<T> = {
  isSuccess: boolean;
  data?: T;
  error?: string;
};

export const getItemsByUserIdAction = async (userId: string): Promise<ActionResult<SelectItem[]>> => {
  try {
    const items = await getItemsByUserId(userId);
    return { isSuccess: true, data: items };
  } catch (error) {
    console.error("Failed to get items:", error);
    return { isSuccess: false, error: "Failed to get items" };
  }
};

export const getItemByIdAction = async (id: string): Promise<ActionResult<SelectItem>> => {
  try {
    const item = await getItemById(id);
    return { isSuccess: true, data: item[0] };
  } catch (error) {
    console.error("Failed to get item:", error);
    return { isSuccess: false, error: "Failed to get item" };
  }
};

export const createItemAction = async (item: {
  id: string;
  userId: string;
  name: string;
  type: string;
  brand: string;
  acquired: Date;
  cost: number;
  value: number;
  notes: string;
  isSold: boolean;
  soldDate?: Date;
  soldPrice?: number;
  ebayListed?: number;
  ebaySold?: number;
  image?: string;
  images?: string[];
}) => {
  try {
    console.log('Attempting to create item:', JSON.stringify(item, null, 2));

    // Remove the enum validation since we now support custom types and brands
    const insertData = {
      ...item,
      cost: Math.round(item.cost), // Round to nearest integer
      value: Math.round(item.value), // Round to nearest integer
      soldPrice: item.soldPrice ? Math.round(item.soldPrice) : undefined,
      ebayListed: item.ebayListed ? Math.round(item.ebayListed) : undefined,
      ebaySold: item.ebaySold ? Math.round(item.ebaySold) : undefined,
      image: item.image || item.images?.[0], // Use the first image as the main image
    };

    console.log('Data to be inserted:', JSON.stringify(insertData, null, 2));

    const result = await db.insert(itemsTable).values(insertData).returning();

    // Insert additional images
    if (item.images && item.images.length > 0) {
      const imageInserts = item.images.map(url => ({
        id: crypto.randomUUID(),
        itemId: result[0].id,
        userId: item.userId,
        url,
      }));
      await db.insert(imagesTable).values(imageInserts);
    }

    console.log('Item created successfully:', JSON.stringify(result[0], null, 2));
    return { isSuccess: true, data: result[0] };
  } catch (error: unknown) {
    console.error('Detailed error creating item:', error);
    if (error instanceof Error) {
      return { isSuccess: false, error: `Failed to create item: ${error.message}` };
    } else {
      return { isSuccess: false, error: 'Failed to create item: Unknown error' };
    }
  }
};

export const updateItemAction = async (id: string, data: Partial<SelectItem>): Promise<ActionResult<SelectItem[]>> => {
  try {
    console.log('Updating item:', id, 'with data:', data);
    const updatedItem = await updateItem(id, data);
    console.log('Item updated successfully:', updatedItem);
    revalidatePath("/my-collection");
    return { isSuccess: true, data: updatedItem };
  } catch (error) {
    console.error('Error updating item:', error);
    return { isSuccess: false, error: 'Failed to update item' };
  }
};

export const deleteItemAction = async (id: string): Promise<ActionResult<void>> => {
  try {
    await deleteItem(id);
    revalidatePath("/");
    return { isSuccess: true };
  } catch (error) {
    console.error("Failed to delete item:", error);
    return { isSuccess: false, error: "Failed to delete item" };
  }
};

export const getRelatedItemsAction = async (brand: string, currentItemId: string, isSold: boolean): Promise<ActionResult<SelectItem[]>> => {
  try {
    const relatedItems = await db.select().from(itemsTable)
      .where(
        and(
          eq(itemsTable.brand, brand as any), // Type assertion to avoid enum type mismatch
          ne(itemsTable.id, currentItemId),
          eq(itemsTable.isSold, isSold)
        )
      )
      .limit(3);

    return { isSuccess: true, data: relatedItems };
  } catch (error) {
    console.error("Failed to fetch related items:", error);
    return { isSuccess: false, error: "Failed to fetch related items" };
  }
};