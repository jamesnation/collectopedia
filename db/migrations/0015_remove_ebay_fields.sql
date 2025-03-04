-- Remove eBay fields from items table
ALTER TABLE items
DROP COLUMN ebay_sold,
DROP COLUMN ebay_listed; 