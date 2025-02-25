# New Schema Instructions
Use this guide for creating a new schema in the project.

Write the complete code for every step. Do not get lazy. Write everything that is needed.

Your goal is to completely finish whatever the user asks for.

# Steps

1. Create a new schema file in /db/schema like example-schema.ts
   - Define table structure with proper column types
   - Create enums if needed using pgEnum
   - Define Zod schemas for validation
   - Export TypeScript types using $inferSelect and $inferInsert

2. Export any new schemas in /db/schema/index.ts like 'export * from "./example-schema"'

3. Add the new schema to the db in /db/db.ts
   - Import the new table
   - Add it to the schema object in the drizzle configuration

4. Create a schema adapter in /components/[feature]/utils/schema-adapter.ts (optional but recommended)
   - Define interface for the component-side representation
   - Create mapping functions between schema and component types
   - Handle null/undefined conversions properly

5. Add the queries for the new schema in /db/queries like example-queries.ts
   - Implement CRUD operations (get, getById, insert, update, delete)
   - Use proper type annotations for parameters and return values
   - Handle relationships with other tables if needed

6. Add the actions for the new schema in /actions like example-actions.ts
   - Create server actions that wrap the database queries
   - Use consistent ActionResult type for all returns
   - Include proper error handling and logging
   - Use revalidatePath to refresh data after mutations

7. Generate the new schema with db:generate
   - Run `npm run db:generate` to create migration files

8. Apply the schema changes to the database
   - Run `npm run db:push` to apply changes directly to the database
   - For more complex migrations, create custom SQL files in /db/migrations

9. Update UI components to use the new schema
   - Create management components in /components like custom-entity-list.tsx
   - Add the components to appropriate pages like settings/page.tsx
   - Ensure all forms and filters use the new schema properly

10. Clean up and validate
    - Remove any obsolete files related to old schemas
    - Update all imports to reference the new schema files
    - Test all CRUD operations to ensure they work with the new schema

## Requirements

- For revalidatePath just use 'revalidatePath("/")'
- In schemas for userID use 'text("user_id").notNull()', no need to reference another table
- Convert null values to undefined when sending to server actions
- Be explicit about enum types using union types in TypeScript
- Add detailed error logging for debugging
- Use consistent naming across all related files (schema, queries, actions)
- Test CRUD operations after schema changes to ensure data flows correctly

## Schema Renaming Guidelines

If you're renaming an existing schema (e.g., changing from "manufacturer" to "brand"):

1. Create all new files first (schema, queries, actions) with the new naming
2. Create a custom SQL migration file for renaming tables and updating RLS policies:
   ```sql
   -- Rename the table
   ALTER TABLE "old_table_name" RENAME TO "new_table_name";
   
   -- Update existing RLS policies
   ALTER POLICY "Policy on old table" ON "new_table_name" 
   RENAME TO "Policy on new table";
   ```
3. Create custom SQL file for RLS on the new table if needed
4. Update all references in UI components and page files
5. Ensure data integrity by verifying that existing data is accessible through the new schema
6. Only delete the old files after confirming that the migration was successful

## Row Level Security (RLS)

For tables that need row-level security:

1. Create an SQL file in /db/migrations like enable_rls_table_name.sql
2. Include the following SQL commands:
   ```sql
   ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
   
   -- Create policies for different operations
   CREATE POLICY "Users can view their own data"
   ON table_name
   FOR SELECT
   USING (user_id = auth.uid()::text);
   
   -- Repeat for INSERT, UPDATE, DELETE operations
   ```
3. Execute the SQL file using a database client or custom script
4. Verify that RLS is working properly by testing with different user accounts