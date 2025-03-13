import { db } from "@/db/db";
import { itemHistoryTable, InsertItemHistory, SelectItemHistory } from "@/db/schema/item-history-schema";
import { eq, desc } from "drizzle-orm";

// Insert a new history event
export const insertItemHistory = async (data: InsertItemHistory): Promise<SelectItemHistory> => {
  const [inserted] = await db.insert(itemHistoryTable).values(data).returning();
  return inserted;
};

// Get history events for an item
export const getItemHistoryByItemId = async (itemId: string): Promise<SelectItemHistory[]> => {
  const events = await db
    .select()
    .from(itemHistoryTable)
    .where(eq(itemHistoryTable.itemId, itemId))
    .orderBy(desc(itemHistoryTable.timestamp));
  
  return events;
};

// Get a specific history event by ID
export const getItemHistoryById = async (id: string): Promise<SelectItemHistory | undefined> => {
  const [event] = await db
    .select()
    .from(itemHistoryTable)
    .where(eq(itemHistoryTable.id, id))
    .limit(1);
  
  return event;
};

// Delete all history events for an item
export const deleteItemHistoryByItemId = async (itemId: string): Promise<void> => {
  await db
    .delete(itemHistoryTable)
    .where(eq(itemHistoryTable.itemId, itemId));
}; 