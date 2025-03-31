# Security Implementation Tracking

**Created:** 2025-03-31
**Last Updated:** 2025-03-31

## Overview

This document tracks the implementation progress of security fixes identified in the [Security Remediation Plan](./security-remediation-plan.md). The goal is to address all security vulnerabilities without changing UI or functionality while ensuring code maintainability.

## Implementation Phases

| Phase | Description | Priority | Status | Completed Date |
|-------|-------------|----------|--------|---------------|
| 1 | Authentication & Authorization in Server Actions | Highest | In Progress | |
| 2 | Input Validation | High | Not Started | |
| 3 | Supabase RLS Verification | High | Not Started | |
| 4 | API Rate Limiting | Medium | Not Started | |
| 5 | Stripe Payment Link Fix | Medium | Not Started | |
| 6 | Custom Brands Scope Resolution | Medium | Not Started | |
| 7 | User Data Deletion Completion | Medium | Not Started | |
| 8 | HTTP Security Headers | Medium | Not Started | |
| 9 | Minor Configuration Fixes | Low | Not Started | |

## Phase Details

### Phase 1: Authentication & Authorization in Server Actions

**Status:** In Progress

**Files to Modify:**
- [x] `actions/items-actions.ts` (Completed 2025-03-31)
- [x] `actions/profiles-actions.ts` (Completed 2025-03-31)
- [ ] `actions/ebay-actions.ts`
- [x] `actions/custom-brands-actions.ts` (Completed 2025-03-31)
- [ ] `actions/custom-franchises-actions.ts`
- [ ] `actions/custom-types-actions.ts`
- [ ] Other action files in `/actions/`

**Implementation Steps:**
1. Add authentication checks using `auth()` from Clerk
2. Fix create actions to use authenticated userId
3. Implement fetch-then-verify pattern for update/delete actions
4. Rename and refactor data fetching actions to use authenticated userId

**Testing:**
- Verify all server actions require authentication
- Verify users cannot access/modify data they don't own
- Ensure all features still work with proper authentication

### Phase 2: Input Validation

**Status:** Not Started

**Files to Create:**
- [ ] `/lib/schemas/item-schemas.ts`
- [ ] `/lib/schemas/profile-schemas.ts`
- [ ] `/lib/schemas/custom-brand-schemas.ts`
- [ ] `/lib/schemas/custom-franchise-schemas.ts`
- [ ] `/lib/schemas/custom-type-schemas.ts`
- [ ] `/lib/schemas/ebay-schemas.ts`

**Files to Modify:**
- [ ] All server action files accepting user input
- [ ] `/api/ebay/route.ts`

**Implementation Steps:**
1. Create Zod schemas for all input data types
2. Implement validation in all server actions
3. Add special handling for FormData validation
4. Implement API route parameter validation

**Testing:**
- Verify valid inputs are accepted
- Verify invalid inputs are rejected with appropriate error messages
- Ensure validation doesn't break existing functionality

### Phase 3: Supabase RLS Verification

**Status:** Not Started

**Tables to Verify/Modify:**
- [ ] `items`
- [ ] `profiles`
- [ ] `images`
- [ ] `sold_items`
- [ ] `custom_brands`
- [ ] `custom_franchises`
- [ ] `custom_types`
- [ ] `ebay_history`

**Implementation Steps:**
1. Access Supabase dashboard
2. Verify RLS is enabled for each table
3. Create/verify policies for SELECT, INSERT, UPDATE, DELETE operations
4. Test policies with authenticated and unauthenticated requests

**Testing:**
- Verify direct database access is properly restricted based on user authentication
- Test with authenticated and unauthenticated requests via Supabase client

### Phase 4: API Rate Limiting

**Status:** Not Started

**Files to Modify:**
- [ ] `/api/ebay/route.ts`

**Implementation Steps:**
1. Install required dependencies
2. Implement rate limiting using Upstash and Vercel KV
3. Configure appropriate rate limits
4. Add error handling for rate limit exceeded

**Testing:**
- Verify legitimate API usage works normally
- Confirm rate limits are enforced when exceeded

### Phase 5: Stripe Payment Link Fix

**Status:** Not Started

**Files to Modify:**
- [ ] `app/(marketing)/pricing/page.tsx`

**Implementation Steps:**
1. Convert to client component
2. Use Clerk hooks to get authenticated userId
3. Dynamically construct payment links with client_reference_id
4. Handle unauthenticated user scenarios

**Testing:**
- Verify payment links include client_reference_id for authenticated users
- Confirm checkout session completions correctly associate with user accounts
- Test behavior for unauthenticated users

### Phase 6: Custom Brands Scope Resolution

**Status:** Not Started

**Decision Needed:** Global vs. User-specific

**Files to Modify:**
- [ ] `actions/custom-brands-actions.ts`

**Implementation Steps:**
- Depends on decision about scope

**Option A: User-Specific**
1. Update getCustomBrandsAction to filter by authenticated userId
2. Implement IDOR checks in update/delete actions

**Option B: Global with Admin Control**
1. Remove userId from createCustomBrandAction
2. Add admin role checks for create/update/delete actions
3. Implement admin role checking function

**Testing:**
- Test behavior matches chosen scope model
- Verify authorization works correctly

### Phase 7: User Data Deletion Completion

**Status:** Not Started

**Files to Modify:**
- [ ] `actions/delete-user-data.ts`

**Implementation Steps:**
1. Review schema to identify all user-related tables
2. Update deleteUserDataAction to handle all tables
3. Add authentication and authorization checks

**Testing:**
- Verify complete removal of user data across all tables
- Confirm no orphaned records remain after deletion

### Phase 8: HTTP Security Headers

**Status:** Not Started

**Files to Modify:**
- [ ] `next.config.mjs`

**Implementation Steps:**
1. Define security headers configuration
2. Add headers to Next.js config
3. Test and adjust CSP directives as needed

**Testing:**
- Use browser developer tools to verify headers are applied
- Check for CSP violations in browser console
- Verify application functions correctly with headers applied

### Phase 9: Minor Configuration Fixes

**Status:** Not Started

**Files to Modify:**
- [ ] `next.config.mjs` (Image hostname configuration)

**Implementation Steps:**
1. Identify legitimate image sources
2. Update remotePatterns configuration
3. Test with images from allowed sources

**Testing:**
- Verify images from legitimate sources load correctly
- Confirm images from unauthorized sources are blocked

## Timeline

- **Week 1:** Phases 1-2 (Authentication, Authorization, Input Validation)
- **Week 2:** Phases 3-5 (Supabase RLS, API Rate Limiting, Stripe Fix)
- **Week 3:** Phases 6-9 (Custom Brands, User Data Deletion, Headers, Minor Fixes)

## Completion Checklist

- [ ] All phases implemented
- [ ] All tests passed
- [ ] No UI or functionality changes
- [ ] Code maintainability preserved
- [ ] Final review completed 