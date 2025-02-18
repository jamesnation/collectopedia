import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const customBrandsTable = pgTable("custom_brands", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export type InsertCustomBrand = typeof customBrandsTable.$inferInsert;
export type SelectCustomBrand = typeof customBrandsTable.$inferSelect; 