import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local if exists
dotenv.config({ path: '.env.local' });

export default {
  schema: './schema/*',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/collectopedia',
  },
} satisfies Config; 