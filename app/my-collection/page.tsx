import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProfileByUserId } from "@/db/queries/profiles-queries";
import { getCustomAttributesAction } from "@/actions/custom-attribute-actions";
import { getItemsByUserIdAction } from "@/actions/items-actions";
import CatalogPage from "@/components/catalog-page";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export default async function CollectionPage() {
  const { userId } = auth();
  
  if (!userId) {
    return redirect("/login");
  }

  const profile = await getProfileByUserId(userId);
  
  if (!profile) {
    return redirect("/onboarding");
  }

  if (profile.membership === "free") {
    return redirect("/pricing");
  }
  
  // Fetch initial data on the server in parallel
  const [
    brandsResult,
    typesResult,
    franchisesResult,
    itemsResult
  ] = await Promise.all([
    getCustomAttributesAction('brand'),
    getCustomAttributesAction('type'),
    getCustomAttributesAction('franchise'),
    getItemsByUserIdAction(userId)
  ]);

  // Handle potential errors (optional but recommended)
  if (!brandsResult.isSuccess || !typesResult.isSuccess || !franchisesResult.isSuccess || !itemsResult.isSuccess) {
    // Log the errors or show an error page
    console.error("Failed to fetch initial collection data:", {
      brandsError: brandsResult.error,
      typesError: typesResult.error,
      franchisesError: franchisesResult.error,
      itemsError: itemsResult.error
    });
    // Consider returning an error component or message
    // return <div>Error loading collection data. Please try again later.</div>;
  }

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