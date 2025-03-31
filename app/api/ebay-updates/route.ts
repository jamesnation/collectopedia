import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { fetchEbayPrices } from '@/actions/ebay-actions';
import { getItemsByUserIdAction, updateItemAction } from '@/actions/items-actions';
import { recordEbayHistoryForUserAction } from '@/actions/ebay-history-actions';
import { SelectItem } from '@/db/schema/items-schema';

// Force dynamic API route
export const dynamic = 'force-dynamic';

// Define interfaces for our batch processing
interface ItemUpdate {
  id: string;
  name: string;
  value: number;
}

interface BatchResults {
  totalProcessed: number;
  successfulUpdates: number;
  failedUpdates: number;
  totalValue: number;
}

/**
 * Process a small batch of items for the current user
 * This endpoint will update eBay prices for 5 items at a time
 */
export async function POST(req: NextRequest) {
  // Get current user
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Define a small batch size to keep the response time reasonable
    const BATCH_SIZE = 5;
    
    // Get items for the current user
    const itemsResult = await getItemsByUserIdAction(userId);
    
    if (!itemsResult.isSuccess || !itemsResult.data) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch items' 
      }, { status: 500 });
    }
    
    // Filter for unsold items only
    const items = itemsResult.data.filter(item => !item.isSold);
    
    // Sort by last updated time (oldest first) or creation date if never updated
    const sortedItems = items.sort((a, b) => {
      const aDate = a.ebayLastUpdated || a.createdAt;
      const bDate = b.ebayLastUpdated || b.createdAt;
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });
    
    // Take the oldest items that need updating
    const itemsToUpdate = sortedItems.slice(0, BATCH_SIZE);
    
    if (itemsToUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No items found that need updating",
      });
    }
    
    // Process this batch of items
    const results: BatchResults = {
      totalProcessed: itemsToUpdate.length,
      successfulUpdates: 0,
      failedUpdates: 0,
      totalValue: 0
    };
    
    // Process each item in the batch
    for (const item of itemsToUpdate) {
      try {
        // Skip items without a name
        if (!item.name) {
          results.failedUpdates++;
          continue;
        }
        
        // Fetch eBay prices for this item, including the condition
        const prices = await fetchEbayPrices(item.name, 'listed', item.condition);
        
        if (prices.median === undefined || prices.median === null) {
          console.log(`No valid median price found for item ${item.id}: ${item.name}`);
          results.failedUpdates++;
          continue;
        }
        
        // Round the median price to the nearest whole number
        const roundedPrice = Math.round(prices.median);
        
        // Update the database with the new price and record when we updated it
        const updateResult = await updateItemAction(item.id, { 
          ebayListed: roundedPrice,
          ebayLastUpdated: new Date()
        });
        
        if (!updateResult.isSuccess) {
          console.log(`Failed to update item ${item.id} in database:`, updateResult.error);
          results.failedUpdates++;
          continue;
        }
        
        // Track successful update
        results.successfulUpdates++;
        results.totalValue += roundedPrice;
        
        console.log(`Updated item ${item.id}: ${item.name} with eBay listed value: £${roundedPrice}`);
      } catch (error) {
        console.error(`Failed to update item ${item.id}:`, error);
        results.failedUpdates++;
      }
    }
    
    // Record history if any items were updated
    if (results.successfulUpdates > 0) {
      try {
        await recordEbayHistoryForUserAction(results.totalValue, userId);
        console.log(`Recorded history for user ${userId}: £${results.totalValue} total from ${results.successfulUpdates} items`);
      } catch (error) {
        console.error(`Failed to record history for user ${userId}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${results.totalProcessed} items: ${results.successfulUpdates} updated, ${results.failedUpdates} failed`,
      results
    });
  } catch (error) {
    console.error('Error in background update:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process eBay updates' 
    }, { status: 500 });
  }
} 