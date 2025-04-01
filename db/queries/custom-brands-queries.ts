import { db } from "@/db/db";
import { customBrandsTable, InsertCustomBrand } from "@/db/schema/custom-brands-schema";
import { eq } from "drizzle-orm";

export async function createCustomBrand(data: InsertCustomBrand) {
  const [brand] = await db
    .insert(customBrandsTable)
    .values(data)
    .returning();
  return brand;
}

// The global getCustomBrands() function is removed for security

// Renamed from getCustomBrandsByUserId to getCustomBrands to make it the primary function
export async function getCustomBrands(userId: string) {
  const brands = await db
    .select()
    .from(customBrandsTable)
    .where(eq(customBrandsTable.userId, userId))
    .orderBy(customBrandsTable.name);
  return brands;
}

export async function getCustomBrandById(id: string) {
  const brands = await db
    .select()
    .from(customBrandsTable)
    .where(eq(customBrandsTable.id, id));
  return brands[0] || null;
}

export async function updateCustomBrand(id: string, data: Partial<InsertCustomBrand>) {
  const [brand] = await db
    .update(customBrandsTable)
    .set(data)
    .where(eq(customBrandsTable.id, id))
    .returning();
  return brand;
}

export async function deleteCustomBrand(id: string) {
  await db
    .delete(customBrandsTable)
    .where(eq(customBrandsTable.id, id));
} 