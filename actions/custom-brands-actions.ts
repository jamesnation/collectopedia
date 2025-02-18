"use server";

import { createCustomBrand, getCustomBrandsByUserId } from "@/db/queries/custom-brands-queries";
import { auth } from "@clerk/nextjs/server";

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

    return { isSuccess: true, data: customBrand };
  } catch (error) {
    console.error("Error creating custom brand:", error);
    return { isSuccess: false, error: "Failed to create custom brand" };
  }
} 