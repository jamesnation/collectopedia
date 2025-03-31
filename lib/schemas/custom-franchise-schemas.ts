import { z } from 'zod';

/**
 * Zod schema for custom franchise operations
 * Created: 2025-03-31
 * 
 * Schema validates custom franchise data for creation and updates,
 * ensuring required fields are present and data types are correct.
 */

// Schema for creating a new custom franchise
export const CreateCustomFranchiseSchema = z.object({
  name: z.string().min(1, "Franchise name is required").max(50, "Franchise name too long"),
  description: z.string().max(255, "Description too long").optional().nullable(),
});

// Schema for updating an existing custom franchise
export const UpdateCustomFranchiseSchema = CreateCustomFranchiseSchema.partial();

// Schema for updating a custom franchise with ID
export const UpdateCustomFranchiseWithIdSchema = z.object({
  id: z.string().uuid("Invalid franchise ID format"),
  name: z.string().min(1, "Franchise name is required").max(50, "Franchise name too long").optional(),
  description: z.string().max(255, "Description too long").optional().nullable(),
});

// Create types from the schemas
export type CreateCustomFranchiseInput = z.infer<typeof CreateCustomFranchiseSchema>;
export type UpdateCustomFranchiseInput = z.infer<typeof UpdateCustomFranchiseSchema>;
export type UpdateCustomFranchiseWithIdInput = z.infer<typeof UpdateCustomFranchiseWithIdSchema>; 