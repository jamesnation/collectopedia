import { getCustomManufacturersAction } from "@/actions/custom-manufacturers-actions";
import { getCustomTypesAction } from "@/actions/custom-types-actions";
import { getCustomBrandsAction } from "@/actions/custom-brands-actions";
import { getItemsByUserIdAction } from "@/actions/items-actions";
import CatalogPage from "@/components/catalog-page";
import { auth } from "@clerk/nextjs/server";

export default async function CollectionPage() {
  const { userId } = auth();
  
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