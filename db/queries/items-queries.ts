import { db } from "@/db/db";
import { itemsTable, InsertItem, SelectItem } from "@/db/schema/items-schema";
import { eq } from "drizzle-orm";

export async function createItem(data: InsertItem): Promise<SelectItem> {
  const [newItem] = await db.insert(itemsTable).values(data).returning();
  return newItem;
}

export async function getItemById(id: string): Promise<SelectItem | null> {
  const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, id));
  return item || null;
}

export async function getItemsByUserId(userId: string): Promise<SelectItem[]> {
  return db.select().from(itemsTable).where(eq(itemsTable.userId, userId));
}

export async function updateItem(id: string, data: Partial<InsertItem>): Promise<SelectItem> {
  const [updatedItem] = await db
    .update(itemsTable)
    .set(data)
    .where(eq(itemsTable.id, id))
    .returning();
  return updatedItem;
}

export async function deleteItem(id: string): Promise<void> {
  await db.delete(itemsTable).where(eq(itemsTable.id, id));
}