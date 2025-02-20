import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProfileByUserId } from "@/db/queries/profiles-queries";
import { getCustomManufacturersAction } from "@/actions/custom-manufacturers-actions";
import { getCustomTypesAction } from "@/actions/custom-types-actions";
import { getCustomBrandsAction } from "@/actions/custom-brands-actions";
import { getItemsByUserIdAction } from "@/actions/items-actions";
import CatalogPage from "@/components/catalog-page";

export default async function NotesPage() {
  console.log('NotesPage - Server Component Initialization');

  const { userId } = auth();
  console.log('NotesPage - Auth Check', { hasUserId: !!userId });

  if (!userId) {
    console.log('NotesPage - No userId, redirecting to login');
    return redirect("/login");
  }

  const profile = await getProfileByUserId(userId);
  console.log('NotesPage - Profile Check', { hasProfile: !!profile });

  if (!profile) {
    console.log('NotesPage - No profile, redirecting to signup');
    return redirect("/signup");
  }

  if (profile.membership === "free") {
    console.log('NotesPage - Free membership, redirecting to pricing');
    return redirect("/pricing");
  }
  
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
    getItemsByUserIdAction(userId)
  ]);

  console.log('NotesPage - Data Fetching Complete', {
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


