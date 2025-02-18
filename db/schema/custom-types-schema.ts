import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const customTypesTable = pgTable("custom_types", {
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

export type InsertCustomType = typeof customTypesTable.$inferInsert;
export type SelectCustomType = typeof customTypesTable.$inferSelect; 