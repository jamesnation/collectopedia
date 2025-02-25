const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function executeSqlFile(filePath) {
  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  // Read the SQL file
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // Connect to the database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Execute the SQL
    console.log(`Executing SQL from ${filePath}...`);
    await pool.query(sql);
    console.log('SQL executed successfully');
  } catch (error) {
    console.error('Error executing SQL:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get the file path from command line arguments
const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide a file path as an argument');
  process.exit(1);
}

// Execute the SQL file
executeSqlFile(path.resolve(filePath)); 