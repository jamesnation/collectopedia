# State Management Architecture

## Current State Management

The Collectopedia application currently uses two main approaches for state management:

1. **React Context** - Used for UI state, filters, and view preferences
2. **React Query** - Used for server data fetching, mutations, and caching

As we transition from Context-based data fetching to React Query, it's important to establish clear boundaries of responsibility.

## State Management Responsibilities

### React Query Responsibilities

React Query should handle:

1. **Server Data Fetching**
   - Catalog items data
   - Image data
   - Custom entity data (types, franchises, brands)
   - User data

2. **Data Mutations**
   - Creating new items
   - Updating existing items
   - Deleting items
   - Managing related entities

3. **Caching**
   - Optimistic updates
   - Background refetching
   - Cache invalidation
   - Stale-while-revalidate patterns

### React Context Responsibilities

Context should handle:

1. **UI State**
   - Current view mode (grid vs list)
   - Currently selected filters
   - Sort preferences
   - Pagination state
   - Modal open/closed states

2. **User Preferences**
   - Theme preferences
   - Display options
   - Recently viewed items
   - Default filters

3. **Cross-Component Communication**
   - Filter changes affecting multiple components
   - View mode changes
   - Search query propagation

## Architectural Patterns

### Pattern 1: Query-Backed Context

For some features, we use a pattern where React Query provides the data, but Context makes it available throughout the component tree:

```tsx
function CatalogProvider({ children }) {
  // Use React Query to fetch data
  const { data, isLoading } = useCatalogItemsQuery(queryParams);
  
  // Provide data through context
  return (
    <CatalogContext.Provider value={{ 
      items: data?.items || [],
      isLoading,
      // UI state managed by context
      filters: filtersState,
      setFilters, 
      viewMode,
      setViewMode
    }}>
      {children}
    </CatalogContext.Provider>
  );
}
```

### Pattern 2: Direct Query Consumption

For simpler cases or leaf components, components can consume React Query directly:

```tsx
function AddItemButton() {
  const { mutate, isLoading } = useAddItemMutation();
  
  return (
    <Button 
      onClick={() => mutate(newItem)}
      disabled={isLoading}
    >
      Add Item
    </Button>
  );
}
```

### Pattern 3: Hybrid Approach for Forms

For forms that need both UI state and data mutations:

```tsx
function EditItemForm({ itemId }) {
  // Use React Query for data fetching
  const { data: item } = useItemQuery(itemId);
  const { mutate } = useUpdateItemMutation();
  
  // Use local form state for UI
  const [formState, setFormState] = useState(item || {});
  
  const handleSubmit = () => {
    mutate({ id: itemId, updates: formState });
  };
  
  return (/* Form JSX */);
}
```

## Implementation Steps for Phase 2+ Completion

1. **Data Fetching Migration**
   - ✅ Create React Query hooks for all data operations
   - ✅ Replace direct API calls with React Query mutations
   - ❌ Update context to use React Query hooks for data

2. **Context Simplification**
   - ❌ Remove data fetching logic from context
   - ❌ Focus context on UI state management
   - ❌ Simplify context value to essential UI state

3. **Query Client Configuration**
   - ✅ Optimize `staleTime` based on data type
   - ✅ Configure proper cache behavior
   - ✅ Set up default error handling

4. **Component Updates**
   - ✅ Update AddItemModal to use mutations directly
   - ❌ Refactor other components to use the correct pattern
   - ❌ Ensure proper loading/error states throughout the app

## Next Steps

Before moving to Phase 3, we should:

1. Complete the Context simplification process
2. Ensure clear boundaries between React Query and Context
3. Update all component documentation to reflect the new patterns
4. Add integration tests for the new data flow 