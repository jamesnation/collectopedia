import { db } from "@/db/db";
import { customTypesTable, type SelectCustomType } from "@/db/schema";
import { eq } from "drizzle-orm";

export const getCustomTypesByUserId = async (userId: string): Promise<SelectCustomType[]> => {
  return await db
    .select()
    .from(customTypesTable)
    .where(eq(customTypesTable.userId, userId));
};

export const getCustomTypeById = async (id: string): Promise<SelectCustomType | undefined> => {
  const results = await db
    .select()
    .from(customTypesTable)
    .where(eq(customTypesTable.id, id))
    .limit(1);
  
  return results[0];
};

export const createCustomType = async (
  userId: string,
  name: string,
  description?: string
): Promise<SelectCustomType> => {
  const [newType] = await db
    .insert(customTypesTable)
    .values({
      id: crypto.randomUUID(),
      userId,
      name,
      description
    })
    .returning();
  
  return newType;
};

export const updateCustomType = async (
  id: string,
  name: string,
  description?: string
): Promise<SelectCustomType> => {
  const [updatedType] = await db
    .update(customTypesTable)
    .set({
      name,
      description,
      updatedAt: new Date()
    })
    .where(eq(customTypesTable.id, id))
    .returning();
  
  return updatedType;
};

export const deleteCustomType = async (id: string): Promise<void> => {
  await db
    .delete(customTypesTable)
    .where(eq(customTypesTable.id, id));
}; 