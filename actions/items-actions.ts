"use server";

import { createItem, getItemById, getItemsByUserId, updateItem, deleteItem } from "@/db/queries/items-queries";
import { InsertItem, SelectItem } from "@/db/schema/items-schema";
import { ActionResult } from "@/types/actions/actions-types";
import { revalidatePath } from "next/cache";

export async function createItemAction(data: InsertItem): Promise<ActionResult<SelectItem>> {
  try {
    const newItem = await createItem(data);
    revalidatePath("/");
    return { isSuccess: true, message: "Item created successfully", data: newItem };
  } catch (error) {
    return { isSuccess: false, message: "Failed to create item" };
  }
}

export async function getItemByIdAction(id: string): Promise<ActionResult<SelectItem | null>> {
  try {
    const item = await getItemById(id);
    return { isSuccess: true, message: "Item retrieved successfully", data: item };
  } catch (error) {
    return { isSuccess: false, message: "Failed to get item" };
  }
}

export async function getItemsByUserIdAction(userId: string): Promise<ActionResult<SelectItem[]>> {
  try {
    const items = await getItemsByUserId(userId);
    return { isSuccess: true, message: "Items retrieved successfully", data: items };
  } catch (error) {
    return { isSuccess: false, message: "Failed to get items" };
  }
}

export async function updateItemAction(id: string, data: Partial<InsertItem>): Promise<ActionResult<SelectItem>> {
  try {
    const updatedItem = await updateItem(id, data);
    revalidatePath("/");
    return { isSuccess: true, message: "Item updated successfully", data: updatedItem };
  } catch (error) {
    return { isSuccess: false, message: "Failed to update item" };
  }
}

export async function deleteItemAction(id: string): Promise<ActionResult<void>> {
  try {
    await deleteItem(id);
    revalidatePath("/");
    return { isSuccess: true, message: "Item deleted successfully" };
  } catch (error) {
    return { isSuccess: false, message: "Failed to delete item" };
  }
}