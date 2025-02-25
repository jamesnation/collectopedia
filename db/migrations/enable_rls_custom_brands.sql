ALTER TABLE custom_brands ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to view only their own custom brands
CREATE POLICY "Users can view their own custom brands"
ON custom_brands
FOR SELECT
USING (user_id = auth.uid()::text);

-- Create a policy that allows users to insert their own custom brands
CREATE POLICY "Users can insert their own custom brands"
ON custom_brands
FOR INSERT
WITH CHECK (user_id = auth.uid()::text);

-- Create a policy that allows users to update their own custom brands
CREATE POLICY "Users can update their own custom brands"
ON custom_brands
FOR UPDATE
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- Create a policy that allows users to delete their own custom brands
CREATE POLICY "Users can delete their own custom brands"
ON custom_brands
FOR DELETE
USING (user_id = auth.uid()::text); 