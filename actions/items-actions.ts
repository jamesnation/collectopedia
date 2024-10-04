"use server";

import { revalidatePath } from "next/cache";
import { getItemsByUserId, getItemById, insertItem, updateItem, deleteItem } from "@/db/queries/items-queries";
import { itemsTable } from "@/db/schema";

export const getItemsByUserIdAction = async (userId: string) => {
  try {
    const items = await getItemsByUserId(userId);
    return { isSuccess: true, data: items };
  } catch (error) {
    console.error("Failed to get items:", error);
    return { isSuccess: false, error: "Failed to get items" };
  }
};

export const getItemByIdAction = async (id: string) => {
  try {
    const item = await getItemById(id);
    return { isSuccess: true, data: item[0] };
  } catch (error) {
    console.error("Failed to get item:", error);
    return { isSuccess: false, error: "Failed to get item" };
  }
};

export const createItemAction = async (item: typeof itemsTable.$inferInsert) => {
  try {
    await insertItem(item);
    revalidatePath("/");
    return { isSuccess: true };
  } catch (error) {
    console.error("Failed to create item:", error);
    return { isSuccess: false, error: "Failed to create item" };
  }
};

export const updateItemAction = async (id: string, item: Partial<typeof itemsTable.$inferInsert>) => {
  try {
    await updateItem(id, item);
    revalidatePath("/");
    return { isSuccess: true };
  } catch (error) {
    console.error("Failed to update item:", error);
    return { isSuccess: false, error: "Failed to update item" };
  }
};

export const deleteItemAction = async (id: string) => {
  try {
    await deleteItem(id);
    revalidatePath("/");
    return { isSuccess: true };
  } catch (error) {
    console.error("Failed to delete item:", error);
    return { isSuccess: false, error: "Failed to delete item" };
  }
};