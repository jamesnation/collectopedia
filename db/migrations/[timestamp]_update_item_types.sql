ALTER TYPE "item_type" ADD VALUE 'Vintage - MISB';
ALTER TYPE "item_type" ADD VALUE 'Vintage - opened';
ALTER TYPE "item_type" ADD VALUE 'New - MISB';
ALTER TYPE "item_type" ADD VALUE 'New - opened';
ALTER TYPE "item_type" ADD VALUE 'New - KO';
ALTER TYPE "item_type" ADD VALUE 'Cel';
ALTER TYPE "item_type" ADD VALUE 'Other';

-- You may need to add a data migration here to update existing records
-- For example:
-- UPDATE items SET type = 'Other' WHERE type NOT IN ('Vintage - MISB', 'Vintage - opened', 'New - MISB', 'New - opened', 'New - KO', 'Cel', 'Other');