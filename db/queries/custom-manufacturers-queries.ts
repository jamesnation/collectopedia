import { db } from "@/db/db";
import { customManufacturersTable, InsertCustomManufacturer } from "@/db/schema/custom-manufacturers-schema";
import { eq } from "drizzle-orm";

export async function createCustomManufacturer(data: InsertCustomManufacturer) {
  const [manufacturer] = await db
    .insert(customManufacturersTable)
    .values(data)
    .returning();
  return manufacturer;
}

export async function getCustomManufacturers() {
  const manufacturers = await db
    .select()
    .from(customManufacturersTable)
    .orderBy(customManufacturersTable.name);
  return manufacturers;
}

export async function updateCustomManufacturer(id: string, data: Partial<InsertCustomManufacturer>) {
  const [manufacturer] = await db
    .update(customManufacturersTable)
    .set(data)
    .where(eq(customManufacturersTable.id, id))
    .returning();
  return manufacturer;
}

export async function deleteCustomManufacturer(id: string) {
  await db
    .delete(customManufacturersTable)
    .where(eq(customManufacturersTable.id, id));
} 