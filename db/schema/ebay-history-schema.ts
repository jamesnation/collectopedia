import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const ebayHistoryTable = pgTable("ebay_history", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id").notNull(),
  totalValue: integer("total_value").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InsertEbayHistory = typeof ebayHistoryTable.$inferInsert;
export type SelectEbayHistory = typeof ebayHistoryTable.$inferSelect; 