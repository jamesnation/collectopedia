import { z } from 'zod';

/**
 * Zod schema for custom brand operations
 * Created: 2025-03-31
 * 
 * Schema validates custom brand data for creation and updates,
 * ensuring required fields are present and data types are correct.
 */

// Schema for creating a new custom brand
export const CreateCustomBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(50, "Brand name too long"),
  description: z.string().max(255, "Description too long").optional().nullable(),
});

// Schema for updating an existing custom brand
export const UpdateCustomBrandSchema = CreateCustomBrandSchema.partial();

// Schema for updating a custom brand with ID
export const UpdateCustomBrandWithIdSchema = z.object({
  id: z.string().uuid("Invalid brand ID format"),
  name: z.string().min(1, "Brand name is required").max(50, "Brand name too long").optional(),
  description: z.string().max(255, "Description too long").optional().nullable(),
});

// Create types from the schemas
export type CreateCustomBrandInput = z.infer<typeof CreateCustomBrandSchema>;
export type UpdateCustomBrandInput = z.infer<typeof UpdateCustomBrandSchema>;
export type UpdateCustomBrandWithIdInput = z.infer<typeof UpdateCustomBrandWithIdSchema>; 