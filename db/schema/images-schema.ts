import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { itemsTable } from "./items-schema";

export const imagesTable = pgTable("images", {
  id: text("id").primaryKey().notNull(),
  itemId: text("item_id").references(() => itemsTable.id).notNull(),
  userId: text("user_id").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InsertImage = typeof imagesTable.$inferInsert;
export type SelectImage = typeof imagesTable.$inferSelect;