import { auth } from "@clerk/nextjs/server";
import { getCustomManufacturersAction } from "@/actions/custom-manufacturers-actions";
import { getCustomTypesAction } from "@/actions/custom-types-actions";
import { getCustomBrandsAction } from "@/actions/custom-brands-actions";
import { getItemsByUserIdAction } from "@/actions/items-actions";
import CatalogPage from "@/components/catalog-page";

export default async function CollectionPage() {
  console.log('CollectionPage - Server Component Initialization');

  const { userId } = auth();
  console.log('CollectionPage - Auth Check', { hasUserId: !!userId });
  
  // Fetch initial data on the server
  const [
    manufacturersResult,
    typesResult,
    brandsResult,
    itemsResult
  ] = await Promise.all([
    getCustomManufacturersAction(),
    getCustomTypesAction(),
    getCustomBrandsAction(),
    userId ? getItemsByUserIdAction(userId) : { isSuccess: false, data: [] }
  ]);

  console.log('CollectionPage - Data Fetching Complete', {
    manufacturersCount: manufacturersResult.data?.length,
    typesCount: typesResult.data?.length,
    brandsCount: brandsResult.data?.length,
    itemsCount: itemsResult.data?.length
  });

  // Pass the data as props to the client component
  return (
    <CatalogPage
      initialManufacturers={manufacturersResult.data || []}
      initialTypes={typesResult.data || []}
      initialBrands={brandsResult.data || []}
      initialItems={itemsResult.data || []}
    />
  );
} 