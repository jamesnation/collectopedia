import { auth } from "@clerk/nextjs/server";
import { getCustomBrandsAction } from "@/actions/custom-brands-actions";
import { getCustomTypesAction } from "@/actions/custom-types-actions";
import { getCustomFranchisesAction } from "@/actions/custom-franchises-actions";
import { getItemsByUserIdAction } from "@/actions/items-actions";
import CatalogPage from "@/components/catalog-page";

export default async function CollectionPage() {
  console.log('CollectionPage - Server Component Initialization');

  const { userId } = auth();
  console.log('CollectionPage - Auth Check', { hasUserId: !!userId });
  
  // Fetch initial data on the server
  const [
    brandsResult,
    typesResult,
    franchisesResult,
    itemsResult
  ] = await Promise.all([
    getCustomBrandsAction(),
    getCustomTypesAction(),
    getCustomFranchisesAction(),
    userId ? getItemsByUserIdAction(userId) : { isSuccess: false, data: [] }
  ]);

  console.log('CollectionPage - Data Fetching Complete', {
    brandsCount: brandsResult.data?.length,
    typesCount: typesResult.data?.length,
    franchisesCount: franchisesResult.data?.length,
    itemsCount: itemsResult.data?.length
  });

  // Pass the data as props to the client component
  return (
    <CatalogPage
      initialBrands={brandsResult.data || []}
      initialTypes={typesResult.data || []}
      initialFranchises={franchisesResult.data || []}
      initialItems={itemsResult.data || []}
    />
  );
} 