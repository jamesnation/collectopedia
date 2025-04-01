# Security Remediation Plan: Outstanding Issues

**Date:** 2024-04-01 (Updated after verification)

**Objective:** Address the remaining security vulnerabilities and discrepancies identified during the verification phase of the security audit.

---

## Outstanding Remediation Tasks

The following issues require implementation to complete the security hardening process:

### 1. `actions/images-actions.ts`: Implement Auth/Authz and Input Validation (Priority: Critical)

*   **Vulnerability:** This file currently lacks required authentication checks, authorization (ownership/IDOR) controls, and input validation.
*   **Affected Actions:** `getImagesByItemIdAction`, `getBatchImagesByItemIdsAction`, `createImageAction`, `deleteImageAction`, `createMultipleImagesAction`, `updateImageOrderAction`, `reorderImagesAction`.
*   **Required Fixes:**
    *   **Authentication:** Add `auth()` check at the start of all actions.
    *   **Authorization (IDOR):**
        *   `createImageAction`/`createMultipleImagesAction`: Use authenticated `userId`; verify the user owns the associated `itemId`.
        *   `deleteImageAction`: Implement fetch-then-verify for the `imageId` (fetch image, check `image.userId === auth().userId`). Also verify ownership of the associated `itemId` if provided.
        *   `updateImageOrderAction`/`reorderImagesAction`: Verify ownership of the associated `itemId` before performing mutations. For `updateImageOrderAction`, also verify ownership of the `imageId` being updated.
        *   `getImagesByItemIdAction`/`getBatchImagesByItemIdsAction`: Add checks to ensure the associated `itemId`(s) belong to the authenticated user, *if* images are not intended to be public. If public, add explicit comments confirming this.
    *   **Input Validation:** Define and implement Zod schemas to validate input data for actions like `createImageAction`, `createMultipleImagesAction`, `updateImageOrderAction`, `reorderImagesAction`. Handle validation errors appropriately.

### 2. `actions/ebay-actions.ts`: Refactor `refreshAll*` Actions (Priority: High)

*   **Vulnerability:** `refreshAllItemPricesEnhanced` and `refreshAllEbayPrices` incorrectly accept `userId` as an argument instead of using the authenticated session.
*   **Affected Actions:** `refreshAllItemPricesEnhanced`, `refreshAllEbayPrices`.
*   **Required Fixes:**
    *   Remove the `userId` parameter from the function signatures.
    *   Add the standard `auth()` check at the beginning to get the authenticated `userId`.
    *   Use the `userId` obtained from `auth()` when calling downstream actions (e.g., `getItemsByUserIdAction` which should internally use the authenticated user).

### 3. `actions/custom-types-actions.ts`: Implement Input Validation (Priority: High)

*   **Vulnerability:** Actions accepting `FormData` (`createCustomTypeAction`, `updateCustomTypeAction`, `deleteCustomTypeAction`) lack robust input validation.
*   **Affected Actions:** `createCustomTypeAction`, `updateCustomTypeAction`, `deleteCustomTypeAction`.
*   **Required Fixes:**
    *   Define Zod schemas for the expected data (`id`, `name`, `description`).
    *   In each action, extract the relevant fields from `FormData`.
    *   Use the Zod schema's `.safeParse()` method to validate the extracted data object.
    *   Handle validation failures gracefully, returning appropriate error messages/status.

### 4. `actions/profiles-actions.ts`: Review `getAllProfilesAction` (Priority: Low / Decision Needed)

*   **Issue:** The `getAllProfilesAction` currently allows any authenticated user to retrieve a list of *all* user profiles in the system.
*   **Action Required:**
    *   **Decision:** Determine if this functionality is required. Is there a valid use case for non-admin users to see all profiles?
    *   **Implementation (If Not Required):** Remove the `getAllProfilesAction` function entirely.
    *   **Implementation (If Admin Only):** Keep the function but add Role-Based Access Control. Check Clerk session claims (e.g., `auth().sessionClaims?.metadata?.role === 'admin'`) and throw an authorization error if the user is not an admin.

---

Addressing these remaining items will complete the planned security remediation based on the audit findings.
