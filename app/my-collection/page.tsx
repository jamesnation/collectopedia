import { getProfileByUserId } from "@/db/queries/profiles-queries";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CatalogPageWrapper } from "@/components/catalog-page-wrapper";

export default async function MyCollectionPage() {
  const { userId } = auth();
  console.log("Collection Page - User ID:", userId);

  if (!userId) {
    console.log("No user ID found, redirecting to login");
    return redirect("/login");
  }

  const profile = await getProfileByUserId(userId);
  console.log("User profile:", profile);

  if (!profile) {
    console.log("No profile found, redirecting to signup");
    return redirect("/signup");
  }

  if (profile.membership === "free") {
    console.log("Free membership detected, redirecting to pricing");
    return redirect("/pricing");
  }

  console.log("Access granted to collection page");
  return <CatalogPageWrapper />;
} 