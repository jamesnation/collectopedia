import { z } from 'zod';

/**
 * Zod schema for profile operations
 * Created: 2025-03-31
 * 
 * Schema validates profile data for creation and updates,
 * ensuring required fields are present and data types are correct.
 */

// Schema for creating a new profile
export const CreateProfileSchema = z.object({
  membership: z.enum(["free", "pro"]).default("free"),
  stripeCustomerId: z.string().optional().nullable(),
  stripeSubscriptionId: z.string().optional().nullable(),
});

// Schema for updating an existing profile
export const UpdateProfileSchema = CreateProfileSchema.partial();

// Create types from the schemas
export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>; 