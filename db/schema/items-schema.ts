import { pgTable, text, integer, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";

export const itemTypeEnum = pgEnum("item_type", [
  "Action Figures",
  "Books",
  "Comics",
  "Funko Pops",
  "Movie, TV Show Memorabilia",
  "Music Memorabilia",
  "Toys",
  "Video Games and Consoles",
  "Wargaming",
  "Other"
]);

export const franchiseEnum = pgEnum("franchise", [
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

export const conditionEnum = pgEnum("condition", [
  "New",
  "Used - complete",
  "Used - item only"
]);

export const itemsTable = pgTable("items", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  franchise: text("franchise").notNull(),
  manufacturer: text("manufacturer"),
  year: integer("year"),
  condition: conditionEnum("condition").notNull().default("Used - complete"),
  acquired: timestamp("acquired").notNull(),
  cost: integer("cost").notNull(),
  value: integer("value").notNull(),
  ebaySold: integer("ebay_sold"),
  ebayListed: integer("ebay_listed"),
  image: text("image"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isSold: boolean("is_sold").default(false).notNull(),
  soldPrice: integer("sold_price"),
  soldDate: timestamp("sold_date")
});

export type InsertItem = typeof itemsTable.$inferInsert;
export type SelectItem = typeof itemsTable.$inferSelect;