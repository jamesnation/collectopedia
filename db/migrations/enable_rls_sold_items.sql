-- Enable RLS
ALTER TABLE sold_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own sold items"
ON sold_items
FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own sold items"
ON sold_items
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own sold items"
ON sold_items
FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own sold items"
ON sold_items
FOR DELETE
USING (auth.uid()::text = user_id); 