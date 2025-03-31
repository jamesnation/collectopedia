import { z } from 'zod';

/**
 * Zod schema for custom type operations
 * Created: 2025-03-31
 * 
 * Schema validates custom type data for creation and updates,
 * ensuring required fields are present and data types are correct.
 */

// Schema for creating a new custom type
export const CreateCustomTypeSchema = z.object({
  name: z.string().min(1, "Type name is required").max(50, "Type name too long"),
  description: z.string().max(255, "Description too long").optional().nullable(),
});

// Schema for updating an existing custom type
export const UpdateCustomTypeSchema = CreateCustomTypeSchema.partial();

// Schema for updating a custom type with ID
export const UpdateCustomTypeWithIdSchema = z.object({
  id: z.string().uuid("Invalid type ID format"),
  name: z.string().min(1, "Type name is required").max(50, "Type name too long").optional(),
  description: z.string().max(255, "Description too long").optional().nullable(),
});

// Create types from the schemas
export type CreateCustomTypeInput = z.infer<typeof CreateCustomTypeSchema>;
export type UpdateCustomTypeInput = z.infer<typeof UpdateCustomTypeSchema>;
export type UpdateCustomTypeWithIdInput = z.infer<typeof UpdateCustomTypeWithIdSchema>; 