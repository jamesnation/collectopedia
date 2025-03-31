import { z } from 'zod';

/**
 * Zod schema for creating a new item
 * Created: 2025-03-31
 * 
 * Schema validates input for new item creation,
 * ensuring required fields are present and data types are correct.
 */

// Schema for creating a new item
export const CreateItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  type: z.string().min(1, "Type is required").max(50),
  franchise: z.string().min(1, "Franchise is required").max(50),
  brand: z.string().max(50).optional().nullable(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
  condition: z.enum(["New", "Used"]).default("Used"),
  acquired: z.coerce.date({
    required_error: "Acquired date is required",
    invalid_type_error: "Acquired date must be a valid date"
  }),
  cost: z.number().nonnegative("Cost cannot be negative").default(0),
  value: z.number().nonnegative("Value cannot be negative").default(0),
  notes: z.string().max(1000, "Notes too long").optional().default(""),
  isSold: z.boolean().optional().default(false),
  soldDate: z.coerce.date().optional().nullable(),
  soldPrice: z.number().nonnegative().optional().nullable(),
  ebayListed: z.number().nonnegative().optional().nullable(),
  ebaySold: z.number().nonnegative().optional().nullable(),
  image: z.string().url("Image must be a valid URL").optional().nullable(),
  images: z.array(z.string().url("Image must be a valid URL")).optional(),
});

// Schema for updating an existing item
export const UpdateItemSchema = CreateItemSchema.partial();

// Create types from the schemas
export type CreateItemInput = z.infer<typeof CreateItemSchema>;
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>; 