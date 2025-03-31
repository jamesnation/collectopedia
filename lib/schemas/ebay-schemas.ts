import { z } from 'zod';

/**
 * Zod schema for eBay API query validation
 * Created: 2025-03-31
 * 
 * Schema validates query parameters for eBay API calls,
 * ensuring required fields are present and data types are correct.
 */

// Schema for eBay API route query parameters
export const EbayApiQuerySchema = z.object({
  toyName: z.string().min(1, "Toy name is required").max(200, "Toy name too long"),
  listingType: z.enum(["listed", "sold"], {
    required_error: "Listing type is required",
    invalid_type_error: "Listing type must be 'listed' or 'sold'"
  }),
  condition: z.enum(["New", "Used"]).optional(),
  region: z.string().max(10, "Region code too long").optional(),
  includeItems: z.coerce.boolean().optional(),
});

// Schema for updating eBay prices on an item
export const UpdateEbayPricesSchema = z.object({
  id: z.string().uuid("Invalid item ID format"),
  name: z.string().min(1, "Item name is required"),
  type: z.enum(["listed", "sold"], {
    required_error: "Type is required",
    invalid_type_error: "Type must be 'listed' or 'sold'"
  }),
  condition: z.enum(["New", "Used"]).optional(),
  region: z.string().max(10, "Region code too long").optional(),
});

// Create types from the schemas
export type EbayApiQueryParams = z.infer<typeof EbayApiQuerySchema>;
export type UpdateEbayPricesInput = z.infer<typeof UpdateEbayPricesSchema>; 