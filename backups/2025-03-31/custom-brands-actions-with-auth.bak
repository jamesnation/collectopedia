'use server';

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createCustomBrand, getCustomBrandsByUserId, getCustomBrandById, updateCustomBrand, deleteCustomBrand } from "@/db/queries/custom-brands-queries";
import crypto from 'crypto';

console.log('Server Action Module Initialization');

export async function getCustomBrandsAction() {
  console.log('getCustomBrandsAction - Start', { environment: typeof window === 'undefined' ? 'server' : 'client' });
  try {
    // Get authenticated userId from Clerk session
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Authentication Required: User not logged in." };
    }

    // Get only brands for the current user
    const brands = await getCustomBrandsByUserId(userId);
    return { isSuccess: true, data: brands };
  } catch (error) {
    console.error("Error getting custom brands:", error);
    return { isSuccess: false, error: "Failed to get custom brands" };
  }
}

export async function createCustomBrandAction(data: { name: string; description?: string }) {
  try {
    // Get authenticated userId from Clerk session
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Authentication Required: User not logged in." };
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
    // Get authenticated userId from Clerk session
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Authentication Required: User not logged in." };
    }

    // Fetch the brand to verify ownership
    const brand = await getCustomBrandById(data.id);
    
    // If no brand is found, return an error
    if (!brand) {
      return { isSuccess: false, error: "Custom brand not found" };
    }
    
    // Verify the brand belongs to the authenticated user
    if (brand.userId !== userId) {
      return { isSuccess: false, error: "Authorization Failed: You don't have permission to update this custom brand." };
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
    // Get authenticated userId from Clerk session
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Authentication Required: User not logged in." };
    }

    // Fetch the brand to verify ownership
    const brand = await getCustomBrandById(id);
    
    // If no brand is found, return an error
    if (!brand) {
      return { isSuccess: false, error: "Custom brand not found" };
    }
    
    // Verify the brand belongs to the authenticated user
    if (brand.userId !== userId) {
      return { isSuccess: false, error: "Authorization Failed: You don't have permission to delete this custom brand." };
    }

    await deleteCustomBrand(id);
    revalidatePath("/");
    return { isSuccess: true };
  } catch (error) {
    console.error("Error deleting custom brand:", error);
    return { isSuccess: false, error: "Failed to delete custom brand" };
  }
}

// Add a function to handle FormData submissions from forms
export async function createCustomBrandFromFormAction(formData: FormData) {
  try {
    // Get authenticated userId from Clerk session
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Authentication Required: User not logged in." };
    }

    // Extract data from FormData
    const name = formData.get('name') as string;
    const description = formData.get('description') as string || '';
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return { isSuccess: false, error: "Name is required" };
    }
    
    // Create the brand
    const brand = await createCustomBrand({
      id: crypto.randomUUID(),
      userId,
      name,
      description,
    });

    revalidatePath("/");
    return { isSuccess: true, data: brand };
  } catch (error) {
    console.error("Error creating custom brand from form:", error);
    return { isSuccess: false, error: "Failed to create custom brand" };
  }
} 