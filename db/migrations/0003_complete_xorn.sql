DO $$ BEGIN
 CREATE TYPE "public"."brand" AS ENUM('Transformers', 'TMNT', 'M.A.S.K', 'Visionaries', 'WWF', 'Warhammer', 'Monsters in My Pocket', 'Senate', 'Skating (other)', 'Other', 'Unknown');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "brand" "brand" NOT NULL;