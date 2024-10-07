import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const soldItemsTable = pgTable("sold_items", {
  id: text("id").primaryKey().notNull(),
  itemId: text("item_id").notNull(),
  userId: text("user_id").notNull(),
  soldPrice: integer("sold_price").notNull(),
  soldDate: timestamp("sold_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export type InsertSoldItem = typeof soldItemsTable.$inferInsert;
export type SelectSoldItem = typeof soldItemsTable.$inferSelect;