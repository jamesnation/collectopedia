// Added 2024-04-04: Queries for consolidated custom attributes.
import { db } from "@/db/db";
import {
  customAttributesTable,
  attributeTypeEnum, // Import the enum
  type SelectCustomAttribute,
  type InsertCustomAttribute
} from "@/db/schema"; // Import from the main schema index
import { eq, and } from "drizzle-orm";
import crypto from 'crypto'; // For generating IDs if needed

// Type for the attribute type enum values
// Ensures we only use 'brand', 'franchise', or 'type'
type AttributeType = typeof attributeTypeEnum.enumValues[number];

/**
 * Get all custom attributes for a specific user and type.
 * Selects all columns by default. Orders by name.
 * @param userId - The ID of the user.
 * @param type - The type of attribute ('brand', 'franchise', 'type').
 * @returns Promise<SelectCustomAttribute[]> - A list of attributes.
 */
export const getCustomAttributes = async (
  userId: string,
  type: AttributeType
): Promise<SelectCustomAttribute[]> => {
  return await db
    .select() // Select all columns for now, can be optimized later if needed
    .from(customAttributesTable)
    .where(
      and(
        // Filter by the user who created the attribute
        eq(customAttributesTable.userId, userId),
        // Filter by the specific type requested (brand, franchise, or type)
        eq(customAttributesTable.attribute_type, type)
      )
    )
    .orderBy(customAttributesTable.name); // Order alphabetically by name
};

/**
 * Get a single custom attribute by its ID.
 * Selects all columns.
 * @param id - The ID of the attribute.
 * @returns Promise<SelectCustomAttribute | undefined> - The attribute or undefined if not found.
 */
export const getCustomAttributeById = async (id: string): Promise<SelectCustomAttribute | undefined> => {
  const results = await db
    .select()
    .from(customAttributesTable)
    .where(eq(customAttributesTable.id, id))
    .limit(1); // Expecting only one result for a given ID

  // Return the first result, or undefined if the array is empty
  return results[0];
};

/**
 * Creates a new custom attribute in the database.
 * Automatically generates a unique ID.
 * @param data - Object containing userId, name, attribute_type, and optional description.
 * @returns Promise<SelectCustomAttribute> - The newly created attribute record (including all columns).
 */
export const createCustomAttribute = async (
  // Use Pick<> to specify required fields for creation from InsertCustomAttribute type
  data: Pick<InsertCustomAttribute, 'userId' | 'name' | 'attribute_type' | 'description'>
): Promise<SelectCustomAttribute> => {
  const [newAttribute] = await db
    .insert(customAttributesTable)
    .values({
      id: crypto.randomUUID(), // Generate a new UUID for the primary key
      ...data, // Spread the provided data (userId, name, type, description)
      // Ensure updatedAt is set on creation, mirroring previous schema behavior
      // createdAt has a default in the schema, but updatedAt might not
      updatedAt: new Date()
    })
    .returning(); // Return all columns of the newly inserted row

  return newAttribute;
};

/**
 * Updates an existing custom attribute.
 * Only allows updating name and description. Updates the 'updatedAt' timestamp.
 * @param id - The ID of the attribute to update.
 * @param data - Object containing the new `name` (required) and optionally `description` (can be null to clear).
 * @returns Promise<SelectCustomAttribute | undefined> - The updated attribute record or undefined if not found.
 */
export const updateCustomAttribute = async (
  id: string,
  // Define the shape of the update data
  data: { name: string; description?: string | null }
): Promise<SelectCustomAttribute | undefined> => {
  const [updatedAttribute] = await db
    .update(customAttributesTable)
    .set({
      name: data.name,
      description: data.description, // Pass description directly (handles null or string)
      updatedAt: new Date() // Update the 'updatedAt' timestamp
    })
    .where(eq(customAttributesTable.id, id)) // Specify which row to update
    .returning(); // Return the updated row

  // Return the updated attribute, or undefined if the ID didn't match any row
  return updatedAttribute;
};

/**
 * Deletes a custom attribute from the database by its ID.
 * @param id - The ID of the attribute to delete.
 * @returns Promise<void> - Resolves when the deletion is complete.
 */
export const deleteCustomAttribute = async (id: string): Promise<void> => {
  await db
    .delete(customAttributesTable)
    .where(eq(customAttributesTable.id, id)); // Specify which row to delete
};



