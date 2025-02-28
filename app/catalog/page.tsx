import { Suspense } from 'react';
import Catalog from '@/components/catalog';
import { getItemsByUserIdAction } from '@/actions/items-actions';
import { getCustomTypesAction } from '@/actions/custom-types-actions';
import { getCustomFranchisesAction } from '@/actions/custom-franchises-actions';
import { getCustomBrandsAction } from '@/actions/custom-brands-actions';
import { auth } from "@clerk/nextjs/server";

export default async function CatalogPage() {
  // Get the current user ID from the auth sessions
  const { userId } = auth();
  
  // Fetch the initial data
  const itemsResult = await getItemsByUserIdAction(userId as string);
  const typesResult = await getCustomTypesAction();
  const franchisesResult = await getCustomFranchisesAction();
  const brandsResult = await getCustomBrandsAction();

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