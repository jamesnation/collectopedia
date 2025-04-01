'use server';

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createCustomBrand, getCustomBrands, getCustomBrandById, updateCustomBrand, deleteCustomBrand } from "@/db/queries/custom-brands-queries";
import crypto from 'crypto';
import { CreateCustomBrandSchema, UpdateCustomBrandWithIdSchema } from "@/lib/schemas/custom-brand-schemas"; // Import Zod schemas

console.log('Server Action Module Initialization');

// Define ActionResult type with validation errors
type ActionResult<T> = {
  isSuccess: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string[]>;
};

export async function getCustomBrandsAction() {
  console.log('getCustomBrandsAction - Start', { environment: typeof window === 'undefined' ? 'server' : 'client' });
  try {
    // Get authenticated userId from Clerk session
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Authentication Required: User not logged in." };
    }

    // Get only brands for the current user
    const brands = await getCustomBrands(userId);
    return { isSuccess: true, data: brands };
  } catch (error) {
    console.error("Error getting custom brands:", error);
    return { isSuccess: false, error: "Failed to get custom brands" };
  }
}

export async function createCustomBrandAction(data: unknown): Promise<ActionResult<any>> {
  try {
    // Get authenticated userId from Clerk session
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Authentication Required: User not logged in." };
    }

    // Validate input data with Zod
    const validationResult = CreateCustomBrandSchema.safeParse(data);
    
    // If validation fails, return detailed error information
    if (!validationResult.success) {
      console.error('❌ Validation failed:', validationResult.error);
      return { 
        isSuccess: false, 
        error: "Invalid input data", 
        validationErrors: validationResult.error.formErrors.fieldErrors
      };
    }
    
    // Extract validated data
    const validatedData = validationResult.data;

    const brand = await createCustomBrand({
      id: crypto.randomUUID(),
      userId,
      ...validatedData,
    });

    revalidatePath("/");
    return { isSuccess: true, data: brand };
  } catch (error) {
    console.error("Error creating custom brand:", error);
    return { isSuccess: false, error: "Failed to create custom brand" };
  }
}

export async function updateCustomBrandAction(data: unknown): Promise<ActionResult<any>> {
  try {
    // Get authenticated userId from Clerk session
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Authentication Required: User not logged in." };
    }

    // Validate input data with Zod
    const validationResult = UpdateCustomBrandWithIdSchema.safeParse(data);
    
    // If validation fails, return detailed error information
    if (!validationResult.success) {
      console.error('❌ Validation failed:', validationResult.error);
      return { 
        isSuccess: false, 
        error: "Invalid input data", 
        validationErrors: validationResult.error.formErrors.fieldErrors
      };
    }
    
    // Extract validated data
    const validatedData = validationResult.data;

    // Fetch the brand to verify ownership
    const brand = await getCustomBrandById(validatedData.id);
    
    // If no brand is found, return an error
    if (!brand) {
      return { isSuccess: false, error: "Custom brand not found" };
    }
    
    // Verify the brand belongs to the authenticated user
    if (brand.userId !== userId) {
      return { isSuccess: false, error: "Authorization Failed: You don't have permission to update this custom brand." };
    }

    const updatedBrand = await updateCustomBrand(validatedData.id, {
      name: validatedData.name,
      description: validatedData.description,
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
    // Validate id format
    if (!id || typeof id !== 'string') {
      return { isSuccess: false, error: "Invalid brand ID" };
    }
    
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
    
    // Validate using Zod schema
    const validationResult = CreateCustomBrandSchema.safeParse({ name, description });
    
    // If validation fails, return detailed error information
    if (!validationResult.success) {
      console.error('❌ Validation failed:', validationResult.error);
      return { 
        isSuccess: false, 
        error: "Invalid input data", 
        validationErrors: validationResult.error.formErrors.fieldErrors
      };
    }
    
    // Extract validated data
    const validatedData = validationResult.data;
    
    // Create the brand
    const brand = await createCustomBrand({
      id: crypto.randomUUID(),
      userId,
      ...validatedData,
    });

    revalidatePath("/");
    return { isSuccess: true, data: brand };
  } catch (error) {
    console.error("Error creating custom brand from form:", error);
    return { isSuccess: false, error: "Failed to create custom brand" };
  }
} 