import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { profilesTable } from "./schema";
import { itemsTable, soldItemsTable } from "@/db/schema";

config({ path: ".env.local" });

const schema = {
  profiles: profilesTable,
  items: itemsTable,
  soldItems: soldItemsTable
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(connectionString);

export const db = drizzle(client, { schema });
