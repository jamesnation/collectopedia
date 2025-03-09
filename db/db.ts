import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { profilesTable } from "./schema/profiles-schema";
import { itemsTable } from "./schema/items-schema";
import { soldItemsTable } from "./schema/sold-items-schema";
import { imagesTable } from "./schema/images-schema";
import { customTypesTable } from "./schema/custom-types-schema";
import { customFranchisesTable } from "./schema/custom-franchises-schema";
import { customBrandsTable } from "./schema/custom-brands-schema";
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Log confirmation but hide sensitive details
const maskedUrl = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL.replace(/(:\/\/)([^:]+)(:[^@]+)(@)/g, '$1$2:***$4')
  : 'Not found';

console.log(`DB Connection: ${maskedUrl}`);

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
    customTypes: customTypesTable,
    customFranchises: customFranchisesTable,
    customBrands: customBrandsTable,
  },
});
