import { z } from 'zod';

/**
 * Zod schema for eBay API query validation
 * Created: 2025-03-31
 * Updated: 2025-04-03 - Added EbayImageSearchBodySchema with base64 validation
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

// Schema for validating eBay image search request body
export const EbayImageSearchBodySchema = z.object({
  imageBase64: z.string({
    required_error: "Image data is required",
    invalid_type_error: "Image data must be a string"
  }).min(100, "Image data is too short to be valid").refine(
    (val) => {
      // Check for base64 pattern (starts with data: or is a valid base64 string)
      try {
        // Simple validation for common base64 image formats
        if (val.startsWith('data:image/')) {
          return true;
        }
        
        // Check if it's a raw base64 string (should consist of valid base64 chars)
        const base64Regex = /^[A-Za-z0-9+/=]+$/;
        return base64Regex.test(val);
      } catch {
        return false;
      }
    },
    { message: "Invalid base64 image data" }
  ),
  title: z.string({
    required_error: "Title is required",
    invalid_type_error: "Title must be a string"
  }).min(1, "Title cannot be empty").max(200, "Title is too long"),
  condition: z.enum(["new", "used", "New", "Used"], {
    invalid_type_error: "Condition must be 'new' or 'used'"
  }).optional().default("new"),
  debug: z.boolean().optional().default(false)
});

// Create types from the schemas
export type EbayApiQueryParams = z.infer<typeof EbayApiQuerySchema>;
export type UpdateEbayPricesInput = z.infer<typeof UpdateEbayPricesSchema>;
export type EbayImageSearchBody = z.infer<typeof EbayImageSearchBodySchema>; 