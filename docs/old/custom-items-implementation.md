# Custom Items Implementation Guide

## Overview
The Collectopedia project supports three types of custom items:
1. Custom Types
2. Custom Brands 
3. Custom Manufacturers

Each follows a similar pattern with database schema, queries, server actions, and UI components.

## Database Schema Structure

Each custom item type follows this general schema pattern:

```typescript
// Example from custom-manufacturers-schema.ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const customManufacturersTable = pgTable("custom_manufacturers", {
  id: uuid("id").primaryKey(),
  userId: text("user_id").notNull(),  // Links to the authenticated user
  name: text("name").notNull(),       // The custom item name
  description: text("description"),    // Optional description
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull()
});
```

## Database Queries

Each custom item type has its own queries file with standard CRUD operations:

```typescript
// Example from custom-manufacturers-queries.ts
import { db } from "@/db/db";
import { customManufacturersTable } from "@/db/schema/custom-manufacturers-schema";
import { eq } from "drizzle-orm";

export async function createCustomManufacturer(data: InsertCustomManufacturer) {
  const [manufacturer] = await db
    .insert(customManufacturersTable)
    .values(data)
    .returning();
  return manufacturer;
}

export async function getCustomManufacturers() {
  const manufacturers = await db
    .select()
    .from(customManufacturersTable)
    .orderBy(customManufacturersTable.name);
  return manufacturers;
}

// Update and Delete operations follow similar patterns
```

## Server Actions

Server actions handle authentication and provide a type-safe API for client components:

```typescript
// Example from custom-manufacturers-actions.ts
'use server';

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getCustomManufacturersAction() {
  try {
    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { isSuccess: false, error: "Not authenticated" };
    }

    const manufacturers = await getCustomManufacturers();
    return { isSuccess: true, data: manufacturers };
  } catch (error) {
    console.error("Error getting custom manufacturers:", error);
    return { isSuccess: false, error: "Failed to get custom manufacturers" };
  }
}
```

## UI Components

### Modal Component
Each custom item type has a modal component for creating new items:

```typescript
// Example from custom-manufacturer-modal.tsx
export function CustomManufacturerModal({ onSuccess }: CustomManufacturerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    // Handle form submission
    const result = await createCustomManufacturerAction(formData);
    if (result.isSuccess) {
      // Handle success
      await onSuccess?.();
    }
  };

  return (
    <Dialog>
      <DialogTrigger>
        <Button>Add Custom Manufacturer</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          {/* Form fields */}
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Integration in CatalogPage

The custom items are integrated into the main catalog page in several ways:

1. Initial Data Loading:
```typescript
// From app/my-collection/page.tsx
export default async function CollectionPage() {
  const { userId } = auth();
  
  const [
    manufacturersResult,
    typesResult,
    brandsResult,
    itemsResult
  ] = await Promise.all([
    getCustomManufacturersAction(),
    getCustomTypesAction(),
    getCustomBrandsAction(),
    getItemsByUserIdAction(userId)
  ]);

  return (
    <CatalogPage
      initialManufacturers={manufacturersResult.data || []}
      initialTypes={typesResult.data || []}
      initialBrands={brandsResult.data || []}
      initialItems={itemsResult.data || []}
    />
  );
}
```

2. State Management:
```typescript
// In CatalogPage component
const [customTypes, setCustomTypes] = useState<{ id: string; name: string }[]>(initialTypes);
const [customBrands, setCustomBrands] = useState<{ id: string; name: string }[]>(initialBrands);
const [customManufacturers, setCustomManufacturers] = useState<{ id: string; name: string }[]>(initialManufacturers);
```

3. Loading Functions:
```typescript
const loadCustomManufacturers = async () => {
  if (!userId) return;
  const result = await getCustomManufacturersAction();
  if (result.isSuccess && result.data) {
    setCustomManufacturers(result.data);
  }
};
```

## CSV Import Support

The application supports importing custom items through CSV files:

```typescript
// In CatalogPage component
const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    Papa.parse<CSVItem>(text, {
      header: true,
      complete: async (results) => {
        for (const item of results.data) {
          // Create custom manufacturer if it doesn't exist
          if (item.manufacturer && !customManufacturers.find(cm => cm.name === item.manufacturer)) {
            await createCustomManufacturerAction({
              name: item.manufacturer
            });
            await loadCustomManufacturers();
          }
          // Similar logic for types and brands
        }
      }
    });
  }
};
```

## Best Practices

1. **Error Handling**: All server actions return a consistent response format:
```typescript
type ActionResult<T> = {
  isSuccess: boolean;
  data?: T;
  error?: string;
};
```

2. **Revalidation**: After mutations, use `revalidatePath()` to refresh the data:
```typescript
revalidatePath("/");  // Refresh the entire app
```

3. **Type Safety**: Use TypeScript types generated from the schema:
```typescript
export type InsertCustomManufacturer = typeof customManufacturersTable.$inferInsert;
export type SelectCustomManufacturer = typeof customManufacturersTable.$inferSelect;
```

4. **Authentication**: Always verify user authentication in server actions:
```typescript
const user = await currentUser();
const userId = user?.id;
if (!userId) {
  return { isSuccess: false, error: "Not authenticated" };
}
```

## File Structure

```
├── db/
│   ├── schema/
│   │   ├── custom-types-schema.ts
│   │   ├── custom-brands-schema.ts
│   │   └── custom-manufacturers-schema.ts
│   └── queries/
│       ├── custom-types-queries.ts
│       ├── custom-brands-queries.ts
│       └── custom-manufacturers-queries.ts
├── actions/
│   ├── custom-types-actions.ts
│   ├── custom-brands-actions.ts
│   └── custom-manufacturers-actions.ts
└── components/
    ├── custom-type-modal.tsx
    ├── custom-brand-modal.tsx
    └── custom-manufacturer-modal.tsx
```

## Database Migration

When adding new custom item types, create a migration using:

```bash
npm run db:generate
npm run db:push
```

This documentation should help with implementing similar custom item features in the future or understanding the current implementation. 