'use server';

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createCustomBrand, getCustomBrands, updateCustomBrand, deleteCustomBrand } from "@/db/queries/custom-brands-queries";

console.log('Server Action Module Initialization');

export async function getCustomBrandsAction() {
  console.log('getCustomBrandsAction - Start', { environment: typeof window === 'undefined' ? 'server' : 'client' });
  try {
    const user = await currentUser();
    console.log('getCustomBrandsAction - User Retrieved', { hasUser: !!user });
    const userId = user?.id;
    if (!userId) {
      return { isSuccess: false, error: "Not authenticated" };
    }

    const brands = await getCustomBrands();
    return { isSuccess: true, data: brands };
  } catch (error) {
    console.error("Error getting custom brands:", error);
    return { isSuccess: false, error: "Failed to get custom brands" };
  }
}

export async function createCustomBrandAction(data: { name: string; description?: string }) {
  try {
    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { isSuccess: false, error: "Not authenticated" };
    }

    const brand = await createCustomBrand({
      id: crypto.randomUUID(),
      userId,
      ...data,
    });

    revalidatePath("/");
    return { isSuccess: true, data: brand };
  } catch (error) {
    console.error("Error creating custom brand:", error);
    return { isSuccess: false, error: "Failed to create custom brand" };
  }
}

export async function updateCustomBrandAction(data: { id: string; name: string; description?: string }) {
  try {
    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { isSuccess: false, error: "Not authenticated" };
    }

    const brand = await updateCustomBrand(data.id, {
      name: data.name,
      description: data.description,
    });

    revalidatePath("/");
    return { isSuccess: true, data: brand };
  } catch (error) {
    console.error("Error updating custom brand:", error);
    return { isSuccess: false, error: "Failed to update custom brand" };
  }
}

export async function deleteCustomBrandAction(id: string) {
  try {
    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { isSuccess: false, error: "Not authenticated" };
    }

    await deleteCustomBrand(id);
    revalidatePath("/");
    return { isSuccess: true };
  } catch (error) {
    console.error("Error deleting custom brand:", error);
    return { isSuccess: false, error: "Failed to delete custom brand" };
  }
} 