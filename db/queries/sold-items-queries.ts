import { db } from "@/db/db";
import { soldItemsTable, InsertSoldItem } from "@/db/schema";
import { eq } from "drizzle-orm";

export const insertSoldItem = async (soldItem: InsertSoldItem) => {
  return await db.insert(soldItemsTable).values(soldItem).returning();
};

export const getSoldItemByItemId = async (itemId: string) => {
  return await db.select().from(soldItemsTable).where(eq(soldItemsTable.itemId, itemId));
};

export const updateSoldItem = async (id: string, data: Partial<InsertSoldItem>) => {
  return await db
    .update(soldItemsTable)
    .set(data)
    .where(eq(soldItemsTable.id, id))
    .returning();
};

export const deleteSoldItem = async (id: string) => {
  return await db.delete(soldItemsTable).where(eq(soldItemsTable.id, id));
};