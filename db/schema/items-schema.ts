import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const itemTypeEnum = pgEnum("item_type", ["Doll", "Building Set", "Trading Card", "Die-cast Car", "Action Figure"]);

export const itemsTable = pgTable("items", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  type: itemTypeEnum("type").notNull(),
  acquired: timestamp("acquired").notNull(),
  cost: integer("cost").notNull(),
  value: integer("value").notNull(),
  ebaySold: integer("ebay_sold"),
  ebayListed: integer("ebay_listed"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export type InsertItem = typeof itemsTable.$inferInsert;
export type SelectItem = typeof itemsTable.$inferSelect;