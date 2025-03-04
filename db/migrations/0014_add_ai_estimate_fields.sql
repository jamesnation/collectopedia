-- Create confidence enum type
CREATE TYPE confidence AS ENUM ('High', 'Medium', 'Low');

-- Add new columns to items table
ALTER TABLE items
ADD COLUMN ai_estimate_low integer,
ADD COLUMN ai_estimate_medium integer,
ADD COLUMN ai_estimate_high integer,
ADD COLUMN ai_confidence confidence,
ADD COLUMN ai_last_updated timestamp; 