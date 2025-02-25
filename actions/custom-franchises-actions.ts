"use server";

import { createCustomFranchise, getCustomFranchisesByUserId, deleteCustomFranchise, updateCustomFranchise } from "@/db/queries/custom-franchises-queries";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getCustomFranchisesAction() {
  try {
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Not authenticated" };
    }

    const customFranchises = await getCustomFranchisesByUserId(userId);
    return { isSuccess: true, data: customFranchises };
  } catch (error) {
    console.error("Error getting custom franchises:", error);
    return { isSuccess: false, error: "Failed to get custom franchises" };
  }
}

export async function createCustomFranchiseAction(data: { name: string; description?: string }) {
  try {
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Not authenticated" };
    }

    const customFranchise = await createCustomFranchise({
      id: crypto.randomUUID(),
      userId,
      name: data.name,
      description: data.description
    });

    revalidatePath("/");
    return { isSuccess: true, data: customFranchise };
  } catch (error) {
    console.error("Error creating custom franchise:", error);
    return { isSuccess: false, error: "Failed to create custom franchise" };
  }
}

export async function updateCustomFranchiseAction(data: { id: string; name: string; description?: string }) {
  try {
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Not authenticated" };
    }

    const updatedFranchise = await updateCustomFranchise(data.id, {
      name: data.name,
      description: data.description
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
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Not authenticated" };
    }

    await deleteCustomFranchise(id);
    revalidatePath("/");
    return { isSuccess: true };
  } catch (error) {
    console.error("Error deleting custom franchise:", error);
    return { isSuccess: false, error: "Failed to delete custom franchise" };
  }
}
