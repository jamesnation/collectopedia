# Form Validation Improvements

## Current Issues

The current form implementation has several areas that need improvement:

1. **Numeric Input Handling**
   - Empty values can cause type mismatches with zod schema validation
   - Inconsistent handling of `0`, `null`, and `undefined` values
   - Missing proper validation feedback for invalid numeric inputs

2. **Form to Database Type Alignment**
   - Mismatches between form state types and database schema types
   - Inconsistent handling of optional fields 
   - Missing validation for database constraints

3. **User Experience**
   - Limited feedback for validation errors
   - No inline validation during typing
   - Missing field-level help text for complex inputs

## Improvement Plan

### 1. Numeric Input Handling

#### Issues to Fix
- Handling empty string values in numeric inputs
- Proper type conversion before submission
- Consistent zero value handling

#### Solution

Update the numeric input fields to use a consistent pattern:

```typescript
<FormField
  control={form.control}
  name="cost"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Cost</FormLabel>
      <FormControl>
        <Input
          type="number"
          {...field}
          value={field.value === 0 ? '' : field.value}
          onChange={(e) => {
            const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
            field.onChange(isNaN(value) ? 0 : value);
          }}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### 2. Schema Validation Improvements

Update the Zod schema to handle edge cases better:

```typescript
const formSchema = z.object({
  // ...other fields
  cost: z.preprocess(
    // Convert empty string to 0, handle other conversions
    (val) => (val === '' ? 0 : isNaN(Number(val)) ? 0 : Number(val)),
    z.number().min(0).default(0)
  ),
  value: z.preprocess(
    (val) => (val === '' ? 0 : isNaN(Number(val)) ? 0 : Number(val)),
    z.number().min(0).default(0)
  ),
  // ...optional fields with proper handling
  soldPrice: z.preprocess(
    (val) => (val === '' ? null : isNaN(Number(val)) ? null : Number(val)),
    z.number().min(0).nullable().optional()
  ),
});
```

### 3. Form to Database Type Alignment

Create a consistent adapter function to convert between form values and database types:

```typescript
// Form values to database entity
function mapFormToDbEntity(formValues: FormValues, userId: string): DbEntity {
  return {
    // Required fields
    userId,
    name: formValues.name,
    type: formValues.type,
    franchise: formValues.franchise,
    // Optional fields with null handling
    brand: formValues.brand || null,
    year: formValues.year ? parseInt(formValues.year, 10) : null,
    // Numeric fields
    cost: formValues.cost || 0,
    value: formValues.value || 0,
    // Date fields
    acquired: formValues.acquired ? new Date(formValues.acquired) : new Date(),
    // ... other fields
  };
}
```

### 4. User Experience Improvements

Add helpful validation feedback and inline validation:

```typescript
<FormField
  control={form.control}
  name="cost"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Cost</FormLabel>
      <FormControl>
        <Input
          type="number"
          {...field}
          value={field.value === 0 ? '' : field.value}
          onChange={/* improved handler */}
        />
      </FormControl>
      <FormHelperText>Enter the purchase price (0 if unknown)</FormHelperText>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Implementation Steps

1. **Update Zod Schema**
   - Add proper preprocessing for all numeric fields
   - Ensure consistent handling of null/undefined for optional fields
   - Add appropriate validation rules with descriptive error messages

2. **Standardize Input Components**
   - Create reusable numeric input components with consistent handling
   - Ensure consistent display of empty vs. zero values
   - Add helper text for complex inputs

3. **Form-to-Database Adapters**
   - Create or update adapter functions for form submission
   - Ensure all type conversions happen explicitly
   - Add validation before database operations

4. **Testing**
   - Test form submission with various edge cases:
     - Empty numeric fields
     - Invalid numeric inputs
     - Zero values
     - Very large numbers
   - Verify database constraints are respected 