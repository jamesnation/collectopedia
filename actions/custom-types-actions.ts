"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  createCustomType,
  deleteCustomType,
  getCustomTypeById,
  updateCustomType,
  getCustomTypesByUserId
} from "@/db/queries/custom-types-queries";
import { SelectCustomType } from "@/db/schema";
import { CreateCustomTypeSchema, UpdateCustomTypeWithIdSchema } from "@/lib/schemas/custom-type-schemas";
import { z } from "zod";

const DeleteCustomTypeSchema = z.object({
  id: z.string().uuid("Invalid type ID format")
});

type ActionResult<T> = {
  isSuccess: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string[]>;
};

export async function getCustomTypesAction(): Promise<ActionResult<SelectCustomType[]>> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Unauthorized" };
    }

    const types = await getCustomTypesByUserId(userId);
    console.log('Server Action - getCustomTypesAction:', {
      userId,
      typesCount: types.length
    });
    return { isSuccess: true, data: types };
  } catch (error) {
    console.error("Failed to get custom types:", error);
    return { isSuccess: false, error: "Failed to get custom types" };
  }
}

export async function createCustomTypeAction(formData: FormData): Promise<ActionResult<void>> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Unauthorized" };
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;

    const validationResult = CreateCustomTypeSchema.safeParse({ name, description });
    
    if (!validationResult.success) {
      console.error('❌ Validation failed:', validationResult.error);
      return { 
        isSuccess: false, 
        error: "Invalid input data", 
        validationErrors: validationResult.error.formErrors.fieldErrors
      };
    }
    
    const validatedData = validationResult.data;

    await createCustomType(userId, validatedData.name, validatedData.description || undefined);
    revalidatePath("/");
    return { isSuccess: true };
  } catch (error) {
    console.error("Failed to create custom type:", error);
    return { isSuccess: false, error: "Failed to create custom type" };
  }
}

export async function updateCustomTypeAction(formData: FormData): Promise<ActionResult<void>> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Unauthorized" };
    }

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;

    const validationResult = UpdateCustomTypeWithIdSchema.safeParse({ id, name, description });
    
    if (!validationResult.success) {
      console.error('❌ Validation failed:', validationResult.error);
      return { 
        isSuccess: false, 
        error: "Invalid input data", 
        validationErrors: validationResult.error.formErrors.fieldErrors
      };
    }
    
    const validatedData = validationResult.data;

    const existingType = await getCustomTypeById(validatedData.id);
    if (!existingType || existingType.userId !== userId) {
      return { isSuccess: false, error: "Type not found or unauthorized" };
    }

    await updateCustomType(validatedData.id, validatedData.name as string, validatedData.description || undefined);
    revalidatePath("/");
    return { isSuccess: true };
  } catch (error) {
    console.error("Failed to update custom type:", error);
    return { isSuccess: false, error: "Failed to update custom type" };
  }
}

export async function deleteCustomTypeAction(formData: FormData): Promise<ActionResult<void>> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Unauthorized" };
    }

    const id = formData.get("id") as string;
    
    const validationResult = DeleteCustomTypeSchema.safeParse({ id });
    
    if (!validationResult.success) {
      console.error('❌ Validation failed:', validationResult.error);
      return { 
        isSuccess: false, 
        error: "Invalid input data", 
        validationErrors: validationResult.error.formErrors.fieldErrors
      };
    }
    
    const validatedData = validationResult.data;

    const existingType = await getCustomTypeById(validatedData.id);
    if (!existingType || existingType.userId !== userId) {
      return { isSuccess: false, error: "Type not found or unauthorized" };
    }

    await deleteCustomType(validatedData.id);
    revalidatePath("/");
    return { isSuccess: true };
  } catch (error) {
    console.error("Failed to delete custom type:", error);
    return { isSuccess: false, error: "Failed to delete custom type" };
  }
} 