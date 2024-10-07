"use server";

import { revalidatePath } from "next/cache";
import { insertSoldItem, getSoldItemByItemId, updateSoldItem, deleteSoldItem } from "@/db/queries/sold-items-queries";
import { soldItemsTable } from "@/db/schema";

export const createSoldItemAction = async (soldItem: typeof soldItemsTable.$inferInsert) => {
  try {
    const result = await insertSoldItem(soldItem);
    revalidatePath("/");
    return { isSuccess: true, data: result[0] };
  } catch (error) {
    console.error("Failed to create sold item:", error);
    return { isSuccess: false, error: "Failed to create sold item" };
  }
};

export const getSoldItemByItemIdAction = async (itemId: string) => {
  try {
    const soldItem = await getSoldItemByItemId(itemId);
    return { isSuccess: true, data: soldItem[0] };
  } catch (error) {
    console.error("Failed to get sold item:", error);
    return { isSuccess: false, error: "Failed to get sold item" };
  }
};

export const updateSoldItemAction = async (id: string, data: Partial<typeof soldItemsTable.$inferSelect>) => {
  try {
    const updatedSoldItem = await updateSoldItem(id, data);
    revalidatePath("/");
    return { isSuccess: true, data: updatedSoldItem[0] };
  } catch (error) {
    console.error('Error updating sold item:', error);
    return { isSuccess: false, error: 'Failed to update sold item' };
  }
};

export const deleteSoldItemAction = async (id: string) => {
  try {
    await deleteSoldItem(id);
    revalidatePath("/");
    return { isSuccess: true };
  } catch (error) {
    console.error("Failed to delete sold item:", error);
    return { isSuccess: false, error: "Failed to delete sold item" };
  }
};