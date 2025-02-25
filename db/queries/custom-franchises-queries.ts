import { db } from "@/db/db";
import { customFranchisesTable } from "@/db/schema/custom-franchises-schema";
import { eq } from "drizzle-orm";

export async function getCustomFranchisesByUserId(userId: string) {
  return await db
    .select()
    .from(customFranchisesTable)
    .where(eq(customFranchisesTable.userId, userId));
}

export async function createCustomFranchise(data: {
  id: string;
  userId: string;
  name: string;
  description?: string;
}) {
  const [newFranchise] = await db
    .insert(customFranchisesTable)
    .values(data)
    .returning();
  return newFranchise;
}

export async function updateCustomFranchise(
  id: string,
  data: { name: string; description?: string }
) {
  const [updatedFranchise] = await db
    .update(customFranchisesTable)
    .set(data)
    .where(eq(customFranchisesTable.id, id))
    .returning();
  return updatedFranchise;
}

export async function deleteCustomFranchise(id: string) {
  await db
    .delete(customFranchisesTable)
    .where(eq(customFranchisesTable.id, id));
}
