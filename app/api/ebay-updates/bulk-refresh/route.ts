import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { fetchEbayPrices } from '@/actions/ebay-actions';
import { getItemsByUserIdAction, updateItemAction } from '@/actions/items-actions';
import { recordEbayHistoryForUserAction } from '@/actions/ebay-history-actions';
import { SelectItem } from '@/db/schema/items-schema';

/**
 * Process a larger batch of items with progress tracking
 * This endpoint will update a configurable number of items at once
 */
export async function POST(req: NextRequest) {
  // Get current user
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get request parameters
    const data = await req.json();
    const batchSize = data.batchSize || 10; // Default to 10 items if not specified
    
    // Get the offset parameter to know which batch we're processing
    // If not provided, default to 0 (first batch)
    const offset = data.offset || 0;
    
    console.log(`[API] Starting bulk refresh with batch size: ${batchSize}, offset: ${offset}`);
    
    // Get items for the current user
    const itemsResult = await getItemsByUserIdAction(userId);
    
    if (!itemsResult.isSuccess || !itemsResult.data) {
      console.error(`[API] Failed to fetch items for user ${userId}`);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch items' 
      }, { status: 500 });
    }
    
    // Filter for unsold items only
    const items = itemsResult.data.filter(item => !item.isSold);
    console.log(`[API] Total items for user: ${itemsResult.data.length}, unsold items: ${items.length}`);
    
    if (items.length === 0) {
      console.log(`[API] No unsold items found for user ${userId}`);
      return NextResponse.json({
        success: true,
        message: "No items found that need updating",
        results: {
          totalProcessed: 0,
          successfulUpdates: 0,
          failedUpdates: 0,
          totalValue: 0,
          remainingItems: 0,
          totalItems: 0
        }
      });
    }
    
    // Calculate total items and remaining items
    const totalItems = items.length;
    
    // Use offset to get the correct slice of items for this batch
    // This ensures we never process the same item twice
    const itemsToProcess = items.slice(offset, offset + batchSize);
    console.log(`[API] Processing ${itemsToProcess.length} items, batch from ${offset} to ${offset + itemsToProcess.length - 1} out of ${totalItems} total`);
    
    // Calculate how many items remain after this batch
    const remainingItems = Math.max(0, totalItems - (offset + itemsToProcess.length));
    console.log(`[API] Remaining items after this batch: ${remainingItems}`);
    
    // Process this batch of items
    const results = {
      totalProcessed: itemsToProcess.length,
      successfulUpdates: 0,
      failedUpdates: 0,
      totalValue: 0,
      remainingItems: remainingItems,
      // Include the offset for the next batch
      nextOffset: offset + itemsToProcess.length
    };
    
    console.log(`[API] Initial results object:`, results);
    
    // Process each item in the batch
    for (const item of itemsToProcess) {
      try {
        // Skip items without a name
        if (!item.name) {
          console.log(`[API] Skipping item ${item.id} - no name provided`);
          results.failedUpdates++;
          continue;
        }
        
        console.log(`[API] Processing item ${item.id}: "${item.name}"`);
        
        // Fetch eBay prices for this item
        const prices = await fetchEbayPrices(item.name, 'listed', item.condition);
        
        if (prices.median === undefined || prices.median === null) {
          console.log(`[API] No valid median price found for item ${item.id}: ${item.name}`);
          results.failedUpdates++;
          continue;
        }
        
        // Round the median price to the nearest whole number
        const roundedPrice = Math.round(prices.median);
        console.log(`[API] Found median price for ${item.name}: £${roundedPrice}`);
        
        // Update the database with the new price and record when we updated it
        const updateResult = await updateItemAction(item.id, { 
          ebayListed: roundedPrice,
          ebayLastUpdated: new Date()
        });
        
        if (!updateResult.isSuccess) {
          console.log(`[API] Failed to update item ${item.id} in database:`, updateResult.error);
          results.failedUpdates++;
          continue;
        }
        
        // Track successful update
        results.successfulUpdates++;
        results.totalValue += roundedPrice;
        
        console.log(`[API] Updated item ${item.id}: ${item.name} with eBay listed value: £${roundedPrice}`);
      } catch (error) {
        console.error(`[API] Failed to update item ${item.id}:`, error);
        results.failedUpdates++;
      }
    }
    
    console.log(`[API] Final results:`, {
      totalProcessed: results.totalProcessed,
      successfulUpdates: results.successfulUpdates,
      failedUpdates: results.failedUpdates,
      remainingItems: results.remainingItems,
      nextOffset: results.nextOffset
    });
    
    // Record history if any items were updated
    if (results.successfulUpdates > 0) {
      try {
        await recordEbayHistoryForUserAction(results.totalValue, userId);
        console.log(`[API] Recorded history for user ${userId}: £${results.totalValue} total from ${results.successfulUpdates} items`);
      } catch (error) {
        console.error(`[API] Failed to record history for user ${userId}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${results.totalProcessed} items: ${results.successfulUpdates} updated, ${results.failedUpdates} failed`,
      results: {
        ...results,
        totalItems: totalItems
      }
    });
  } catch (error) {
    console.error('[API] Error in bulk refresh:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process eBay updates' 
    }, { status: 500 });
  }
} 