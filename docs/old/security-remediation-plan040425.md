# Security Remediation Plan

**Date:** 2024-04-01 (Updated after re-analysis)

**Objective:** Address the outstanding security vulnerabilities identified after recent reversions to the eBay API features.

---

## Outstanding Security Remediation Tasks

The following issues require implementation to complete the security hardening process:

### 1. (High Risk) Missing Rate Limiting on Both eBay API Routes

*   **Files Affected:** `app/api/ebay/route.ts`, `app/api/ebay/search-by-image/route.ts`
*   **Issue:** Neither endpoint currently implements rate limiting, exposing them to DoS and resource/quota exhaustion attacks.
*   **Plan:** Re-implement rate limiting using Upstash Ratelimit (`@upstash/ratelimit`) and Vercel KV (`@vercel/kv`) in both route handlers (`GET` for `/api/ebay`, `POST` for `/api/ebay/search-by-image`). Limit based on IP address (`request.ip`) as authentication is not present. Return 429 errors when limits are exceeded.

### 2. (Medium Risk) Unauthenticated Access on Both eBay API Routes

*   **Files Affected:** `app/api/ebay/route.ts`, `app/api/ebay/search-by-image/route.ts`
*   **Issue:** Both endpoints allow unauthenticated access.
*   **Plan:**
    *   **Decision:** Confirm if requiring authentication for these endpoints is acceptable now or if they *must* remain public.
    *   **Implementation (If Auth Required):** Re-implement Clerk `auth()` checks at the start of both handlers. Return 401 errors if `userId` is null. *If authentication is added, change the rate limiter key from IP to `userId`.*
    *   **Implementation (If Public):** Acknowledge the risk of resource consumption by non-users. Ensure rate limiting (Item 1) is robust. Add comments explicitly stating these endpoints are intentionally public.

### 3. (Low Risk) Degraded Input Validation on Image Search API

*   **File Affected:** `app/api/ebay/search-by-image/route.ts`
*   **Issue:** Validation uses a basic custom function instead of the more robust Zod schema previously implemented.
*   **Plan:** Re-introduce Zod schema validation (`EbayImageSearchBodySchema` including the `.refine` for base64 check) for the request body in the `POST` handler. Use `safeParse` and return 400 errors on failure.

---

Addressing these items will improve the security posture based on the latest findings.
