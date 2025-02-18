import { db } from "@/db/db";
import { customBrandsTable } from "@/db/schema/custom-brands-schema";
import { eq } from "drizzle-orm";

export async function getCustomBrandsByUserId(userId: string) {
  return await db
    .select()
    .from(customBrandsTable)
    .where(eq(customBrandsTable.userId, userId));
}

export async function createCustomBrand(data: {
  id: string;
  userId: string;
  name: string;
  description?: string;
}) {
  const [newBrand] = await db
    .insert(customBrandsTable)
    .values(data)
    .returning();
  return newBrand;
}

export async function updateCustomBrand(
  id: string,
  data: { name: string; description?: string }
) {
  const [updatedBrand] = await db
    .update(customBrandsTable)
    .set(data)
    .where(eq(customBrandsTable.id, id))
    .returning();
  return updatedBrand;
}

export async function deleteCustomBrand(id: string) {
  await db
    .delete(customBrandsTable)
    .where(eq(customBrandsTable.id, id));
} 