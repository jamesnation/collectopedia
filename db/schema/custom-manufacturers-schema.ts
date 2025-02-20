import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const customManufacturersTable = pgTable("custom_manufacturers", {
  id: uuid("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull()
});

export type InsertCustomManufacturer = typeof customManufacturersTable.$inferInsert;
export type SelectCustomManufacturer = typeof customManufacturersTable.$inferSelect; 