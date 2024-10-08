import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { profilesTable } from "./schema/profiles-schema";
import { itemsTable } from "./schema/items-schema";
import { soldItemsTable } from "./schema/sold-items-schema";
import { imagesTable } from "./schema/images-schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(connectionString);
export const db = drizzle(client, {
  schema: {
    profiles: profilesTable,
    items: itemsTable,
    soldItems: soldItemsTable,
    images: imagesTable,
  },
});
