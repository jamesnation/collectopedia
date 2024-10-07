"use server";

import { revalidatePath } from "next/cache";
import { getItemsByUserId, getItemById, insertItem, updateItem, deleteItem } from "@/db/queries/items-queries";
import { itemsTable, SelectItem } from "@/db/schema/items-schema";
import { eq, ne, and, or } from 'drizzle-orm';
import { db } from '@/db/db'; // Updated import

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

export const createItemAction = async (item: typeof itemsTable.$inferInsert): Promise<ActionResult<void>> => {
  try {
    await insertItem(item);
    revalidatePath("/");
    return { isSuccess: true };
  } catch (error) {
    console.error("Failed to create item:", error);
    return { isSuccess: false, error: "Failed to create item" };
  }
};

export const updateItemAction = async (id: string, data: Partial<SelectItem>): Promise<ActionResult<SelectItem[]>> => {
  try {
    const updatedItem = await updateItem(id, data);
    revalidatePath("/catalog");
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