'use server'

import { revalidatePath } from 'next/cache'
import { db } from "@/db/db";
import { ebayHistoryTable } from "@/db/schema";
import { nanoid } from "nanoid";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

// Define ActionResult type
type ActionResult<T> = {
  isSuccess: boolean;
  data?: T;
  error?: string;
};

// Record the total eBay value for a user
export const recordEbayHistoryAction = async (totalValue: number): Promise<ActionResult<null>> => {
  try {
    // Get the current user ID from the auth sessions
    const { userId } = auth();
    
    if (!userId) {
      return { isSuccess: false, error: 'User not authenticated' };
    }

    await db.insert(ebayHistoryTable).values({
      id: nanoid(),
      userId: userId,
      totalValue: Math.round(totalValue),
      recordedAt: new Date(),
      createdAt: new Date(),
    });

    // Revalidate the collection page to show updated data
    revalidatePath("/my-collection");
    return { isSuccess: true, data: null };
  } catch (error) {
    console.error('Error recording eBay history:', error);
    return { isSuccess: false, error: 'Failed to record eBay history' };
  }
};

// Special version for cron jobs that accepts a userId directly
// This bypasses the auth() requirement for automated processes
export const recordEbayHistoryForUserAction = async (totalValue: number, userId: string): Promise<ActionResult<null>> => {
  try {
    if (!userId) {
      return { isSuccess: false, error: 'User ID is required' };
    }

    await db.insert(ebayHistoryTable).values({
      id: nanoid(),
      userId: userId,
      totalValue: Math.round(totalValue),
      recordedAt: new Date(),
      createdAt: new Date(),
    });

    return { isSuccess: true, data: null };
  } catch (error) {
    console.error(`Error recording eBay history for user ${userId}:`, error);
    return { isSuccess: false, error: 'Failed to record eBay history' };
  }
};

// Get eBay history for a user
export const getEbayHistoryAction = async (): Promise<ActionResult<any[]>> => {
  try {
    // Get the current user ID from the auth sessions
    const { userId } = auth();
    
    if (!userId) {
      return { isSuccess: false, error: 'User not authenticated' };
    }

    const history = await db.select()
      .from(ebayHistoryTable)
      .where(eq(ebayHistoryTable.userId, userId))
      .orderBy(ebayHistoryTable.recordedAt);

    return { isSuccess: true, data: history };
  } catch (error) {
    console.error('Error getting eBay history:', error);
    return { isSuccess: false, error: 'Failed to get eBay history' };
  }
}; 