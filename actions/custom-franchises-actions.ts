"use server";

import { createCustomFranchise, getCustomFranchisesByUserId, getCustomFranchiseById, deleteCustomFranchise, updateCustomFranchise } from "@/db/queries/custom-franchises-queries";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import crypto from 'crypto';
import { CreateCustomFranchiseSchema, UpdateCustomFranchiseWithIdSchema } from "@/lib/schemas/custom-franchise-schemas"; // Import Zod schemas

// Define ActionResult type with validation errors
type ActionResult<T> = {
  isSuccess: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string[]>;
};

export async function getCustomFranchisesAction() {
  try {
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Authentication Required: User not logged in." };
    }

    const customFranchises = await getCustomFranchisesByUserId(userId);
    return { isSuccess: true, data: customFranchises };
  } catch (error) {
    console.error("Error getting custom franchises:", error);
    return { isSuccess: false, error: "Failed to get custom franchises" };
  }
}

export async function createCustomFranchiseAction(data: unknown): Promise<ActionResult<any>> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Authentication Required: User not logged in." };
    }

    // Validate input data with Zod
    const validationResult = CreateCustomFranchiseSchema.safeParse(data);
    
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

    const customFranchise = await createCustomFranchise({
      id: crypto.randomUUID(),
      userId,
      name: validatedData.name,
      description: validatedData.description
    });

    revalidatePath("/");
    return { isSuccess: true, data: customFranchise };
  } catch (error) {
    console.error("Error creating custom franchise:", error);
    return { isSuccess: false, error: "Failed to create custom franchise" };
  }
}

export async function updateCustomFranchiseAction(data: unknown): Promise<ActionResult<any>> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Authentication Required: User not logged in." };
    }

    // Validate input data with Zod
    const validationResult = UpdateCustomFranchiseWithIdSchema.safeParse(data);
    
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
    
    // Fetch the franchise to verify ownership
    const franchise = await getCustomFranchiseById(validatedData.id);
    
    // If no franchise is found, return an error
    if (!franchise) {
      return { isSuccess: false, error: "Custom franchise not found" };
    }
    
    // Verify the franchise belongs to the authenticated user
    if (franchise.userId !== userId) {
      return { isSuccess: false, error: "Authorization Failed: You don't have permission to update this custom franchise." };
    }

    const updatedFranchise = await updateCustomFranchise(validatedData.id, {
      name: validatedData.name || '',
      description: validatedData.description
    });

    revalidatePath("/");
    return { isSuccess: true, data: updatedFranchise };
  } catch (error) {
    console.error("Error updating custom franchise:", error);
    return { isSuccess: false, error: "Failed to update custom franchise" };
  }
}

export async function deleteCustomFranchiseAction(id: string) {
  try {
    // Validate id format
    if (!id || typeof id !== 'string') {
      return { isSuccess: false, error: "Invalid franchise ID" };
    }
    
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Authentication Required: User not logged in." };
    }
    
    // Fetch the franchise to verify ownership
    const franchise = await getCustomFranchiseById(id);
    
    // If no franchise is found, return an error
    if (!franchise) {
      return { isSuccess: false, error: "Custom franchise not found" };
    }
    
    // Verify the franchise belongs to the authenticated user
    if (franchise.userId !== userId) {
      return { isSuccess: false, error: "Authorization Failed: You don't have permission to delete this custom franchise." };
    }

    await deleteCustomFranchise(id);
    revalidatePath("/");
    return { isSuccess: true };
  } catch (error) {
    console.error("Error deleting custom franchise:", error);
    return { isSuccess: false, error: "Failed to delete custom franchise" };
  }
}

// Add a function to handle FormData submissions from forms
export async function createCustomFranchiseFromFormAction(formData: FormData) {
  try {
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Authentication Required: User not logged in." };
    }

    // Extract data from FormData with proper defaults
    const name = formData.get('name') as string || '';
    const description = formData.get('description') as string | null;
    
    // Validate using Zod schema
    const validationResult = CreateCustomFranchiseSchema.safeParse({ name, description });
    
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
    
    // Create the franchise
    const franchise = await createCustomFranchise({
      id: crypto.randomUUID(),
      userId,
      name: validatedData.name,
      description: validatedData.description
    });

    revalidatePath("/");
    return { isSuccess: true, data: franchise };
  } catch (error) {
    console.error("Error creating custom franchise from form:", error);
    return { isSuccess: false, error: "Failed to create custom franchise" };
  }
}
