DO $$ BEGIN
 CREATE TYPE "membership" AS ENUM('free', 'pro', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "condition" AS ENUM('New', 'Used');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "franchise" AS ENUM('Transformers', 'Masters of the Universe', 'Teenage Mutant Ninja Turtles', 'Monster in My Pocket', 'Visionaries', 'Boglins', 'M.A.S.K', 'WWF', 'WWE', 'Warhammer', 'Senate', 'CDS Detroit', 'Medium', 'Hyper', 'Other', 'Unknown');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "item_type" AS ENUM('Action Figures', 'Books', 'Comics', 'Funko Pops', 'Movie, TV Show Memorabilia', 'Music Memorabilia', 'Toys', 'Video Games and Consoles', 'Wargaming', 'Other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "attribute_type" AS ENUM('brand', 'franchise', 'type');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"membership" "membership" DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "items" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"franchise" text NOT NULL,
	"brand" text,
	"year" integer,
	"condition" "condition" DEFAULT 'Used' NOT NULL,
	"acquired" timestamp NOT NULL,
	"cost" integer NOT NULL,
	"value" integer NOT NULL,
	"ebay_sold" integer,
	"ebay_listed" integer,
	"ebay_last_updated" timestamp,
	"image" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"images_updated_at" timestamp,
	"is_sold" boolean DEFAULT false NOT NULL,
	"sold_price" integer,
	"sold_date" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sold_items" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"user_id" text NOT NULL,
	"sold_price" integer NOT NULL,
	"sold_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "images" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"user_id" text NOT NULL,
	"url" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"version" text DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_attributes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"attribute_type" "attribute_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ebay_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"total_value" integer NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "images" ADD CONSTRAINT "images_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
