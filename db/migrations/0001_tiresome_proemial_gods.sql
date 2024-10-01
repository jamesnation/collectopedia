DO $$ BEGIN
 CREATE TYPE "public"."item_type" AS ENUM('Doll', 'Building Set', 'Trading Card', 'Die-cast Car', 'Action Figure');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "items" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "item_type" NOT NULL,
	"acquired" timestamp NOT NULL,
	"cost" integer NOT NULL,
	"value" integer NOT NULL,
	"ebay_sold" integer,
	"ebay_listed" integer,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
