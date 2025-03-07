-- Update the franchise enum to include new values
DO $$ BEGIN
    -- Create a new enum with the updated values
    CREATE TYPE "public"."franchise_new" AS ENUM(
        'Transformers',
        'Masters of the Universe',
        'Teenage Mutant Ninja Turtles',
        'Monster in My Pocket',
        'Visionaries',
        'Boglins',
        'M.A.S.K',
        'WWF',
        'WWE',
        'Warhammer',
        'Senate',
        'CDS Detroit',
        'Medium',
        'Hyper',
        'Other',
        'Unknown'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop the old franchise enum and rename the new one
-- Note: This requires a table alteration or recreation that should be handled carefully
-- This is a simplification and may require additional steps in production
ALTER TYPE "public"."franchise" RENAME TO "franchise_old";
ALTER TYPE "public"."franchise_new" RENAME TO "franchise";

-- Don't forget to run database alterations for any columns using this enum
-- Example (assuming items table has a franchise column):
-- ALTER TABLE "items" ALTER COLUMN "franchise" TYPE "franchise" USING "franchise"::text::"franchise"; 