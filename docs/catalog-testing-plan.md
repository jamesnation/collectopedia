# Catalog Testing Plan

This document outlines a comprehensive testing plan for the catalog functionality, with special emphasis on image handling and React Query integration. This testing should be completed before moving on to Phase 3 of the refactoring.

## Test Categories

1. **Data Fetching & Display**
2. **Image Handling**
3. **Adding & Editing Items**
4. **Filtering & Sorting**
5. **State Management**
6. **Performance**

## 1. Data Fetching & Display Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| DF-01 | Initial catalog load | 1. Navigate to catalog page | Items load successfully with proper loading states |
| DF-02 | Empty catalog state | 1. Load catalog with no items | Empty state UI is displayed with appropriate message |
| DF-03 | Error handling | 1. Simulate network error<br>2. Navigate to catalog | Error state UI is displayed with retry option |
| DF-04 | Grid view display | 1. Select grid view<br>2. Check item display | Items display in a responsive grid layout |
| DF-05 | List view display | 1. Select list view<br>2. Check item display | Items display in a sortable list with detailed information |

## 2. Image Handling Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| IMG-01 | Image upload | 1. Add new item<br>2. Upload image<br>3. Submit form | Image uploads successfully and is displayed in preview |
| IMG-02 | Multiple image upload | 1. Add new item<br>2. Upload multiple images<br>3. Submit form | All images upload and primary image displays in catalog |
| IMG-03 | Image display in catalog | 1. Add item with image<br>2. View in catalog | Image appears correctly in both grid and list views |
| IMG-04 | Image display in details | 1. Add item with image<br>2. View item details | Image appears correctly in detail view |
| IMG-05 | Image caching | 1. Add item with image<br>2. Navigate away<br>3. Return to catalog | Image loads quickly from cache without re-fetching |
| IMG-06 | Image updating | 1. Edit an item<br>2. Update image<br>3. Save changes | New image appears in both catalog and detail views |
| IMG-07 | Handling missing images | 1. Add item without image<br>2. View in catalog | Placeholder displays correctly |
| IMG-08 | Cache invalidation | 1. Update an item's image<br>2. Check catalog and detail views | New image appears correctly in all views |

## 3. Adding & Editing Items Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| AE-01 | Add new item complete | 1. Click "Add Item"<br>2. Fill all fields<br>3. Submit | Item is added and appears in catalog |
| AE-02 | Add item with minimum fields | 1. Click "Add Item"<br>2. Fill only required fields<br>3. Submit | Item is added with default values for optional fields |
| AE-03 | Add item form validation | 1. Click "Add Item"<br>2. Leave required fields empty<br>3. Submit | Form shows validation errors and prevents submission |
| AE-04 | Numeric field validation | 1. Click "Add Item"<br>2. Enter invalid values in numeric fields<br>3. Submit | Form handles conversion correctly or shows validation errors |
| AE-05 | Edit existing item | 1. Select item<br>2. Edit fields<br>3. Save | Changes are saved and reflected in catalog and detail views |
| AE-06 | Delete item | 1. Select item<br>2. Click delete<br>3. Confirm | Item is removed from catalog |
| AE-07 | Form cancellation | 1. Open add/edit form<br>2. Make changes<br>3. Click cancel | Form closes and no changes are saved |

## 4. Filtering & Sorting Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| FS-01 | Text search | 1. Enter search text<br>2. Check results | Results show only items matching search text |
| FS-02 | Type filter | 1. Select a type filter<br>2. Check results | Results show only items of selected type |
| FS-03 | Multiple filters | 1. Apply multiple filters<br>2. Check results | Results match all selected filter criteria |
| FS-04 | Clearing filters | 1. Apply filters<br>2. Clear filters<br>3. Check results | All items reappear in results |
| FS-05 | Sorting by field | 1. Select sort field and direction<br>2. Check order | Items are sorted correctly by selected field |
| FS-06 | Sort persistence | 1. Sort items<br>2. Navigate away<br>3. Return to catalog | Sort order is preserved |
| FS-07 | Filter + sort combination | 1. Apply filters<br>2. Sort results<br>3. Check order | Filtered results are sorted correctly |

## 5. State Management Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| SM-01 | React Query caching | 1. Load catalog<br>2. Navigate away<br>3. Return quickly | Data loads instantly from cache |
| SM-02 | Context state persistence | 1. Change filters/view<br>2. Navigate away<br>3. Return | UI preferences are preserved |
| SM-03 | Optimistic updates | 1. Edit an item<br>2. Observe catalog before server response | UI updates immediately before server confirms |
| SM-04 | Cache invalidation | 1. Add/edit/delete item<br>2. Check related views | Related data is refreshed appropriately |
| SM-05 | Error recovery | 1. Cause mutation error<br>2. Check UI state | UI recovers gracefully and shows appropriate error |

## 6. Performance Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| PERF-01 | Large catalog load | 1. Load catalog with 100+ items | Items load efficiently with pagination/virtualization |
| PERF-02 | Image loading | 1. Load catalog with many images | Images load efficiently without blocking UI |
| PERF-03 | Filter performance | 1. Apply filters to large catalog | Filtering occurs quickly without UI freezing |
| PERF-04 | Item addition speed | 1. Add new item with image | Process completes in reasonable time with feedback |
| PERF-05 | Re-render optimization | 1. Use React DevTools<br>2. Observe renders during interactions | Only affected components re-render |

## Test Environment Setup

1. **Test Data Generation**
   - Create a script to generate test items with:
     - Various types, franchises, brands
     - Items with and without images
     - Varied numeric values
     - Items in sold/unsold states

2. **Mock Server Configuration**
   - Configure MSW to intercept API requests
   - Add controlled latency to test loading states
   - Simulate error conditions for specific tests

3. **Testing Tools**
   - React Testing Library for component tests
   - Cypress for end-to-end tests
   - React DevTools for performance monitoring
   - MSW for API mocking

## Testing Workflow

1. Run all tests in a development environment
2. Document any failures or unexpected behavior
3. Fix issues according to priority:
   - Critical: Data loss, application crashes
   - High: Functionality broken but with workarounds
   - Medium: UI inconsistencies
   - Low: Minor visual glitches

## Specific Areas of Focus

Based on recent work in Phase 2, pay special attention to:

1. **Image Handling** - Verify images save and display correctly in all views
2. **Type Conversions** - Test numeric fields with various inputs including empty, zero, negative
3. **React Query Integration** - Verify optimistic updates and cache invalidation
4. **Context-Query Interaction** - Ensure clear boundaries between state management systems

## Sign-off Criteria

Before proceeding to Phase 3, ensure:

1. All critical and high-priority issues are resolved
2. 90% of tests pass successfully
3. No regressions in existing functionality
4. Documentation is updated to reflect current state 