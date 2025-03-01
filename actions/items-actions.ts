"use server";

import { revalidatePath } from "next/cache";
import { getItemsByUserId, getItemById, insertItem, updateItem, deleteItem } from "@/db/queries/items-queries";
import { itemsTable, SelectItem } from "@/db/schema/items-schema";
import { imagesTable } from "@/db/schema/images-schema"; // Add this line
import { eq, ne, and, or } from 'drizzle-orm';
import { db } from '@/db/db'; // Updated import
import { itemTypeEnum, franchiseEnum } from "@/db/schema/items-schema";
import crypto from 'crypto'; // Added import for crypto

// Define ActionResult type
type ActionResult<T> = {
  isSuccess: boolean;
  data?: T;
  error?: string;
};

export const getItemsByUserIdAction = async (userId: string): Promise<ActionResult<SelectItem[]>> => {
  try {
    const items = await getItemsByUserId(userId);
    return { isSuccess: true, data: items };
  } catch (error) {
    console.error("Failed to get items:", error);
    return { isSuccess: false, error: "Failed to get items" };
  }
};

export const getItemByIdAction = async (id: string): Promise<ActionResult<SelectItem>> => {
  try {
    const item = await getItemById(id);
    return { isSuccess: true, data: item[0] };
  } catch (error) {
    console.error("Failed to get item:", error);
    return { isSuccess: false, error: "Failed to get item" };
  }
};

export const createItemAction = async (item: {
  id: string;
  userId: string;
  name: string;
  type: string;
  franchise: string;
  brand?: string | null;
  year?: number | null;
  acquired: Date;
  cost: number;
  value: number;
  notes: string;
  isSold: boolean;
  soldDate?: Date;
  soldPrice?: number;
  ebayListed?: number;
  ebaySold?: number;
  image?: string;
  images?: string[];
}) => {
  try {
    console.log('🚀 SERVER ACTION - Received item data for creation:', {
      id: item.id,
      name: item.name,
      userId: item.userId,
      type: item.type,
      franchise: item.franchise,
      // Log more critical fields
      acquired: item.acquired instanceof Date ? item.acquired.toISOString() : 'Not a date object',
      cost: item.cost,
      value: item.value,
      hasNotes: !!item.notes
    });

    // Remove the enum validation since we now support custom types and franchises
    const insertData = {
      ...item,
      cost: Math.round(item.cost), // Round to nearest integer
      value: Math.round(item.value), // Round to nearest integer
      soldPrice: item.soldPrice ? Math.round(item.soldPrice) : undefined,
      ebayListed: item.ebayListed ? Math.round(item.ebayListed) : undefined,
      ebaySold: item.ebaySold ? Math.round(item.ebaySold) : undefined,
      image: item.image || item.images?.[0], // Use the first image as the main image
    };

    // Diagnostic check for critically required fields
    const missingFields = [];
    if (!insertData.id) missingFields.push('id');
    if (!insertData.userId) missingFields.push('userId');
    if (!insertData.name) missingFields.push('name');
    if (!insertData.type) missingFields.push('type');
    if (!insertData.franchise) missingFields.push('franchise');
    if (!(insertData.acquired instanceof Date)) missingFields.push('acquired (not a Date object)');
    
    if (missingFields.length > 0) {
      console.error('❌ SERVER ACTION - Critical fields missing:', missingFields);
      return { 
        isSuccess: false, 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      };
    }

    console.log('🚀 SERVER ACTION - Prepared data for insertion:', {
      id: insertData.id,
      name: insertData.name,
      userId: insertData.userId,
      type: insertData.type,
      franchise: insertData.franchise,
      cost: insertData.cost,
      value: insertData.value
    });

    try {
      console.log('🚀 SERVER ACTION - Executing database insert operation...');
      const result = await db.insert(itemsTable).values(insertData).returning();
      console.log('🚀 SERVER ACTION - Database insert operation completed with result:', result);

      // Insert additional images
      if (item.images && item.images.length > 0) {
        console.log('🚀 SERVER ACTION - Inserting additional images...');
        const imageInserts = item.images.map(url => ({
          id: crypto.randomUUID(),
          itemId: result[0].id,
          userId: item.userId,
          url,
        }));
        await db.insert(imagesTable).values(imageInserts);
        console.log('🚀 SERVER ACTION - Images inserted successfully');
      }

      console.log('✅ SERVER ACTION - Item created successfully:', {
        id: result[0].id,
        name: result[0].name
      });
      return { isSuccess: true, data: result[0] };
    } catch (dbError) {
      console.error('❌ SERVER ACTION - Database operation error:', dbError);
      // Extract and log more specific database error information
      const errorDetails = {
        message: dbError instanceof Error ? dbError.message : 'No error message',
        code: (dbError as any)?.code || 'No error code',
        constraint: (dbError as any)?.constraint || 'No constraint information',
        detail: (dbError as any)?.detail || 'No detail provided',
        table: (dbError as any)?.table || 'No table information',
        column: (dbError as any)?.column || 'No column information'
      };
      console.error('❌ SERVER ACTION - Detailed database error:', errorDetails);
      throw dbError; // Re-throw to be caught by the outer catch
    }
  } catch (error: unknown) {
    console.error('❌ SERVER ACTION - Detailed error creating item:', error);
    if (error instanceof Error) {
      return { isSuccess: false, error: `Failed to create item: ${error.message}` };
    } else {
      return { isSuccess: false, error: 'Failed to create item: Unknown error' };
    }
  }
};

export const updateItemAction = async (id: string, data: Partial<SelectItem>): Promise<ActionResult<SelectItem[]>> => {
  try {
    console.log('Updating item:', id, 'with data:', JSON.stringify(data, null, 2));
    
    // Process numeric values to ensure they're properly formatted for the database
    const processedData = {
      ...data,
      cost: data.cost !== undefined ? Math.round(data.cost) : undefined,
      value: data.value !== undefined ? Math.round(data.value) : undefined,
      soldPrice: data.soldPrice !== undefined ? Math.round(Number(data.soldPrice)) : undefined,
      ebayListed: data.ebayListed !== undefined ? Math.round(Number(data.ebayListed)) : undefined,
      ebaySold: data.ebaySold !== undefined ? Math.round(Number(data.ebaySold)) : undefined,
    };
    
    console.log('Processed data for update:', JSON.stringify(processedData, null, 2));
    
    const updatedItem = await updateItem(id, processedData);
    console.log('Item updated successfully:', updatedItem);
    revalidatePath("/my-collection");
    return { isSuccess: true, data: updatedItem };
  } catch (error) {
    console.error('Error updating item:', error);
    return { isSuccess: false, error: 'Failed to update item' };
  }
};

export const deleteItemAction = async (id: string): Promise<ActionResult<void>> => {
  try {
    await deleteItem(id);
    revalidatePath("/");
    return { isSuccess: true };
  } catch (error) {
    console.error("Failed to delete item:", error);
    return { isSuccess: false, error: "Failed to delete item" };
  }
};

export const getRelatedItemsAction = async (franchise: string, currentItemId: string, isSold: boolean): Promise<ActionResult<SelectItem[]>> => {
  try {
    const relatedItems = await db.select().from(itemsTable)
      .where(
        and(
          eq(itemsTable.franchise, franchise as any), // Type assertion to avoid enum type mismatch
          ne(itemsTable.id, currentItemId),
          eq(itemsTable.isSold, isSold)
        )
      )
      .limit(3);

    return { isSuccess: true, data: relatedItems };
  } catch (error) {
    console.error("Failed to fetch related items:", error);
    return { isSuccess: false, error: "Failed to fetch related items" };
  }
};