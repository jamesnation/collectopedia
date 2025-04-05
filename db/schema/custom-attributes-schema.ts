// Added 2024-04-04: Schema for consolidated custom attributes (brands, franchises, types).
import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Define an enum for the attribute types
// This helps ensure only 'brand', 'franchise', or 'type' can be stored
export const attributeTypeEnum = pgEnum('attribute_type', ['brand', 'franchise', 'type']);

// Define the table structure
export const customAttributesTable = pgTable("custom_attributes", {
  // Unique identifier for the attribute, using text type like the others
  id: text("id").primaryKey().notNull(),
  // Link to the user who created this attribute
  userId: text("user_id").notNull(),
  // The name of the attribute (e.g., "Star Wars", "Action Figure", "Hasbro")
  name: text("name").notNull(),
  // An optional description for the attribute
  description: text("description"),
  // The type of attribute this row represents
  attribute_type: attributeTypeEnum('attribute_type').notNull(),
  // Timestamp for when the attribute was created
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  // Timestamp for when the attribute was last updated
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull()
});

// Define TypeScript types based on the table structure
// Useful for type safety when working with the data
export type InsertCustomAttribute = typeof customAttributesTable.$inferInsert;
export type SelectCustomAttribute = typeof customAttributesTable.$inferSelect;
