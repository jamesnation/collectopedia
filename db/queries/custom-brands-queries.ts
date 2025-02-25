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

export async function getCustomBrands() {
  const brands = await db
    .select()
    .from(customBrandsTable)
    .orderBy(customBrandsTable.name);
  return brands;
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