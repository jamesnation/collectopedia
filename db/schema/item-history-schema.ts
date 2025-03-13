import { pgTable, text, timestamp, uuid, json } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { itemsTable } from "./items-schema";

export const itemHistoryTable = pgTable('item_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').references(() => itemsTable.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  type: text('type').notNull(), // 'created', 'updated', 'priceChange', 'sold', 'purchased', 'statusChange'
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  details: json('details').$type<{
    field?: string;
    oldValue?: string | number | null;
    newValue?: string | number | null;
    price?: number;
    note?: string;
  }>(),
});

export type SelectItemHistory = typeof itemHistoryTable.$inferSelect;
export type InsertItemHistory = typeof itemHistoryTable.$inferInsert;

export const insertItemHistorySchema = createSelectSchema(itemHistoryTable);
export const selectItemHistorySchema = createSelectSchema(itemHistoryTable);

// Zod schema for validation
export const itemHistorySchema = z.object({
  id: z.string().uuid().optional(),
  itemId: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['created', 'updated', 'priceChange', 'sold', 'purchased', 'statusChange']),
  timestamp: z.date().optional(),
  details: z.object({
    field: z.string().optional(),
    oldValue: z.union([z.string(), z.number(), z.null()]).optional(),
    newValue: z.union([z.string(), z.number(), z.null()]).optional(),
    price: z.number().optional(),
    note: z.string().optional(),
  }).optional(),
}); 