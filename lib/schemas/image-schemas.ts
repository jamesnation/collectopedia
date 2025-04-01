import { z } from 'zod';

/**
 * Zod schemas for image actions
 * Created: 2025-04-02
 * 
 * Implements validation for image-related operations to ensure security
 * and data integrity for all image actions in the application.
 */

// Schema for creating a new image
export const CreateImageSchema = z.object({
  itemId: z.string().uuid("Invalid item ID format"),
  userId: z.string().min(1, "User ID is required"),
  url: z.string().url("Image URL must be a valid URL"),
  order: z.number().int().nonnegative("Order must be a non-negative integer").optional(),
});

// Schema for updating image order
export const UpdateImageOrderSchema = z.object({
  imageId: z.string().uuid("Invalid image ID format"),
  newOrder: z.number().int().nonnegative("Order must be a non-negative integer"),
  itemId: z.string().uuid("Invalid item ID format"),
});

// Schema for reordering multiple images
export const ReorderImagesSchema = z.object({
  itemId: z.string().uuid("Invalid item ID format"),
  imageOrders: z.array(
    z.object({
      id: z.string().uuid("Invalid image ID format"),
      order: z.number().int().nonnegative("Order must be a non-negative integer"),
    })
  ).min(1, "At least one image order is required"),
});

// Schema for deleting an image
export const DeleteImageSchema = z.object({
  id: z.string().uuid("Invalid image ID format"),
  itemId: z.string().uuid("Invalid item ID format").optional(),
});

// Create types from the schemas
export type CreateImageInput = z.infer<typeof CreateImageSchema>;
export type UpdateImageOrderInput = z.infer<typeof UpdateImageOrderSchema>;
export type ReorderImagesInput = z.infer<typeof ReorderImagesSchema>;
export type DeleteImageInput = z.infer<typeof DeleteImageSchema>; 