# TypeScript Standards for Collectopedia

## Export and Import Guidelines

To ensure consistency throughout the codebase and avoid TypeScript module resolution issues, we'll follow these standards:

### Export Standards

1. **Barrel Exports**
   - Each component directory should have an `index.ts` file that re-exports its contents
   - Use named exports consistently throughout the codebase
   - Avoid mixing default and named exports within the same module

   ```typescript
   // Good - Consistent named exports in index.ts
   export { ItemCard } from './item-card';
   export { ItemImage } from './item-image';
   ```

2. **Component Exports**
   - Prefer named exports for components:
   
   ```typescript
   // Good
   export function ItemCard() { ... }
   
   // Avoid
   export default function ItemCard() { ... }
   ```

3. **Type Exports**
   - Always use named exports for types, interfaces, and constants
   - Include types in barrel exports for convenience

### Import Standards

1. **Internal Imports**
   - Use barrel imports when possible:
   
   ```typescript
   // Good - Using barrel import
   import { ItemCard, ItemImage } from '../item-card';
   
   // Avoid if possible - Direct import
   import { ItemCard } from '../item-card/item-card';
   ```

2. **External Imports**
   - Group imports in a consistent order:
     1. React and framework imports
     2. External library imports
     3. Internal app imports
     4. Type imports

   ```typescript
   // Good import organization
   import React, { useState } from 'react';
   
   import { useQuery } from '@tanstack/react-query';
   import { useAuth } from '@clerk/nextjs';
   
   import { ItemCard } from '../item-card';
   import { formatCurrency } from '../../utils';
   
   import type { CatalogItem } from '../../types';
   ```

## Module Resolution Configuration

1. **tsconfig.json**
   - Use `"moduleResolution": "node-next"` to ensure proper resolution
   - Maintain clean path aliases for improved imports

2. **Resolving Circular Dependencies**
   - Avoid circular dependencies by restructuring components
   - Use interface-only imports for circular type references

## Implementation Strategy

To fix existing module resolution issues:

1. Standardize all exports in component files to use named exports
2. Update barrel files to use consistent re-export patterns
3. Fix import statements throughout the codebase to use barrel imports
4. Review circular dependencies and restructure as needed

## How to Fix a Component

Example: Converting a component from default to named export:

**Before**:
```typescript
// item-card.tsx
export default function ItemCard() { ... }

// index.ts
export { default as ItemCard } from './item-card';
```

**After**:
```typescript
// item-card.tsx
export function ItemCard() { ... }

// index.ts
export { ItemCard } from './item-card';
```

Update imports:
```typescript
// Before
import ItemCard from '../item-card/item-card';
// or
import { ItemCard } from '../item-card';

// After - always use this approach
import { ItemCard } from '../item-card';
``` 