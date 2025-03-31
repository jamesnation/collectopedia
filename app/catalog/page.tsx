import { Suspense } from 'react';
import Catalog from '@/components/catalog';
import { getItemsByUserIdAction } from '@/actions/items-actions';
import { getCustomTypesAction } from '@/actions/custom-types-actions';
import { getCustomFranchisesAction } from '@/actions/custom-franchises-actions';
import { getCustomBrandsAction } from '@/actions/custom-brands-actions';
import { auth } from "@clerk/nextjs/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  // Get the current user ID from the auth sessions
  const { userId } = auth();
  
  // Fetch the initial data in parallel
  const [itemsResult, typesResult, franchisesResult, brandsResult] = await Promise.all([
    getItemsByUserIdAction(userId as string),
    getCustomTypesAction(),
    getCustomFranchisesAction(),
    getCustomBrandsAction()
  ]);

  // Ensure we always pass arrays, even if the fetch fails
  const initialItems = itemsResult.isSuccess && itemsResult.data ? itemsResult.data : [];
  const initialTypes = typesResult.isSuccess && typesResult.data ? typesResult.data : [];
  const initialFranchises = franchisesResult.isSuccess && franchisesResult.data ? franchisesResult.data : [];
  const initialBrands = brandsResult.isSuccess && brandsResult.data ? brandsResult.data : [];

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