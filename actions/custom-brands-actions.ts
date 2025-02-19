"use server";

import { createCustomBrand, getCustomBrandsByUserId, deleteCustomBrand, updateCustomBrand } from "@/db/queries/custom-brands-queries";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getCustomBrandsAction() {
  try {
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Not authenticated" };
    }

    const customBrands = await getCustomBrandsByUserId(userId);
    return { isSuccess: true, data: customBrands };
  } catch (error) {
    console.error("Error getting custom brands:", error);
    return { isSuccess: false, error: "Failed to get custom brands" };
  }
}

export async function createCustomBrandAction(data: { name: string; description?: string }) {
  try {
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Not authenticated" };
    }

    const customBrand = await createCustomBrand({
      id: crypto.randomUUID(),
      userId,
      ...data,
    });

    revalidatePath("/");
    return { isSuccess: true, data: customBrand };
  } catch (error) {
    console.error("Error creating custom brand:", error);
    return { isSuccess: false, error: "Failed to create custom brand" };
  }
}

export async function updateCustomBrandAction(data: { id: string; name: string; description?: string }) {
  try {
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Not authenticated" };
    }

    const updatedBrand = await updateCustomBrand(data.id, {
      name: data.name,
      description: data.description,
    });

    revalidatePath("/");
    return { isSuccess: true, data: updatedBrand };
  } catch (error) {
    console.error("Error updating custom brand:", error);
    return { isSuccess: false, error: "Failed to update custom brand" };
  }
}

export async function deleteCustomBrandAction(id: string) {
  try {
    const { userId } = auth();
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