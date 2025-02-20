-- Enable RLS
ALTER TABLE custom_manufacturers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own custom manufacturers"
ON custom_manufacturers
FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own custom manufacturers"
ON custom_manufacturers
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own custom manufacturers"
ON custom_manufacturers
FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own custom manufacturers"
ON custom_manufacturers
FOR DELETE
USING (auth.uid()::text = user_id); 