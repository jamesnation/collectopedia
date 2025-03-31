import { auth } from "@clerk/nextjs/server";
import { getCustomBrandsAction } from "@/actions/custom-brands-actions";
import { getCustomTypesAction } from "@/actions/custom-types-actions";
import { getCustomFranchisesAction } from "@/actions/custom-franchises-actions";
import { getItemsByUserIdAction } from "@/actions/items-actions";
import CatalogPage from "@/components/catalog-page";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export default async function CollectionPage() {
  const { userId } = auth();
  
  // Fetch initial data on the server in parallel
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