import 'dotenv/config';
import { resolve } from 'path';
import { migrateImageOrder } from "../db/migrations/add-order-to-images";

// Load .env.local explicitly
require('dotenv').config({ path: resolve(process.cwd(), '.env.local') });

// Log the database URL (with sensitive parts masked)
const dbUrl = process.env.DATABASE_URL || '';
console.log('Database URL configured:', dbUrl ? 
  dbUrl.replace(/(:\/\/)([^:]+)(:[^@]+)(@)/g, '$1$2:***$4') : 
  'Not found');

async function main() {
  console.log("Starting image order migration script...");
  
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set in environment variables!");
    console.log("Please make sure your .env.local file contains DATABASE_URL");
    process.exit(1);
  }
  
  try {
    const success = await migrateImageOrder();
    
    if (success) {
      console.log("✅ Migration completed successfully!");
    } else {
      console.error("❌ Migration failed!");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error during migration:", error);
    process.exit(1);
  }
}

main(); 