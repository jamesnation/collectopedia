"use server";

import { revalidatePath } from "next/cache";
import { getItemsByUserId, getItemById, insertItem, updateItem, deleteItem } from "@/db/queries/items-queries";
import { itemsTable, SelectItem } from "@/db/schema/items-schema";
import { imagesTable } from "@/db/schema/images-schema"; // Add this line
import { eq, ne, and, or, asc } from 'drizzle-orm';
import { db } from '@/db/db'; // Updated import
import { itemTypeEnum, franchiseEnum } from "@/db/schema/items-schema";
import crypto from 'crypto'; // Added import for crypto

// Define ActionResult type
type ActionResult<T> = {
  isSuccess: boolean;
  data?: T;
  error?: string;
};

// Cache store to avoid redundant fetches during a request
const itemsCache = new Map<string, { items: SelectItem[], timestamp: number }>();
const CACHE_EXPIRY_MS = 30 * 1000; // 30 seconds cache

export const getItemsByUserIdAction = async (userId: string): Promise<ActionResult<SelectItem[]>> => {
  try {
    // Check cache first
    const cacheKey = `items-${userId}`;
    const now = Date.now();
    const cachedData = itemsCache.get(cacheKey);
    
    // Return cached data if it's still fresh
    if (cachedData && (now - cachedData.timestamp < CACHE_EXPIRY_MS)) {
      return { isSuccess: true, data: cachedData.items };
    }
    
    // Fetch fresh data
    const items = await getItemsByUserId(userId);
    
    // Update cache with new data
    itemsCache.set(cacheKey, { items, timestamp: now });
    
    return { isSuccess: true, data: items };
  } catch (error) {
    // Only log errors in development
    if (process.env.NODE_ENV !== 'production') {
      console.error("Failed to get items:", error);
    }
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

/**
 * Get items due for eBay value updates.
 * Returns items sorted by last updated time, oldest first.
 */
export const getItemsDueForUpdateAction = async (): Promise<ActionResult<any[]>> => {
  try {
    // Implement database query 
    // This is just a placeholder, you'll need to adapt this to your actual schema
    const items = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.isSold, false))
      .orderBy(asc(itemsTable.updatedAt)); // Assuming your schema has updatedAt field

    return { isSuccess: true, data: items };
  } catch (error) {
    console.error('Error getting items due for update:', error);
    return { isSuccess: false, error: 'Failed to get items due for update' };
  }
};

/**
 * Check which items have been updated since they were last cached
 * This allows the client to know which items need to have their images refreshed
 */
export const checkItemsImageUpdatesAction = async (
  itemIds: string[], 
  cachedTimestamps: Record<string, number>
): Promise<ActionResult<string[]>> => {
  try {
    if (!itemIds.length) {
      // Don't log empty calls
      return { isSuccess: true, data: [] };
    }
    
    // Only log when checking a small number of items or in development
    if (itemIds.length < 10 || process.env.NODE_ENV === 'development') {
      console.log(`[CHECK-UPDATES] Checking updates for ${itemIds.length} items`);
    }
    
    // Query all items to check their imagesUpdatedAt timestamps
    // Instead of complex filtering in the query, we'll get the items and filter in JS
    // This is simpler and avoids potential type issues with drizzle-orm
    const items = await db.select({
      id: itemsTable.id,
      imagesUpdatedAt: itemsTable.imagesUpdatedAt
    })
    .from(itemsTable)
    .where(
      or(...itemIds.map(id => eq(itemsTable.id, id)))
    );
    
    // Only log null warnings in development
    if (process.env.NODE_ENV === 'development') {
      // Check for any items with null timestamps
      const nullTimestamps = items.filter(item => !item.imagesUpdatedAt);
      if (nullTimestamps.length > 0) {
        console.log(`[CHECK-UPDATES] Warning: ${nullTimestamps.length} items have null timestamps`);
        // Only log first 3 examples max
        nullTimestamps.slice(0, 3).forEach(item => console.log(`- Item ${item.id}`));
      }
    }
    
    // Find items that have been updated since they were cached
    const updatedItemIds = items
      .filter(item => {
        // Skip items with no imagesUpdatedAt timestamp
        if (!item.imagesUpdatedAt) {
          return false;
        }
        
        // Get the timestamp when this item was cached
        const cachedAt = cachedTimestamps[item.id];
        if (!cachedAt) {
          return false;
        }
        
        // Convert database timestamp to milliseconds for comparison
        const dbTimestamp = new Date(item.imagesUpdatedAt).getTime();
        
        // Item needs update if the database timestamp is newer than when it was cached
        const needsUpdate = dbTimestamp > cachedAt;
        
        // Only log when there are actual updates to report
        if (needsUpdate && process.env.NODE_ENV === 'development') {
          console.log(`[CHECK-UPDATES] Item ${item.id} needs update: DB:${new Date(dbTimestamp).toISOString().split('T')[1].split('.')[0]} > Cache:${new Date(cachedAt).toISOString().split('T')[1].split('.')[0]}`);
        }
        
        return needsUpdate;
      })
      .map(item => item.id);
    
    // Only log if there are items that need updates
    if (updatedItemIds.length > 0) {
      console.log(`[CHECK-UPDATES] Found ${updatedItemIds.length} items with newer images than cache`);
    }
    
    return { isSuccess: true, data: updatedItemIds };
  } catch (error) {
    console.error("Failed to check for image updates:", error);
    return { isSuccess: false, error: "Failed to check for image updates", data: [] };
  }
};

/**
 * Update the imagesUpdatedAt field for all items in the database
 * This ensures that all existing items have this field set
 */
export const updateAllItemsImagesTimestampAction = async (): Promise<ActionResult<number>> => {
  try {
    // Using a simpler approach: get all items and filter them in JS
    // This avoids the type issues with the Drizzle query
    const allItems = await db.select({
      id: itemsTable.id,
      imagesUpdatedAt: itemsTable.imagesUpdatedAt
    })
    .from(itemsTable);
    
    // Find items with null imagesUpdatedAt
    const itemsToUpdate = allItems.filter(item => item.imagesUpdatedAt === null || item.imagesUpdatedAt === undefined);
    
    // Only log if there are items to update or in development mode
    if (itemsToUpdate.length > 0 || process.env.NODE_ENV === 'development') {
      console.log(`Found ${itemsToUpdate.length} items with null imagesUpdatedAt`);
    }
    
    // Update each item one by one
    let updatedCount = 0;
    for (const item of itemsToUpdate) {
      try {
        await updateItem(item.id, { imagesUpdatedAt: new Date() });
        updatedCount++;
      } catch (err) {
        console.error(`Error updating item ${item.id}:`, err);
      }
    }
    
    // Only log if there were actually items updated or in development mode
    if (updatedCount > 0 || process.env.NODE_ENV === 'development') {
      console.log(`Successfully updated ${updatedCount} items with imagesUpdatedAt timestamp`);
    }
    
    return { isSuccess: true, data: updatedCount };
  } catch (error) {
    console.error("Failed to update items timestamps:", error);
    return { isSuccess: false, error: "Failed to update items timestamps", data: 0 };
  }
};