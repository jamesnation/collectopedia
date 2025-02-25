import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const customFranchisesTable = pgTable("custom_franchises", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull()
});

export type InsertCustomFranchise = typeof customFranchisesTable.$inferInsert;
export type SelectCustomFranchise = typeof customFranchisesTable.$inferSelect;
