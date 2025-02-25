import { Suspense } from 'react';
import Catalog from '@/components/catalog';
import { getItemsByUserIdAction } from '@/actions/items-actions';
import { getCustomTypesAction } from '@/actions/custom-types-actions';
import { getCustomBrandsAction } from '@/actions/custom-brands-actions';
import { getCustomManufacturersAction } from '@/actions/custom-manufacturers-actions';
import { auth } from "@clerk/nextjs/server";

export default async function CatalogPage() {
  // Get the current user ID from the auth session
  const { userId } = auth();
  
  // Fetch initial data
  const itemsResult = await getItemsByUserIdAction(userId as string);
  const typesResult = await getCustomTypesAction();
  const brandsResult = await getCustomBrandsAction();
  const manufacturersResult = await getCustomManufacturersAction();

  // Ensure we always pass arrays, even if the fetch fails
  const initialItems = itemsResult.isSuccess && itemsResult.data ? itemsResult.data : [];
  const initialTypes = typesResult.isSuccess && typesResult.data ? typesResult.data : [];
  const initialBrands = brandsResult.isSuccess && brandsResult.data ? brandsResult.data : [];
  const initialManufacturers = manufacturersResult.isSuccess && manufacturersResult.data ? manufacturersResult.data : [];

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Catalog 
        initialItems={initialItems}
        initialTypes={initialTypes}
        initialBrands={initialBrands}
        initialManufacturers={initialManufacturers}
      />
    </Suspense>
  );
} 