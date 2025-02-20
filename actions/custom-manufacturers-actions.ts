'use server';

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createCustomManufacturer, getCustomManufacturers, updateCustomManufacturer, deleteCustomManufacturer } from "@/db/queries/custom-manufacturers-queries";

console.log('Server Action Module Initialization');

export async function getCustomManufacturersAction() {
  console.log('getCustomManufacturersAction - Start', { environment: typeof window === 'undefined' ? 'server' : 'client' });
  try {
    const user = await currentUser();
    console.log('getCustomManufacturersAction - User Retrieved', { hasUser: !!user });
    const userId = user?.id;
    if (!userId) {
      return { isSuccess: false, error: "Not authenticated" };
    }

    const manufacturers = await getCustomManufacturers();
    return { isSuccess: true, data: manufacturers };
  } catch (error) {
    console.error("Error getting custom manufacturers:", error);
    return { isSuccess: false, error: "Failed to get custom manufacturers" };
  }
}

export async function createCustomManufacturerAction(data: { name: string; description?: string }) {
  try {
    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { isSuccess: false, error: "Not authenticated" };
    }

    const manufacturer = await createCustomManufacturer({
      id: crypto.randomUUID(),
      userId,
      ...data,
    });

    revalidatePath("/");
    return { isSuccess: true, data: manufacturer };
  } catch (error) {
    console.error("Error creating custom manufacturer:", error);
    return { isSuccess: false, error: "Failed to create custom manufacturer" };
  }
}

export async function updateCustomManufacturerAction(data: { id: string; name: string; description?: string }) {
  try {
    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { isSuccess: false, error: "Not authenticated" };
    }

    const manufacturer = await updateCustomManufacturer(data.id, {
      name: data.name,
      description: data.description,
    });

    revalidatePath("/");
    return { isSuccess: true, data: manufacturer };
  } catch (error) {
    console.error("Error updating custom manufacturer:", error);
    return { isSuccess: false, error: "Failed to update custom manufacturer" };
  }
}

export async function deleteCustomManufacturerAction(id: string) {
  try {
    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { isSuccess: false, error: "Not authenticated" };
    }

    await deleteCustomManufacturer(id);
    revalidatePath("/");
    return { isSuccess: true };
  } catch (error) {
    console.error("Error deleting custom manufacturer:", error);
    return { isSuccess: false, error: "Failed to delete custom manufacturer" };
  }
} 