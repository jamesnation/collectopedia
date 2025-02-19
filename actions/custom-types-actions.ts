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

type ActionResult<T> = {
  isSuccess: boolean;
  data?: T;
  error?: string;
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
    const description = formData.get("description") as string;

    if (!name) {
      return { isSuccess: false, error: "Name is required" };
    }

    await createCustomType(userId, name, description);
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
    const description = formData.get("description") as string;

    if (!id || !name) {
      return { isSuccess: false, error: "ID and name are required" };
    }

    const existingType = await getCustomTypeById(id);
    if (!existingType || existingType.userId !== userId) {
      return { isSuccess: false, error: "Type not found or unauthorized" };
    }

    await updateCustomType(id, name, description);
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
    if (!id) {
      return { isSuccess: false, error: "ID is required" };
    }

    const existingType = await getCustomTypeById(id);
    if (!existingType || existingType.userId !== userId) {
      return { isSuccess: false, error: "Type not found or unauthorized" };
    }

    await deleteCustomType(id);
    revalidatePath("/");
    return { isSuccess: true };
  } catch (error) {
    console.error("Failed to delete custom type:", error);
    return { isSuccess: false, error: "Failed to delete custom type" };
  }
} 