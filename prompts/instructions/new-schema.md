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

8. Migrate the new schema with db:migrate
   - Run `npm run db:migrate` to apply changes to the database

## Requirements

- For revalidatePath just use 'revalidatePath("/")'
- In schemas for userID use 'text("user_id").notNull()', no need to reference another table
- Convert null values to undefined when sending to server actions
- Be explicit about enum types using union types in TypeScript
- Add detailed error logging for debugging
- Use consistent naming across all related files (schema, queries, actions)
- Test CRUD operations after schema changes to ensure data flows correctly