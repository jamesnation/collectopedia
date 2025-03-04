'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/db/db'
import { itemsTable } from '@/db/schema/items-schema'
import { eq } from 'drizzle-orm'
import { updateAIEstimates } from '@/services/ai-pricing-service'

export async function updateAllAIEstimates() {
  try {
    // Get all items
    const items = await db.select().from(itemsTable);
    
    // Calculate new estimates
    const updates = await updateAIEstimates(items);
    
    // Update each item in the database
    await Promise.all(
      updates.map(update => 
        db
          .update(itemsTable)
          .set({
            aiEstimateLow: update.aiEstimateLow,
            aiEstimateMedium: update.aiEstimateMedium,
            aiEstimateHigh: update.aiEstimateHigh,
            aiConfidence: update.aiConfidence,
            aiLastUpdated: update.aiLastUpdated
          })
          .where(eq(itemsTable.id, update.id))
      )
    );

    revalidatePath('/my-collection');
    return { success: true, message: 'AI estimates updated successfully' };
  } catch (error) {
    console.error('Error updating AI estimates:', error);
    return { success: false, error: 'Failed to update AI estimates' };
  }
}

export async function updateSingleAIEstimate(id: string) {
  try {
    // Get the item
    const [item] = await db
      .select()
      .from(itemsTable)
      .where(eq(itemsTable.id, id));

    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    // Calculate new estimate
    const [update] = await updateAIEstimates([item]);
    
    // Update the item in the database
    await db
      .update(itemsTable)
      .set({
        aiEstimateLow: update.aiEstimateLow,
        aiEstimateMedium: update.aiEstimateMedium,
        aiEstimateHigh: update.aiEstimateHigh,
        aiConfidence: update.aiConfidence,
        aiLastUpdated: update.aiLastUpdated
      })
      .where(eq(itemsTable.id, id));

    revalidatePath('/my-collection');
    return { success: true, message: 'AI estimate updated successfully' };
  } catch (error) {
    console.error('Error updating AI estimate:', error);
    return { success: false, error: 'Failed to update AI estimate' };
  }
} 