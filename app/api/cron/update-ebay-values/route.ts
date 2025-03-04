import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { fetchEbayPrices } from '@/actions/ebay-actions';
import { getItemsByUserIdAction, updateItemAction } from '@/actions/items-actions';
import { recordEbayHistoryForUserAction } from '@/actions/ebay-history-actions';
import { SelectItem } from '@/db/schema/items-schema';

// We will use an API key for authentication to make sure
// only authorized cron jobs can trigger this endpoint.
const CRON_SECRET = process.env.CRON_SECRET;

// IMPORTANT: After confirming everything works, set this to false!
// This is just for initial setup and debugging
const ALLOW_UNAUTHENTICATED_FOR_TESTING = true; 

// Define interfaces for our batch processing
interface ItemUpdate {
  id: string;
  name: string;
  value: number;
}

interface UserSummary {
  totalValue: number;
  updatedCount: number;
  items: ItemUpdate[];
}

interface BatchResults {
  totalProcessed: number;
  successfulUpdates: number;
  failedUpdates: number;
  userSummary: Record<string, {
    totalValue: number;
    updatedCount: number;
  }>;
}

/**
 * Process a batch of items for eBay price updates
 * This doesn't rely on auth() and works for any user's items
 */
async function processBatchOfItems(itemsToProcess: SelectItem[]): Promise<BatchResults> {
  const results: BatchResults = {
    totalProcessed: itemsToProcess.length,
    successfulUpdates: 0,
    failedUpdates: 0,
    userSummary: {}
  };
  
  // Group items by user for historical recording
  const itemsByUser: Record<string, UserSummary> = {};
  
  // Process each item in the batch
  for (const item of itemsToProcess) {
    try {
      // Skip items without a name
      if (!item.name) {
        results.failedUpdates++;
        continue;
      }
      
      // Initialize user tracking if not exists
      if (!itemsByUser[item.userId]) {
        itemsByUser[item.userId] = {
          totalValue: 0,
          updatedCount: 0,
          items: []
        };
      }
      
      // Fetch eBay prices for this item
      const prices = await fetchEbayPrices(item.name, 'listed');
      
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
      
      // Add to user's summary
      itemsByUser[item.userId].totalValue += roundedPrice;
      itemsByUser[item.userId].updatedCount++;
      itemsByUser[item.userId].items.push({
        id: item.id,
        name: item.name,
        value: roundedPrice
      });
      
      console.log(`Updated item ${item.id}: ${item.name} with eBay listed value: £${roundedPrice}`);
    } catch (error) {
      console.error(`Failed to update item ${item.id}:`, error);
      results.failedUpdates++;
    }
  }
  
  // Record history for each user that had updates
  for (const userId in itemsByUser) {
    const userSummary = itemsByUser[userId];
    
    if (userSummary.updatedCount > 0) {
      try {
        await recordEbayHistoryForUserAction(userSummary.totalValue, userId);
        console.log(`Recorded history for user ${userId}: £${userSummary.totalValue} total from ${userSummary.updatedCount} items`);
        
        // Add to results
        results.userSummary[userId] = {
          totalValue: userSummary.totalValue,
          updatedCount: userSummary.updatedCount
        };
      } catch (error) {
        console.error(`Failed to record history for user ${userId}:`, error);
      }
    }
  }
  
  return results;
}

export async function GET(req: NextRequest) {
  console.log("Cron job API called with headers:", JSON.stringify(Object.fromEntries([...req.headers])));
  console.log("Query params:", req.nextUrl.searchParams.toString());
  
  // Auth validation - same as before
  if (ALLOW_UNAUTHENTICATED_FOR_TESTING) {
    console.log("⚠️ RUNNING IN TEST MODE: Authentication bypassed");
  } else {
    // Check for Vercel cron job based on user-agent header
    const isVercelCron = req.headers.get('user-agent') === 'vercel-cron/1.0';
    const vercelProxySignature = req.headers.get('x-vercel-proxy-signature');
    
    console.log("Is Vercel cron job?", isVercelCron);
    console.log("Has Vercel proxy signature?", !!vercelProxySignature);
    
    // If not from Vercel cron or missing Vercel signature, check for our secret
    if (!isVercelCron || !vercelProxySignature) {
      // Check for authorization header
      const authHeader = req.headers.get('authorization');
      const cronSecretFromQuery = req.nextUrl.searchParams.get('cron_secret');
      
      console.log("Auth header exists?", !!authHeader);
      console.log("Query param exists?", !!cronSecretFromQuery);
      
      // Validate the secret (either from header or query param)
      if ((!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== CRON_SECRET) && 
          (cronSecretFromQuery !== CRON_SECRET)) {
        console.log("Unauthorized cron job request - failed authentication check");
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      console.log("Authorized Vercel cron job request detected");
    }
  }

  try {
    // Get items that are due for an update
    // This will be items that haven't been updated recently, with priority to oldest items
    const BATCH_SIZE = 25; // Process 25 items per cron job run
    
    console.log(`Requesting batch of ${BATCH_SIZE} items due for update`);
    
    // Get a batch of items to update 
    // For now, we'll get items from all users
    const { data: users } = await clerkClient.users.getUserList();
    
    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users found to process",
      });
    }
    
    // Collect all items that need updating across all users
    let allItemsToUpdate: SelectItem[] = [];
    
    for (const user of users) {
      // Get items for this user
      const itemsResult = await getItemsByUserIdAction(user.id);
      
      if (!itemsResult.isSuccess || !itemsResult.data) {
        console.log(`Failed to fetch items for user ${user.id}`);
        continue;
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
      
      allItemsToUpdate = [...allItemsToUpdate, ...itemsToUpdate];
    }
    
    // Limit the total number of items we'll process
    allItemsToUpdate = allItemsToUpdate.slice(0, BATCH_SIZE);
    
    if (allItemsToUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No items found that need updating",
      });
    }
    
    console.log(`Processing batch of ${allItemsToUpdate.length} items`);
    
    // Process this batch of items
    const results = await processBatchOfItems(allItemsToUpdate);
    
    return NextResponse.json({
      success: true,
      message: `Processed ${results.totalProcessed} items: ${results.successfulUpdates} updated, ${results.failedUpdates} failed`,
      results
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ error: 'Failed to process cron job' }, { status: 500 });
  }
} 