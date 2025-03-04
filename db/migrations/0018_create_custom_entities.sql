-- Create custom_types table
CREATE TABLE IF NOT EXISTS custom_types (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create custom_franchises table
CREATE TABLE IF NOT EXISTS custom_franchises (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create custom_brands table
CREATE TABLE IF NOT EXISTS custom_brands (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE custom_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_brands ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own custom types"
  ON custom_types FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom types"
  ON custom_types FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom types"
  ON custom_types FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom types"
  ON custom_types FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own custom franchises"
  ON custom_franchises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom franchises"
  ON custom_franchises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom franchises"
  ON custom_franchises FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom franchises"
  ON custom_franchises FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own custom brands"
  ON custom_brands FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom brands"
  ON custom_brands FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom brands"
  ON custom_brands FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom brands"
  ON custom_brands FOR DELETE
  USING (auth.uid() = user_id); 