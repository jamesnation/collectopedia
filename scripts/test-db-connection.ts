import 'dotenv/config';
import { resolve } from 'path';
import { config } from 'dotenv';
import postgres from "postgres";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function testConnection() {
  console.log("Testing database connection...");
  
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error("❌ DATABASE_URL is not set in environment variables!");
    console.log("Current environment variables:", process.env);
    process.exit(1);
  }
  
  // Mask the connection string for logging
  const maskedUrl = connectionString.replace(/(:\/\/)([^:]+)(:[^@]+)(@)/g, '$1$2:***$4');
  console.log(`Attempting to connect to: ${maskedUrl}`);
  
  try {
    const sql = postgres(connectionString);
    
    // Test the connection with a simple query
    const result = await sql`SELECT 1 as test`;
    console.log("✅ Connection successful!");
    console.log("Query result:", result);
    
    // Clean up
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Connection failed:", error);
    process.exit(1);
  }
}

testConnection(); 