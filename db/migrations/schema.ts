import { pgTable, pgEnum, uuid, text, timestamp, integer, foreignKey, boolean } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"

export const keyStatus = pgEnum("key_status", ['default', 'valid', 'invalid', 'expired'])
export const keyType = pgEnum("key_type", ['aead-ietf', 'aead-det', 'hmacsha512', 'hmacsha256', 'auth', 'shorthash', 'generichash', 'kdf', 'secretbox', 'secretstream', 'stream_xchacha20'])
export const aalLevel = pgEnum("aal_level", ['aal1', 'aal2', 'aal3'])
export const codeChallengeMethod = pgEnum("code_challenge_method", ['s256', 'plain'])
export const factorStatus = pgEnum("factor_status", ['unverified', 'verified'])
export const factorType = pgEnum("factor_type", ['totp', 'webauthn', 'phone'])
export const oneTimeTokenType = pgEnum("one_time_token_type", ['confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token'])
export const brand = pgEnum("brand", ['Transformers', 'TMNT', 'M.A.S.K', 'Visionaries', 'WWF', 'Warhammer', 'Monsters in My Pocket', 'Senate', 'Skating (other)', 'Other', 'Unknown'])
export const condition = pgEnum("condition", ['New', 'Used - complete', 'Used - item only', 'Used'])
export const confidence = pgEnum("confidence", ['High', 'Medium', 'Low'])
export const franchise = pgEnum("franchise", ['Transformers', 'TMNT', 'M.A.S.K', 'Visionaries', 'WWF', 'Warhammer', 'Monsters in My Pocket', 'Senate', 'Skating (other)', 'Other', 'Unknown', 'Masters of the Universe', 'Teenage Mutant Ninja Turtles', 'Monster in My Pocket', 'Boglins', 'WWE', 'CDS Detroit', 'Medium', 'Hyper'])
export const itemBrand = pgEnum("item_brand", ['Transformers', 'TMNT', 'M.A.S.K', 'Visionaries', 'WWF', 'Warhammer', 'Monsters in My Pocket', 'Senate', 'Skating (other)', 'Other', 'Unknown'])
export const itemType = pgEnum("item_type", ['Doll', 'Building Set', 'Trading Card', 'Die-cast Car', 'Action Figure', 'Vintage - MISB', 'Vintage - opened', 'New - MISB', 'New - opened', 'New - KO', 'Cel', 'Other', 'Action Figures', 'Books', 'Comics', 'Funko Pops', 'Movie, TV Show Memorabilia', 'Music Memorabilia', 'Toys', 'Video Games and Consoles', 'Wargaming'])
export const membership = pgEnum("membership", ['free', 'pro'])
export const action = pgEnum("action", ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'ERROR'])
export const equalityOp = pgEnum("equality_op", ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in'])


export const customBrands = pgTable("custom_brands", {
	id: uuid("id").primaryKey().notNull(),
	userId: text("user_id").notNull(),
	name: text("name").notNull(),
	description: text("description"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const customTypes = pgTable("custom_types", {
	id: text("id").primaryKey().notNull(),
	userId: text("user_id").notNull(),
	name: text("name").notNull(),
	description: text("description"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const ebayHistory = pgTable("ebay_history", {
	id: text("id").primaryKey().notNull(),
	userId: text("user_id").notNull(),
	totalValue: integer("total_value").notNull(),
	recordedAt: timestamp("recorded_at", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
	userId: text("user_id").primaryKey().notNull(),
	membership: membership("membership").default('free').notNull(),
	stripeCustomerId: text("stripe_customer_id"),
	stripeSubscriptionId: text("stripe_subscription_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const soldItems = pgTable("sold_items", {
	id: text("id").primaryKey().notNull(),
	itemId: text("item_id").notNull(),
	userId: text("user_id").notNull(),
	soldPrice: integer("sold_price").notNull(),
	soldDate: timestamp("sold_date", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const images = pgTable("images", {
	id: text("id").primaryKey().notNull(),
	itemId: text("item_id").notNull().references(() => items.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull(),
	url: text("url").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	order: integer("order").default(0).notNull(),
	version: text("version").default("0"),
});

export const customFranchises = pgTable("custom_franchises", {
	id: text("id").primaryKey().notNull(),
	userId: text("user_id").notNull(),
	name: text("name").notNull(),
	description: text("description"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const items = pgTable("items", {
	id: text("id").primaryKey().notNull(),
	userId: text("user_id").notNull(),
	name: text("name").notNull(),
	type: text("type").notNull(),
	acquired: timestamp("acquired", { mode: 'string' }).notNull(),
	cost: integer("cost").notNull(),
	value: integer("value").notNull(),
	ebaySold: integer("ebay_sold"),
	ebayListed: integer("ebay_listed"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	image: text("image"),
	franchise: text("franchise").notNull(),
	notes: text("notes"),
	isSold: boolean("is_sold").default(false).notNull(),
	soldPrice: integer("sold_price"),
	soldDate: timestamp("sold_date", { mode: 'string' }),
	year: integer("year"),
	condition: condition("condition").default('Used').notNull(),
	brand: text("brand"),
	ebayLastUpdated: timestamp("ebay_last_updated", { mode: 'string' }),
	imagesUpdatedAt: timestamp("images_updated_at", { mode: 'string' }),
});