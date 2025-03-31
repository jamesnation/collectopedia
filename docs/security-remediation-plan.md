# Security Remediation Plan: Server Actions Authentication & Authorization

**Date:** 2024-03-31

**Objective:** Address critical vulnerabilities related to missing authentication and authorization checks in Collectopedia server actions (`/actions/*.ts`).

## 1. Vulnerability Summary

*   **Missing Authentication:** Server actions lack checks to verify if a user is logged in (`auth().userId`). Allows unauthenticated access to protected functionality and data.
*   **Missing Authorization (IDOR & Incorrect User):** Actions operating on user-specific data fail to verify if the authenticated user owns the target resource. They incorrectly trust client-provided `userId` instead of using the secure session `userId`. Allows users to view, modify, or delete other users' data.
*   **Insufficient Middleware Protection:** `middleware.ts` only protects `/notes(.*)`, leaving most routes/actions vulnerable at the edge.

**Affected Files (Examples):**
*   `actions/items-actions.ts`
*   `actions/profiles-actions.ts`
*   (Likely others in `/actions/`)

## 2. Remediation Plan

### Step 1: Import `auth` Dependency

In **every** server action file within `/actions/*.ts` that requires authentication or handles user-specific data, add the following import:

```typescript
import { auth } from "@clerk/nextjs/server";
```

### Step 2: Implement Authentication Checks

At the beginning of **each** exported server action function requiring protection, add an authentication check using the session `userId`:

```typescript
export async function someAction( /* parameters */ ) {
  const { userId } = auth(); // Get userId from Clerk session

  if (!userId) {
    // Throw an error for unauthenticated access
    throw new Error("Authentication Required: User not logged in.");
  }

  // ... rest of the action logic, now assured userId is non-null ...
}
```

### Step 3: Implement Authorization (Ownership & IDOR Checks)

Modify actions to use the authenticated `userId` from Step 2 and perform ownership checks:

*   **Create Actions (`createItemAction`, `createProfileAction`, etc.):**
    *   Remove any `userId` field from the input data type/parameters.
    *   Generate resource IDs (like `itemId`) server-side (e.g., `crypto.randomUUID()`).
    *   Use the `userId` obtained from `auth()` when saving the new record to the database.

    ```typescript
    // Example Signature Change
    // export async function createItemAction(itemData: Omit<InsertItem, 'userId' | 'id'>) {
    //   const { userId } = auth();
    //   if (!userId) { throw new Error("Authentication Required"); }
    //   const newItemId = crypto.randomUUID();
    //   const insertData = { ...itemData, id: newItemId, userId: userId };
    //   // ... insert logic ...
    // }
    ```

*   **Update/Delete Actions (`updateItemAction`, `deleteItemAction`, etc.):**
    *   Require the resource `id` (e.g., `itemId`) as a parameter.
    *   **Fetch the resource** using the provided `id`.
    *   **Compare** the fetched resource's owner field (e.g., `item.userId`) with the authenticated `userId` from `auth()`.
    *   If they **do not match**, throw an authorization error (e.g., `throw new Error("Authorization Failed");`).
    *   If they match, proceed with the update/delete operation.

    ```typescript
    // Example Delete Logic
    // export async function deleteItemAction(id: string) {
    //   const { userId } = auth();
    //   if (!userId) { throw new Error("Authentication Required"); }
    //
    //   // Fetch item to check ownership (adjust query as needed)
    //   const item = await db.select({ userId: itemsTable.userId }).from(itemsTable).where(eq(itemsTable.id, id)).limit(1);
    //
    //   if (!item || item.length === 0) { throw new Error("Item not found."); }
    //   if (item[0].userId !== userId) { throw new Error("Authorization Failed: You do not own this item."); }
    //
    //   // Proceed with delete
    //   await deleteItem(id);
    //   revalidatePath("/");
    // }
    ```

*   **Data Fetching by User (`getItemsByUserIdAction`, `getProfileByUserIdAction`, etc.):**
    *   Rename functions to reflect fetching data for the *current* user (e.g., `getCurrentUserItemsAction`, `getCurrentUserProfileAction`).
    *   Remove the `userId` parameter from the function signature.
    *   Use the `userId` obtained from `auth()` directly in the database query logic.

    ```typescript
    // Example Get Profile Logic
    // export async function getCurrentUserProfileAction() {
    //   const { userId } = auth();
    //   if (!userId) { return { isSuccess: false, error: "Not authenticated", data: null }; }
    //   const profile = await getProfileByUserId(userId); // Query uses authenticated userId
    //   // ... return profile ...
    // }
    ```

### Step 4: Address `getAllProfilesAction`

*   Add the standard authentication check (Step 2).
*   **Evaluate:** Is there a valid use case for non-admin users to fetch *all* profiles?
*   **Recommendation:** If not, remove this action or restrict it to specific admin roles (requires implementing role checks).

### Step 5: (Optional) Defense-in-Depth in Queries

*   Consider modifying database query functions (e.g., in `/db/queries`) for update/delete operations to *also* include a `where` clause matching the authenticated `userId` for an additional layer of security.

    ```typescript
    // Example update query with user check
    // db.update(itemsTable)
    //   .set(data)
    //   .where(and(eq(itemsTable.id, id), eq(itemsTable.userId, userId)))
    ```

## 3. Security Impact of Changes

*   Enforces user authentication for protected actions.
*   Prevents unauthorized data access, modification, and deletion (mitigates IDOR).
*   Ensures data ownership is correctly maintained based on the authenticated session.
*   Reduces attack surface by eliminating reliance on client-provided identifiers for authorization.

## 4. Next Steps

1.  Implement the changes outlined above across all relevant files in `/actions/`.
2.  Plan and implement remediation for other identified issues (Input Validation, Supabase RLS verification, Image Hostname Restriction).
3.  Test thoroughly to ensure fixes are effective and don't break functionality.

---

## Planning Phase: Input Validation

**Vulnerability:** Insufficient Input Validation in Server Actions (`/actions/*.ts`)

**Risk Explanation:**
*   Server actions accept data from client-side forms or API calls. Without rigorously validating the structure, types, formats, lengths, and allowed values of this incoming data *before* processing it or passing it to the database, the application is vulnerable.
*   Malformed or unexpected input can lead to:
    *   **Errors:** Causing actions to fail unexpectedly.
    *   **Data Corruption:** Saving invalid data (e.g., incorrect types, overly long strings) into the database.
    *   **Unexpected Behavior:** Logic flaws if code relies on assumptions about the input that are violated.
    *   **Potential Injection (Less likely with ORM but possible):** In rare cases or with complex inputs, improper validation could contribute to injection vulnerabilities if data is used insecurely later on (though Drizzle ORM helps mitigate direct SQL injection).
    *   **Denial of Service:** Handling excessively large or complex malicious input could consume server resources.

**Evidence:**
*   `actions/items-actions.ts`: `createItemAction` and `updateItemAction` perform minimal runtime checks or type processing but lack comprehensive schema-based validation for the entire input object.
*   `actions/profiles-actions.ts`: `createProfileAction` and `updateProfileAction` accept data objects without apparent schema validation before database interaction.
*   (Assumption: Other actions accepting input likely follow the same pattern).

**Proposed Remediation Steps:**
1.  **Install Zod:** Add Zod, a popular TypeScript-first schema declaration and validation library, to the project dependencies.
    ```bash
    npm install zod
    # or
    yarn add zod
    # or
    pnpm add zod
    ```
    *(Instruction: You will need to run this command in your terminal.)*
2.  **Define Zod Schemas:** For each server action that accepts input data, define a Zod schema that precisely describes the expected shape, types, and constraints of that data. These schemas should ideally live close to where they are used or in a shared `types` or `schemas` directory.
    ```typescript
    // Example schema for creating an item (adjust based on actual requirements)
    // Potentially in 'lib/schemas/item-schemas.ts' or similar
    import { z } from 'zod';

    export const CreateItemSchema = z.object({
      // Note: 'id' and 'userId' are handled server-side, not part of input schema
      name: z.string().min(1, "Name is required").max(100, "Name too long"),
      type: z.string().min(1, "Type is required").max(50), // Or z.enum if predefined list
      franchise: z.string().min(1, "Franchise is required").max(50), // Or z.enum
      brand: z.string().max(50).optional().nullable(),
      year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
      acquired: z.date(), // Or z.coerce.date() if input might be string/number
      cost: z.number().nonnegative("Cost cannot be negative").optional().default(0), // Example default
      value: z.number().nonnegative("Value cannot be negative").optional().default(0),
      notes: z.string().max(1000, "Notes too long").optional().default(""),
      isSold: z.boolean().optional().default(false),
      soldDate: z.date().optional().nullable(), // Or z.coerce.date()
      soldPrice: z.number().nonnegative().optional().nullable(),
      ebayListed: z.number().nonnegative().optional().nullable(),
      ebaySold: z.number().nonnegative().optional().nullable(),
      // image/images might be handled separately (e.g., direct upload URL)
      // or included if passing URLs:
      // images: z.array(z.string().url()).optional()
    });

    export type CreateItemInput = z.infer<typeof CreateItemSchema>;
    ```
3.  **Validate Input in Actions:** In each server action, use the corresponding Zod schema's `.safeParse()` or `.parse()` method to validate the input data *immediately* after receiving it and *before* any other processing.
    *   `.safeParse()`: Returns a result object `{ success: true, data: ... }` or `{ success: false, error: ... }`. Preferred for graceful error handling.
    *   `.parse()`: Returns the validated data directly but throws an error if validation fails. Can be used within a `try...catch` block.
    ```typescript
    // Example in createItemAction
    import { CreateItemSchema } from '@/lib/schemas/item-schemas'; // Adjust path

    export async function createItemAction(inputData: unknown) { // Accept unknown initially
      const { userId } = auth();
      if (!userId) { throw new Error("Authentication Required"); }

      // Validate input first
      const validationResult = CreateItemSchema.safeParse(inputData);

      if (!validationResult.success) {
        // Log detailed error server-side (optional)
        console.error("Input validation failed:", validationResult.error.flatten());
        // Return a user-friendly error (don't leak raw Zod errors directly)
        return { isSuccess: false, error: "Invalid input data provided.", issues: validationResult.error.flatten().fieldErrors };
        // Or throw new Error("Invalid input data.");
      }

      // Use validated data (validationResult.data) from now on
      const validatedData = validationResult.data;
      const newItemId = crypto.randomUUID();

      const insertData = {
        ...validatedData, // Use validated data
        id: newItemId,
        userId: userId,
        // Ensure numeric rounding/processing happens AFTER validation if needed
        cost: Math.round(validatedData.cost),
        value: Math.round(validatedData.value),
        // ... etc ...
      };

      // ... rest of the action (database insert, etc.) ...
    }
    ```
4.  **Refine Schemas:** Adjust schemas based on specific needs (e.g., using `.refine()` for cross-field validation, `.transform()` for data cleanup/modification post-validation).

**Security Implications of Changes:**
*   Prevents invalid or malicious data from being processed or saved, enhancing data integrity.
*   Reduces the risk of errors and unexpected application behavior caused by bad input.
*   Mitigates risks associated with injection attacks by ensuring data conforms to expected formats before use.
*   Provides clear, centralized definitions of expected data structures.

---

## Planning Phase: Supabase Row Level Security (RLS)

**Vulnerability:** Potentially Insufficient Supabase Row Level Security (RLS)

**Risk Explanation:**
*   The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is exposed to the client-side JavaScript bundle (as seen in `.env.local`). This key grants anonymous access permissions to your Supabase instance.
*   If Row Level Security (RLS) policies are not enabled and correctly configured on *all* tables containing sensitive or user-specific data, client-side code (or a malicious actor using the anon key) could potentially bypass server-side logic (like your Server Actions) and directly query, insert, update, or delete data using Supabase's client-side libraries, subject only to the permissions granted by the anon key *and* the RLS policies.
*   Without RLS, the anon key might grant broad read/write access, effectively negating the security provided by server-side authentication/authorization checks for direct database access.

**Evidence:**
*   `.env.local`: `NEXT_PUBLIC_SUPABASE_ANON_KEY` is defined, indicating potential use of Supabase client-side libraries.
*   (Lack of Evidence): We have not yet confirmed that RLS is enabled and properly configured for tables like `items`, `profiles`, `images`, etc., within the Supabase dashboard or via schema definitions/migrations.

**Proposed Remediation Steps:**
1.  **Verify RLS Status (Manual Check Required):**
    *   **Action:** Access your Supabase project dashboard.
    *   Navigate to the "Authentication" -> "Policies" section (or the equivalent area for table RLS).
    *   For **every table** that stores user-specific or sensitive data (e.g., `items`, `profiles`, `images`, `sold_items`, `custom_brands`, etc.), verify that:
        *   RLS is **ENABLED**.
        *   Appropriate policies are **IN PLACE** to restrict access based on user authentication (`auth.uid()`) and ownership.
2.  **Implement RLS Policies (If Missing/Incorrect):**
    *   If RLS is disabled or policies are missing/incorrect, create them using SQL within the Supabase dashboard's SQL Editor or as part of your database migrations (`/db/migrations`).
    *   **Example Policies:**
        *   **Items Table (Allow owner SELECT, INSERT, UPDATE, DELETE):**
            ```sql
            -- Ensure RLS is enabled for the table
            ALTER TABLE items ENABLE ROW LEVEL SECURITY;

            -- Allow users to select their own items
            CREATE POLICY "Allow individual select access"
            ON items FOR SELECT
            USING (auth.uid() = user_id); -- Assumes column named 'user_id' storing Clerk user ID

            -- Allow users to insert items for themselves
            CREATE POLICY "Allow individual insert access"
            ON items FOR INSERT
            WITH CHECK (auth.uid() = user_id);

            -- Allow users to update their own items
            CREATE POLICY "Allow individual update access"
            ON items FOR UPDATE
            USING (auth.uid() = user_id);

            -- Allow users to delete their own items
            CREATE POLICY "Allow individual delete access"
            ON items FOR DELETE
            USING (auth.uid() = user_id);
            ```
        *   **Profiles Table (Allow owner SELECT, UPDATE; potentially wider SELECT):**
            ```sql
            -- Ensure RLS is enabled
            ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

            -- Allow users to select their own profile
            CREATE POLICY "Allow individual select access"
            ON profiles FOR SELECT
            USING (auth.uid() = user_id); -- Assumes column 'user_id'

            -- Allow authenticated users to select PUBLIC profile info (if applicable)
            -- CREATE POLICY "Allow authenticated read access for public fields"
            -- ON profiles FOR SELECT
            -- TO authenticated -- Restrict to logged-in users
            -- USING (true); -- Or filter based on a 'is_public' column

            -- Allow users to update their own profile
            CREATE POLICY "Allow individual update access"
            ON profiles FOR UPDATE
            USING (auth.uid() = user_id);

            -- Allow users to insert their own profile (usually done via trigger/function on signup)
            CREATE POLICY "Allow individual insert access"
            ON profiles FOR INSERT
            WITH CHECK (auth.uid() = user_id);

            -- Generally, disallow direct DELETE from client, handle via server action/trigger
            -- CREATE POLICY "Allow individual delete access" ... (use with caution)
            ```
    *   **Adapt:** Adjust column names (`user_id`) and logic based on your exact schema and requirements. Apply similar principles to all relevant tables. Test policies thoroughly.

**Security Implications of Changes:**
*   Provides a critical layer of defense directly at the database level, enforcing data access rules even if server-side logic has flaws or is bypassed.
*   Safely allows the use of the `NEXT_PUBLIC_SUPABASE_ANON_KEY` for legitimate client-side interactions (like authenticated data fetching via Supabase libraries if needed) without exposing all data.
*   Ensures that users can only interact with data they are explicitly permitted to access according to the defined policies.

---

## Planning Phase: Next.js Image Optimization Hostname Restriction

**Vulnerability:** Overly Permissive Image Optimization Hostname (`hostname: '**'`)

**Risk Explanation:**
*   The `next.config.mjs` file configures Next.js Image Optimization (`next/image`) using `remotePatterns` with `hostname: '**'`.
*   This allows *any* external hostname to be used as a source for images processed by the Next.js Image Optimization service.
*   Potential misuse includes:
    *   **Open Proxy Abuse:** Malicious actors could use your application's image endpoint (`/_next/image?...`) as a free, potentially unattributed proxy to resize or serve images from arbitrary third-party domains.
    *   **Resource Consumption:** This abuse could lead to increased server load and bandwidth consumption on your hosting platform (e.g., Vercel), potentially incurring unexpected costs.
    *   **Security Risk (Minor):** While less direct, proxying arbitrary content could potentially be used in complex phishing or social engineering schemes.

**Evidence:**
*   `next.config.mjs` (lines 14-17):
    ```javascript
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allows any hostname
      },
    ],
    ```

**Proposed Remediation Steps:**
1.  **Identify Legitimate Image Sources:** Determine the specific hostnames from which you intend to serve images via `next/image`. Based on your setup, this is likely just your Supabase storage bucket.
    *   From `.env.local`: `NEXT_PUBLIC_SUPABASE_URL=https://sjjbgnzyywlgpmgtmube.supabase.co`. The hostname is `sjjbgnzyywlgpmgtmube.supabase.co`.
2.  **Update `next.config.mjs`:** Modify the `remotePatterns` configuration to explicitly list only the allowed hostname(s).
    ```javascript
    // In next.config.mjs
    images: {
      // ... other image config ...
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'sjjbgnzyywlgpmgtmube.supabase.co', // Replace with your actual Supabase hostname
        },
        // Add other legitimate hostnames if necessary
        // e.g., for eBay images if proxied: { protocol: 'https', hostname: 'i.ebayimg.com' }
      ],
    },
    ```
3.  **Restart Development Server:** After saving the changes to `next.config.mjs`, restart your Next.js development server (`npm run dev` or similar) for the changes to take effect.

**Security Implications of Changes:**
*   Prevents the Next.js Image Optimization service from being abused as an open proxy.
*   Reduces unnecessary resource consumption and potential costs associated with processing images from untrusted sources.
*   Hardens the application by restricting external interactions to known, legitimate domains.

---

## Planning Phase: Stripe Payment Link `client_reference_id`

**Vulnerability:** Missing `client_reference_id` in Stripe Payment Link Redirect

**Risk Explanation:**
*   Users are redirected to Stripe Payment Links (e.g., `NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY`) directly from the frontend without appending the authenticated user's ID (`userId` from Clerk) as the `client_reference_id` URL parameter.
*   When the subsequent `checkout.session.completed` webhook is processed, the `client_reference_id` field within the webhook data is null.
*   The webhook handler (`app/api/stripe/webhooks/route.ts`) relies on `client_reference_id` to identify the user whose profile needs updating with Stripe customer/subscription details (`updateStripeCustomer` action).
*   Failure to provide this ID breaks the link between the Stripe subscription and the user profile in the application database.

**Evidence:**
*   `app/(marketing)/pricing/page.tsx` (line 20): Uses `process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY` directly as `buttonLink`.
*   `app/api/stripe/webhooks/route.ts` (line 63): Uses `checkoutSession.client_reference_id as string` as the `userId` argument for `updateStripeCustomer`.

**Proposed Remediation Steps:**
1.  **Modify Pricing Page Component:** Update the component in `app/(marketing)/pricing/page.tsx` (or wherever the redirect buttons/links are generated) to be a Client Component (using `"use client";`) or fetch user data server-side if possible.
2.  **Get Authenticated User ID:** Within the component, obtain the authenticated user's ID using Clerk's hooks (e.g., `useUser` if it's a Client Component) or server-side props.
3.  **Dynamically Construct URL:** Append the `userId` to the Stripe Payment Link URL as the `client_reference_id` query parameter *before* rendering the link or redirecting the user. Ensure the `userId` is properly URL-encoded if necessary.

    ```typescript
    // Example in a Client Component (app/(marketing)/pricing/page.tsx)
    "use client";

    import { useUser } from "@clerk/nextjs";
    // ... other imports

    export default function PricingPage() {
      const { user } = useUser();
      const userId = user?.id; // Get Clerk user ID

      // Construct the dynamic URL only if userId is available
      const monthlyLink = userId
        ? `${process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY}?client_reference_id=${encodeURIComponent(userId)}`
        : "/login"; // Or handle redirect differently if user isn't logged in

      const yearlyLink = userId
         ? `${process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_YEARLY}?client_reference_id=${encodeURIComponent(userId)}`
         : "/login";

      return (
        <div>
          {/* ... other pricing content ... */}
          <PricingCard
            // ... other props
            // Use the dynamically constructed link
            buttonLink={monthlyLink}
            // Ensure the button is disabled or redirects to login if !userId
            disabled={!userId}
          />
           <PricingCard
            // ... other props
            buttonLink={yearlyLink}
            disabled={!userId}
          />
          {/* ... */}
        </div>
      );
    }
    ```
4.  **Handle Unauthenticated Users:** Decide how to handle the payment links if the user is not logged in (e.g., disable the button, redirect to login first). The example above redirects to `/login`.

**Security Implications of Changes:**
*   Ensures the `client_reference_id` is correctly passed to Stripe during checkout.
*   Allows the webhook handler to reliably associate the completed checkout session and subsequent subscription events with the correct user profile in the application database.
*   Fixes the broken link between Stripe events and user accounts, ensuring membership status is updated correctly.

---

## Planning Phase: eBay Actions Auth/IDOR Fixes

**Vulnerability:** Missing Authentication/Authorization in specific eBay Server Actions.

**Risk Explanation:**
*   Actions like `refreshAllItemPricesEnhanced` and `refreshAllEbayPrices` in `actions/ebay-actions.ts` incorrectly accept `userId` as an argument instead of retrieving it from the authenticated session (`auth()`).
*   This allows these potentially resource-intensive actions to be triggered for arbitrary users if called insecurely, bypassing intended authorization.
*   Other actions like `updateEbayPrices` rely on downstream actions (`updateItemAction`) being fixed for their security.

**Evidence:**
*   `actions/ebay-actions.ts`: Function signatures for `refreshAllItemPricesEnhanced(userId: string, ...)` and `refreshAllEbayPrices(userId: string, ...)`. Lack of `auth()` calls within these specific functions.

**Proposed Remediation Steps:**
1.  **Refactor `refreshAll*` Actions:**
    *   Modify `refreshAllItemPricesEnhanced` and `refreshAllEbayPrices` to remove the `userId` parameter.
    *   Add the standard `auth()` check at the beginning of these functions to get the authenticated `userId`.
    *   Use the `userId` from `auth()` when calling downstream actions like `getItemsByUserIdAction` (which also needs to be refactored as per the initial plan).
2.  **Defense-in-Depth (Optional but Recommended):** Add `auth()` checks and potentially ownership verification (fetching the item first) directly within `updateEbayPrices` before it calls `updateItemAction`, rather than solely relying on the downstream action's security.

**Security Implications of Changes:**
*   Ensures bulk eBay update operations only run for the currently authenticated user.
*   Prevents unauthorized triggering of potentially costly/resource-intensive operations on behalf of other users.

---

## Planning Phase: API Route Input Validation (`/api/ebay`)

**Vulnerability:** Insufficient Input Validation in eBay API Route.

**Risk Explanation:**
*   The `GET` handler in `app/api/ebay/route.ts` does not sufficiently validate query parameters like `toyName` (length/content) and `listingType` (enum check).
*   Malformed input could lead to errors, unexpected behavior in the API logic or external eBay calls, or minor denial-of-service vectors (e.g., very long `toyName`).

**Evidence:**
*   `app/api/ebay/route.ts`: Lack of schema validation (e.g., Zod) on `request.nextUrl.searchParams`.

**Proposed Remediation Steps:**
1.  **Define Zod Schema:** Create a Zod schema for the expected query parameters.
    ```typescript
    import { z } from 'zod';

    const EbayApiParamsSchema = z.object({
      toyName: z.string().min(1, 'toyName is required').max(200, 'toyName too long'), // Example length limit
      listingType: z.enum(['listed', 'sold'], { required_error: 'listingType is required' }),
      condition: z.enum(['New', 'Used']).optional(),
      region: z.string().max(10).optional(), // Example length limit
      includeItems: z.coerce.boolean().optional(),
    });
    ```
2.  **Validate in GET Handler:** Use `EbayApiParamsSchema.safeParse()` at the beginning of the `GET` handler in `app/api/ebay/route.ts` to validate the query parameters obtained from `request.nextUrl.searchParams`. Return a `NextResponse.json({ error: 'Bad Request', issues: ... }, { status: 400 })` if validation fails.

**Security Implications of Changes:**
*   Prevents processing of invalid requests, improving robustness.
*   Reduces the risk of errors or unexpected behavior due to malformed query parameters.

---

## Planning Phase: API Route Rate Limiting (`/api/ebay`)

**Vulnerability:** Missing Rate Limiting on eBay API Route.

**Risk Explanation:**
*   The `/api/ebay` endpoint makes external API calls (eBay, RapidAPI) which have cost and rate limits.
*   The endpoint lacks authentication and rate limiting, making it vulnerable to abuse by any party (authenticated users performing bulk actions, unauthenticated users, bots).
*   Abuse can lead to external API rate limit exhaustion, denial of service for legitimate users, and potentially high costs.

**Evidence:**
*   `app/api/ebay/route.ts`: No rate limiting implementation found.

**Proposed Remediation Steps:**
1.  **Choose Method:** Select a rate-limiting strategy suitable for the Next.js/Vercel environment.
    *   **Option A (Vercel Preferred):** Configure rate limiting via `vercel.json`. Offers simplicity but less granular control.
    *   **Option B (More Control):** Implement `@upstash/ratelimit` within the `GET` handler using an Upstash Redis instance or Vercel KV store. Allows limiting per IP address.
2.  **Implement:**
    *   **(Upstash Example):**
        ```typescript
        import { Ratelimit } from '@upstash/ratelimit';
        import { kv } from '@vercel/kv'; // Or import redis client
        import { NextRequest, NextResponse } from 'next/server';

        const ratelimit = new Ratelimit({
          redis: kv, // Or your Redis client
          limiter: Ratelimit.slidingWindow(10, '60 s'), // Allow 10 requests per 60 seconds
          analytics: true,
        });

        export async function GET(request: NextRequest) {
          const ip = request.ip ?? '127.0.0.1';
          const { success, pending, limit, reset, remaining } = await ratelimit.limit(ip);

          if (!success) {
             return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
          }

          // ... rest of API route logic ...
        }
        ```
    *   **(Vercel JSON Example):** Refer to Vercel documentation for configuring rate limits per path in `vercel.json`.
3.  **Adjust Limits:** Set appropriate rate limits (e.g., requests per minute/hour per IP) based on expected usage and external API constraints.

**Security Implications of Changes:**
*   Protects against abuse and denial-of-service attacks targeting the API route.
*   Helps prevent exhaustion of external API rate limits and associated costs.
*   Improves the overall availability and stability of the eBay pricing feature.

---

## Planning Phase: Custom Entity Actions Input Validation

**Vulnerability:** Insufficient Input Validation in Custom Entity Server Actions.

**Risk Explanation:**
*   Actions in `custom-brands-actions.ts`, `custom-franchises-actions.ts`, and `custom-types-actions.ts` accept input data (`data` objects or `FormData`) without robust schema validation (e.g., Zod).
*   This can lead to errors, data corruption (e.g., missing names, overly long descriptions), or unexpected behavior if invalid data is submitted.

**Evidence:**
*   Lack of Zod schemas or equivalent validation logic for input data in the respective action files.
*   Reliance on basic TypeScript types or manual checks (`!name`) which don't cover all validation aspects (e.g., length limits).

**Proposed Remediation Steps:**
1.  **Define Zod Schemas:** For each `create` and `update` action in these files, define a Zod schema describing the expected input (e.g., `name`, `description`). For actions using `FormData`, parse the relevant fields first, then validate the resulting object.
    ```typescript
    // Example for Custom Brand
    import { z } from 'zod';

    export const CustomBrandSchema = z.object({
      name: z.string().min(1, "Name is required").max(50, "Name too long"),
      description: z.string().max(255, "Description too long").optional(),
    });
    ```
2.  **Validate Input:** Implement `.safeParse()` using the appropriate schema at the beginning of each `create` and `update` action. Return a 400 Bad Request or equivalent error response if validation fails.

**Security Implications of Changes:**
*   Enhances data integrity by ensuring custom entities adhere to defined constraints.
*   Improves application robustness by handling invalid input gracefully.

---

## Planning Phase: Custom Entity Actions IDOR Checks

**Vulnerability:** Missing/Inconsistent Authorization (IDOR) Checks in Custom Entity Actions.

**Risk Explanation:**
*   The `update` and `delete` actions in `custom-brands-actions.ts` and `custom-franchises-actions.ts` do not explicitly verify that the authenticated user owns the entity (`brandId`, `franchiseId`) they are attempting to modify or delete.
*   This allows any authenticated user to potentially modify/delete entities belonging to other users if they can guess the ID.
*   While `custom-types-actions.ts` performs this check correctly, the lack of consistency is risky.

**Evidence:**
*   `custom-brands-actions.ts`: `updateCustomBrandAction` and `deleteCustomBrandAction` lack pre-mutation ownership checks.
*   `custom-franchises-actions.ts`: `updateCustomFranchiseAction` and `deleteCustomFranchiseAction` lack explicit pre-mutation ownership checks (relying on underlying queries).

**Proposed Remediation Steps:**
1.  **Implement Explicit Ownership Checks:** Before calling the database `update` or `delete` function in the affected actions (`custom-brands` and `custom-franchises`), perform the following:
    *   Fetch the target entity (brand/franchise) using the provided `id`.
    *   Check if the entity exists.
    *   Compare the entity's `userId` field with the `userId` obtained from `auth()`.
    *   If the entity doesn't exist or the `userId` doesn't match, throw or return an authorization error (e.g., "Not found or unauthorized").
    ```typescript
    // Example for deleteCustomBrandAction
    // ... auth check ...
    const { userId } = auth();
    // ... userId check ...

    // Fetch brand first
    const brand = await getCustomBrandById(id); // Assumes this query function exists

    // Check existence and ownership
    if (!brand || brand.userId !== userId) {
      return { isSuccess: false, error: "Brand not found or unauthorized" };
    }

    // Proceed with deletion
    await deleteCustomBrand(id);
    // ... revalidate and return success ...
    ```
2.  **Ensure Underlying Queries Exist:** Verify that necessary query functions (e.g., `getCustomBrandById`, `getCustomFranchiseById`) exist to support these checks.

**Security Implications of Changes:**
*   Prevents users from modifying or deleting custom entities they do not own.
*   Enforces proper authorization for all custom entity mutations.

---

## Planning Phase: Custom Brands Scope Clarification

**Vulnerability:** Ambiguous Scope (Global vs. User-Specific) for Custom Brands.

**Risk Explanation:**
*   The `getCustomBrandsAction` fetches all brands without user filtering, implying they are global.
*   However, `createCustomBrandAction` associates brands with a specific `userId`, implying they are user-specific.
*   This inconsistency makes it unclear how authorization should function (global admin vs. user ownership) and whether `getCustomBrandsAction` is leaking data.

**Evidence:**
*   `actions/custom-brands-actions.ts`: Discrepancy between `getCustomBrands` (no user filter) and `createCustomBrand` (associates `userId`).

**Proposed Remediation Steps:**
1.  **Determine Intended Scope:** Decide whether "Custom Brands" are meant to be shared globally across all users or private to the user who created them.
2.  **Adjust Actions Accordingly:**
    *   **If User-Specific:**
        *   Modify `getCustomBrandsAction` to call a query that filters by the authenticated `userId` (e.g., `getCustomBrandsByUserId(userId)`).
        *   Ensure IDOR checks (fetch-then-verify ownership) are implemented for `update` and `delete` as per the previous plan.
    *   **If Global:**
        *   Remove the `userId` association during creation (`createCustomBrandAction`).
        *   `getCustomBrandsAction` remains as is (fetching all).
        *   Implement **Role-Based Access Control** for `create`, `update`, and `delete` actions. Only allow users with a specific admin role (checked via Clerk metadata, e.g., `auth().sessionClaims?.metadata?.role === 'admin'`) to perform these mutations.

**Security Implications of Changes:**
*   Clarifies data access rules for custom brands.
*   Prevents data leakage if brands are user-specific.
*   Ensures only authorized users (owners or admins) can manage custom brands based on the chosen scope.

---

## Planning Phase: User Data Deletion Completeness

**Vulnerability:** Potentially Incomplete User Data Deletion.

**Risk Explanation:**
*   The `deleteUserDataAction` currently deletes records from `items`, `customTypes`, `customFranchises`, and `customBrands` tables.
*   It might be missing other tables containing user-specific data, leading to orphaned records or incomplete data removal upon user request.

**Evidence:**
*   `actions/delete-user-data.ts`: Deletes from a specific subset of tables.
*   File structure indicates potential existence of other user-related tables (`profiles`, `images`, `soldItems`, `ebayHistory`).

**Proposed Remediation Steps:**
1.  **Full Schema Review:** Examine the complete database schema (`/db/schema/index.ts` and related files) to identify *all* tables containing a `userId` column or a direct foreign key relationship to a user-specific table.
2.  **Identify Tables for Deletion:** Determine which of these tables should have records deleted when a user invokes `deleteUserDataAction`. Candidates include:
    *   `profilesTable` (or update to anonymize/deactivate)
    *   `imagesTable` (if not handled by cascading deletes)
    *   `soldItemsTable`
    *   `ebayHistoryTable`
3.  **Update `deleteUserDataAction`:** Add `tx.delete(...).where(eq(table.userId, userId))` statements within the existing transaction block for each additional table identified in Step 2.
4.  **Verify Cascading Deletes:** Alternatively, if foreign key constraints with `ON DELETE CASCADE` are defined in the schema (e.g., deleting an item cascades to delete its images), verify these constraints are correctly implemented and remove the need for explicit deletion of child records in the action.

**Security Implications of Changes:**
*   Ensures compliance with user data deletion requests (e.g., GDPR 'Right to be Forgotten').
*   Prevents orphaned user data remaining in the database.
*   Maintains database integrity.

---

## Planning Phase: HTTP Response Security Headers

**Vulnerability:** Missing Key HTTP Response Security Headers.

**Risk Explanation:**
*   The application does not appear to be setting important HTTP security headers on responses sent to the user's browser.
*   Missing headers like `Strict-Transport-Security` can leave users vulnerable to protocol downgrade attacks and man-in-the-middle attacks on insecure connections.
*   Missing `Content-Security-Policy` allows browsers to load resources from any source, increasing the risk of Cross-Site Scripting (XSS) attacks if malicious scripts are ever injected into the application pages.
*   Other missing headers (`Referrer-Policy`, `Permissions-Policy`) provide less critical but still valuable defense-in-depth.

**Evidence:**
*   No configuration for these headers found in `next.config.mjs` or `middleware.ts`.
*   The `getSecurityHeaders` utility in `utils/validate-url.ts` sets some headers, but these apply to outgoing server requests, not incoming browser responses, and are incomplete.

**Proposed Remediation Steps:**
1.  **Configure Headers in `next.config.mjs`:** Use the `headers` function in `next.config.mjs` to apply security headers globally or to specific routes.
    ```javascript
    // In next.config.mjs
    const securityHeaders = [
      // Enforce HTTPS
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload' // 2 years
      },
      // Prevent MIME-sniffing
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      // Prevent Clickjacking
      {
        key: 'X-Frame-Options',
        value: 'DENY' // Or 'SAMEORIGIN' if framing is needed
      },
      // Control Referrer information
      {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin' // A reasonable default
      },
      // Content Security Policy (CSP) - START SIMPLE
      // NOTE: CSP is powerful but complex. Start with a basic policy and refine.
      // A very restrictive policy might block necessary resources (inline scripts, styles, images from external domains).
      // Consider using a nonce-based approach for inline scripts if needed.
      {
        key: 'Content-Security-Policy',
        // Example: Allow self, Supabase, Clerk, Stripe, Vercel assets. ADJUST AS NEEDED!
        value: `default-src 'self'; script-src 'self' https://*.clerk.com https://*.stripe.com 'unsafe-inline' 'unsafe-eval'; style-src 'self' https://*.clerk.com 'unsafe-inline'; img-src 'self' data: https://*.supabase.co https://*.clerk.com https://*.stripe.com; font-src 'self' https://*.clerk.com; connect-src 'self' https://*.supabase.co https://*.clerk.com https://*.stripe.com https://api.ebay.com wss:; frame-src 'self' https://*.clerk.com https://*.stripe.com; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self' https://*.clerk.com;`
          .replace(/\s{2,}/g, ' ') // Remove excess whitespace
          .trim()
      },
      // Permissions Policy (Optional - disable features not needed)
      // {
      //   key: 'Permissions-Policy',
      //   value: 'camera=(), microphone=(), geolocation=()' // Example: Disable common features
      // }
    ];

    /** @type {import('next').NextConfig} */
    const nextConfig = {
      // ... other config like images, experimental ...

      async headers() {
        return [
          {
            // Apply these headers to all routes in your application.
            source: '/:path*',
            headers: securityHeaders,
          },
        ];
      },
    };

    export default nextConfig;
    ```
2.  **Refine CSP:** Carefully test the application after applying the initial CSP. Use browser developer tools (console) to identify any resources being blocked. Adjust the CSP directives (`script-src`, `style-src`, `img-src`, `connect-src`, etc.) to allow necessary sources (e.g., specific CDNs, analytics providers). Consider using reporting directives (`report-uri` or `report-to`) to monitor CSP violations.
3.  **HSTS Preloading:** After confirming HTTPS is stable, consider submitting your domain to the HSTS preload list for maximum protection (requires the `preload` directive in the HSTS header).

**Security Implications of Changes:**
*   `Strict-Transport-Security`: Protects against man-in-the-middle attacks by enforcing HTTPS.
*   `Content-Security-Policy`: Mitigates XSS and related injection attacks by restricting resource origins.
*   `X-Frame-Options`: Prevents clickjacking.
*   `X-Content-Type-Options`: Prevents content sniffing vulnerabilities.
*   `Referrer-Policy` / `Permissions-Policy`: Provide additional defense-in-depth.

---

## Final Action Items & Review Notes for Implementer (e.g., Claude 3.7 Sonnet)

**Objective:** Guide the implementation of the security fixes outlined above.

1.  **Implement Server Action Auth/Authz (Highest Priority):**
    *   **Tooling:** Use `import { auth } from "@clerk/nextjs/server";`.
    *   **Authentication:** Add `const { userId } = auth(); if (!userId) { throw new Error("Authentication Required"); }` at the start of *every* relevant action.
    *   **Authorization (IDOR):**
        *   **Create Actions:** Remove `userId` from input types/params. Use the `userId` from `auth()` for inserts. Generate resource IDs server-side (`crypto.randomUUID()`).
        *   **Update/Delete Actions:** Implement the **fetch-then-verify** pattern: Fetch the resource by `id`, check existence, compare `resource.userId` with `auth().userId`, throw `Error("Authorization Failed")` on mismatch *before* mutation. This pattern is critical (see `custom-types-actions.ts` for a good example). Ensure necessary `get...ById` queries exist.
        *   **Fetch-by-User Actions:** Remove `userId` param, rename function (e.g., `getCurrentUser...`), use `auth().userId` in the query.
    *   **Affected Files:** Apply systematically to `items-actions.ts`, `profiles-actions.ts`, `images-actions.ts`, `custom-franchises-actions.ts`, `custom-brands-actions.ts`, `ebay-actions.ts` (where needed, especially `refreshAll*`), etc. Review *all* files in `/actions`.
    *   **Consistency:** Use `throw new Error(...)` for auth failures in actions. Ensure frontend code calling these actions handles potential errors gracefully (e.g., using `try...catch` around action calls).

2.  **Implement Input Validation (High Priority):**
    *   **Tooling:** `npm install zod`. Create schemas, potentially in `/lib/schemas/` or similar.
    *   **Implementation:** In each action accepting input (`FormData` or objects), use `YourSchema.safeParse(inputData)` *immediately* after auth checks. Check `validationResult.success`. If false, return a user-friendly error object (e.g., `{ isSuccess: false, error: "Invalid input", issues: validationResult.error.flatten().fieldErrors }`). Do *not* return raw Zod errors to the client. Use the `validationResult.data` for subsequent logic.
    *   **Signatures:** You may need to change action function signatures to accept `unknown` or `FormData` before validation.
    *   **Affected Files:** Apply to `items-actions.ts`, `profiles-actions.ts`, `images-actions.ts`, `custom-*` actions, and the `/api/ebay` route handler. Review all actions/routes accepting input.

3.  **Verify/Implement Supabase RLS (High Priority - Manual Step):**
    *   **Action:** This requires **manual** review and potential SQL execution in the Supabase Dashboard (Authentication -> Policies).
    *   **Checklist:** For *every* table with user data (`items`, `profiles`, `images`, `sold_items`, `custom_brands`, `custom_franchises`, `custom_types`, `ebay_history`... check schema!), ensure RLS is ENABLED and policies exist for SELECT, INSERT, UPDATE, DELETE, restricting access to the owner (`USING (auth.uid() = user_id)`, `WITH CHECK (auth.uid() = user_id)`).
    *   **Note:** The `user_id` column name in the example SQL must match your actual schema. Test policies thoroughly after creation.

4.  **Implement API Route Rate Limiting (`/api/ebay`) (Medium Priority):**
    *   **File:** `app/api/ebay/route.ts`.
    *   **Recommendation:** Use `@upstash/ratelimit` with Vercel KV (`@vercel/kv`) for IP-based limiting. Add the check early in the `GET` handler. Adjust limits (e.g., `slidingWindow(10, '60 s')`) based on expected load and eBay API limits. See example code in the plan.

5.  **Fix Stripe Payment Link `client_reference_id` (Medium Priority):**
    *   **File:** `app/(marketing)/pricing/page.tsx`.
    *   **Action:** Make it a Client Component (`"use client";`). Use `useUser` hook from Clerk to get `userId`. Construct the `buttonLink` dynamically, appending `?client_reference_id=${encodeURIComponent(userId)}`. Handle the case where `userId` is null (user not logged in).

6.  **Address Custom Brands Scope (Decision Needed):**
    *   **File:** `actions/custom-brands-actions.ts`.
    *   **Decision Required:** Are Custom Brands global or user-specific?
    *   **Implementation:** Based on the decision, either:
        *   (User-Specific): Add `userId` filtering to `getCustomBrandsAction`, implement IDOR checks for update/delete.
        *   (Global): Remove `userId` from `createCustomBrand`, add Admin Role checks (using Clerk `sessionClaims`) for create/update/delete.

7.  **Complete User Data Deletion (Medium Priority):**
    *   **File:** `actions/delete-user-data.ts`.
    *   **Action:** Review the full schema (`/db/schema/*.ts`). Identify *all* tables with user-specific data not currently handled (`profiles`, `images`?, `sold_items`?, `ebay_history`?). Add `tx.delete(...).where(eq(table.userId, userId))` statements for these tables within the transaction. Verify if `ON DELETE CASCADE` is used for related data (like images) which might simplify this.

8.  **Implement HTTP Response Security Headers (Medium Priority):**
    *   **File:** `next.config.mjs`.
    *   **Action:** Use the `headers()` async function to return an array defining headers like `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Content-Security-Policy`.
    *   **CSP:** Start with the basic policy provided in the plan, test *thoroughly*, and adjust directives (`script-src`, `style-src`, etc.) to allow necessary external resources (Clerk, Stripe, Supabase, etc.). Use browser dev tools console to debug.

9.  **Minor Fixes/Cleanup:**
    *   Restrict Image Hostnames: Edit `remotePatterns` in `next.config.mjs` as planned.
    *   Consistency: Change `currentUser()` to `auth()` in `custom-brands-actions.ts`.
    *   Remove `CRON_SECRET_KEY` from `.env.local` and `.gitignore` (if present) as the cron job was removed.

---
