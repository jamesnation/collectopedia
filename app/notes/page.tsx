import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProfileByUserId } from "@/db/queries/profiles-queries";
import { getCustomBrandsAction } from "@/actions/custom-brands-actions";
import { getCustomTypesAction } from "@/actions/custom-types-actions";
import { getCustomFranchisesAction } from "@/actions/custom-franchises-actions";
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
    brandsResult,
    typesResult,
    franchisesResult,
    itemsResult
  ] = await Promise.all([
    getCustomBrandsAction(),
    getCustomTypesAction(),
    getCustomFranchisesAction(),
    getItemsByUserIdAction(userId)
  ]);

  console.log('NotesPage - Data Fetching Complete', {
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


