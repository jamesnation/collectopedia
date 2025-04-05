# Collectopedia Refactoring Implementation Plan

This plan outlines the steps to refactor the Collectopedia application based on the analysis performed, focusing on improving code consistency, structure, and potentially performance.

**Phase 2: Implementation (Applying Changes)**

**Part A: Consolidate Custom Attributes (High Impact)**

*   **Goal:** Reduce redundancy by merging `custom_brands`, `custom_franchises`, and `custom_types` into a single `custom_attributes` structure.
*   **Step A1: Update Database Schema**
    *   **Action:** Define a new table `customAttributesTable` in a new file `db/schema/custom-attributes-schema.ts`.
        *   Columns: `id` (text/uuid - be consistent), `userId`, `name`, `description` (optional), `attribute_type` (text enum: 'brand', 'franchise', 'type'), `createdAt`, `updatedAt`.
    *   **Action:** Remove old schema files: `custom-brands-schema.ts`, `custom-franchises-schema.ts`, `custom-types-schema.ts`.
    *   **Action:** Update `db/schema/index.ts` to export `customAttributesTable` and remove old exports.
    *   **Consideration:** Generate and apply database migrations. Plan for data migration from old tables to the new one.
*   **Step A2: Create Generic Database Queries**
    *   **Action:** Create `db/queries/custom-attributes-queries.ts`.
    *   **Action:** Implement generic query functions:
        *   `getCustomAttributes(userId: string, type: 'brand' | 'franchise' | 'type')`
        *   `getCustomAttributeById(id: string)`
        *   `createCustomAttribute(data: { ... , attribute_type: string })`
        *   `updateCustomAttribute(id: string, data: { ... })`
        *   `deleteCustomAttribute(id: string)`
        *   *(Ensure queries use `customAttributesTable` and `attribute_type` column)*.
    *   **Action:** Delete old query files: `custom-brands-queries.ts`, `custom-franchises-queries.ts`, `custom-types-queries.ts`.
*   **Step A3: Create Generic Actions**
    *   **Action:** Create `actions/custom-attribute-actions.ts`.
    *   **Action:** Implement generic server actions using new queries:
        *   `getCustomAttributesAction(type: 'brand' | 'franchise' | 'type')`
        *   `createCustomAttributeAction(formData: FormData)`
        *   `updateCustomAttributeAction(formData: FormData)`
        *   `deleteCustomAttributeAction(formData: FormData)`
        *   *(Ensure validation, auth checks, ownership checks, `revalidatePath`)*.
    *   **Action:** Delete old action files: `custom-brands-actions.ts`, `custom-franchises-actions.ts`, `custom-types-actions.ts`.
*   **Step A4: Update Components**
    *   **Action:** Refactor `components/settings/*-list.tsx` and modals into a single reusable component (e.g., `custom-attribute-list.tsx`) accepting `attribute_type` prop.
    *   **Action:** Update Settings page (`app/settings/page.tsx`) to use the new component multiple times with different `attribute_type` props.
    *   **Action:** Update `AddItemModal` and other item forms to use new generic actions/queries for dropdowns.
*   **Testing (Post Part A):** Test CRUD for brands, franchises, types via Settings. Verify dropdowns in item forms. Check database migration.

**Part B: Refactor eBay Actions (Medium Impact)**

*   **Goal:** Improve clarity and separation of concerns in eBay-related logic.
*   **Step B1: Create Fetch Actions File**
    *   **Action:** Create `actions/ebay-fetch-actions.ts`.
    *   **Action:** Move fetching functions (`fetchEbayPrices`, `searchEbayByImage`, `getEnhancedEbayPrices`) from `ebay-actions.ts` to the new file.
*   **Step B2: Create Update Actions File**
    *   **Action:** Create `actions/ebay-update-actions.ts`.
    *   **Action:** Move orchestrating/update functions (`updateEbayPrices`, `updateAllEbayListedValues`, `refreshAllItemPricesEnhanced`) from `ebay-actions.ts` to the new file.
    *   **Action:** Update moved functions to import from `ebay-fetch-actions.ts`.
*   **Step B3: Clean Up Original File & Update Imports**
    *   **Action:** Remove moved functions from `actions/ebay-actions.ts`. Rename/delete if empty/only helpers remain.
    *   **Action:** Update imports across the codebase to point to the new action files.
*   **Testing (Post Part B):** Test manual price fetching, single item updates, bulk updates. Verify data flow and imports.

**Part C: Improve Component Data Flow (Medium Impact)**

*   **Goal:** Make components cleaner by moving data fetching and complex logic into hooks or actions.
*   **Step C1: Refactor Direct API Call**
    *   **Action:** Create server action `ensureImageTimestampsAction` containing logic from `/api/update-image-timestamps` endpoint.
    *   **Action:** Remove direct `fetch` call from `components/catalog/index.tsx`.
    *   **Action:** Determine appropriate trigger/location for calling `ensureImageTimestampsAction` (e.g., in a hook).
*   **Step C2: Refactor Direct Action Call**
    *   **Action:** Locate direct `getImagesByItemIdAction` call in `components/catalog/index.tsx`.
    *   **Action:** Move this logic into a function within the `useImageCache` hook (e.g., `forceRefreshItemImages(itemId)`).
    *   **Action:** Update component `useEffect` to call the new hook function.
*   **Step C3: Encapsulate Cache Logic**
    *   **Action:** Analyze `localStorage`/`sessionStorage` cache logic in `components/catalog/index.tsx`.
    *   **Action:** Gradually move this logic into the `useImageCache` hook.
    *   **Action:** Simplify/remove corresponding `useEffect` hooks from the component.
*   **Testing (Post Part C):** Test catalog loading, image loading/updates, cache invalidation between item detail and catalog views. Ensure timestamp logic functions.

**Part D: Optimize Queries (Low-Medium Impact)**

*   **Goal:** Reduce unnecessary data fetching, especially for the main item list.
*   **Step D1: Analyze Catalog View Columns**
    *   **Action:** Identify specific fields required by `ItemListView` and `ItemGridView`.
*   **Step D2: Create Optimized Query**
    *   **Action:** In `db/queries/items-queries.ts`, create `getItemsForCatalog(userId: string)` using `db.select({...})` for specific columns identified.
    *   **Action:** Define a smaller return type (e.g., `SelectItemForCatalog`).
*   **Step D3: Update Data Fetching Hook**
    *   **Action:** Modify `useCatalogItems` hook (or relevant fetch location) to use the new `getItemsForCatalog` query/action.
    *   **Action:** Update hook state and downstream logic to use the smaller type.
*   **Step D4: Review Other Queries (Optional)**
    *   **Action:** Review other `db.select()` calls (`getItemById`, `getImagesByItemId`) and optimize if the benefit outweighs the effort.
*   **Testing (Post Part D):** Test catalog view loading. Verify data display. Confirm less data transfer if possible.
