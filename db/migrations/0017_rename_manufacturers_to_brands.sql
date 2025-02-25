-- Rename the custom_manufacturers table to custom_brands
ALTER TABLE "custom_manufacturers" RENAME TO "custom_brands";

-- Update existing RLS policies for the renamed table
ALTER POLICY "Users can view their own custom manufacturers" ON "custom_brands" RENAME TO "Users can view their own custom brands";
ALTER POLICY "Users can insert their own custom manufacturers" ON "custom_brands" RENAME TO "Users can insert their own custom brands";
ALTER POLICY "Users can update their own custom manufacturers" ON "custom_brands" RENAME TO "Users can update their own custom brands";
ALTER POLICY "Users can delete their own custom manufacturers" ON "custom_brands" RENAME TO "Users can delete their own custom brands"; 