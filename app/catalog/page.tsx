import { Suspense } from 'react';
import Catalog from '@/components/catalog';
import { getItemsByUserIdAction } from '@/actions/items-actions';
import { getCustomAttributesAction } from "@/actions/custom-attribute-actions";
import { auth } from "@clerk/nextjs/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  // Get the current user ID from the auth sessions
  const { userId } = auth();
  
  // If no user ID, handle appropriately (e.g., show login prompt or empty state)
  // This depends on whether the catalog page is public or requires login
  if (!userId) {
    // Example: Return an empty catalog or a message
    // return <Catalog initialItems={[]} initialTypes={[]} initialFranchises={[]} initialBrands={[]} />;
    // Or redirect to login if required:
    // import { redirect } from 'next/navigation';
    // return redirect('/login'); 
    console.warn("CatalogPage: No user ID found, fetching may fail or be empty.");
    // For now, let it proceed, but actions might return unauthorized
  }
  
  // Fetch the initial data in parallel
  const [itemsResult, typesResult, franchisesResult, brandsResult] = await Promise.all([
    // Pass userId only if it exists, otherwise actions should handle unauthorized
    getItemsByUserIdAction(userId || ''), 
    getCustomAttributesAction('type'),      // Use generic action
    getCustomAttributesAction('franchise'),  // Use generic action
    getCustomAttributesAction('brand')       // Use generic action
  ]);

  // Ensure we always pass arrays, even if the fetch fails or returns an error
  const initialItems = itemsResult?.isSuccess && itemsResult.data ? itemsResult.data : [];
  const initialTypes = typesResult?.isSuccess && typesResult.data ? typesResult.data : [];
  const initialFranchises = franchisesResult?.isSuccess && franchisesResult.data ? franchisesResult.data : [];
  const initialBrands = brandsResult?.isSuccess && brandsResult.data ? brandsResult.data : [];

  // Optional: Log if any data fetching failed
  if (!itemsResult?.isSuccess || !typesResult?.isSuccess || !franchisesResult?.isSuccess || !brandsResult?.isSuccess) {
      console.error("CatalogPage: Failed to fetch some initial data", {
          itemsError: itemsResult?.error,
          typesError: typesResult?.error,
          franchisesError: franchisesResult?.error,
          brandsError: brandsResult?.error
      });
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Catalog 
        initialItems={initialItems}
        initialTypes={initialTypes}
        initialFranchises={initialFranchises}
        initialBrands={initialBrands}
      />
    </Suspense>
  );
} 