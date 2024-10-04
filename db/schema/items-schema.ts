import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const itemTypeEnum = pgEnum("item_type", [
  "Vintage - MISB",
  "Vintage - opened",
  "New - MISB",
  "New - opened",
  "New - KO",
  "Cel",
  "Other"
]);

export const brandEnum = pgEnum("brand", [
  'Transformers',
  'TMNT',
  'M.A.S.K',
  'Visionaries',
  'WWF',
  'Warhammer',
  'Monsters in My Pocket',
  'Senate',
  'Skating (other)',
  'Other',
  'Unknown'
]);

export const itemsTable = pgTable("items", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  type: itemTypeEnum("type").notNull(),
  brand: brandEnum("brand").notNull(),
  acquired: timestamp("acquired").notNull(),
  cost: integer("cost").notNull(),
  value: integer("value").notNull(),
  ebaySold: integer("ebay_sold"),
  ebayListed: integer("ebay_listed"),
  image: text("image"),
  notes: text("notes"), // Add this line
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export type InsertItem = typeof itemsTable.$inferInsert;
export type SelectItem = typeof itemsTable.$inferSelect;