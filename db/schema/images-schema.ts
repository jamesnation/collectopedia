import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { itemsTable } from "./items-schema";

export const imagesTable = pgTable("images", {
  id: text("id").primaryKey().notNull(),
  itemId: text("item_id").references(() => itemsTable.id, { onDelete: 'cascade' }).notNull(),
  userId: text("user_id").notNull(),
  url: text("url").notNull(),
  order: integer("order").default(0).notNull(),
  version: text("version").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InsertImage = typeof imagesTable.$inferInsert;
export type SelectImage = typeof imagesTable.$inferSelect;