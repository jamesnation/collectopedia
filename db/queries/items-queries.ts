import { db } from "@/db/db";
import { itemsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export const getItemsByUserId = (userId: string) => {
  return db.select().from(itemsTable).where(eq(itemsTable.userId, userId));
};

export const getItemById = (id: string) => {
  return db.select().from(itemsTable).where(eq(itemsTable.id, id));
};

export const insertItem = (item: typeof itemsTable.$inferInsert) => {
  return db.insert(itemsTable).values(item);
};

export const updateItem = (id: string, item: Partial<typeof itemsTable.$inferInsert>) => {
  return db.update(itemsTable).set(item).where(eq(itemsTable.id, id));
};

export const deleteItem = (id: string) => {
  return db.delete(itemsTable).where(eq(itemsTable.id, id));
};