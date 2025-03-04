import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { fetchEbayPrices } from '@/actions/ebay-actions';
import { getItemsByUserIdAction, updateItemAction } from '@/actions/items-actions';
import { recordEbayHistoryForUserAction } from '@/actions/ebay-history-actions';

// We will use an API key for authentication to make sure
// only authorized cron jobs can trigger this endpoint.
const CRON_SECRET = process.env.CRON_SECRET;

// IMPORTANT: After confirming everything works, set this to false!
// This is just for initial setup and debugging
const ALLOW_UNAUTHENTICATED_FOR_TESTING = true; 

/**
 * Update eBay prices for a specific user - this version doesn't rely on auth()
 */
async function updateEbayValuesForUser(userId: string) {
  try {
    // Get all items for the user
    const itemsResult = await getItemsByUserIdAction(userId);
    
    if (!itemsResult.isSuccess || !itemsResult.data) {
      console.log(`Failed to fetch items for user ${userId}`);
      return { success: false, error: 'Failed to fetch items' };
    }
    
    const items = itemsResult.data.filter(item => !item.isSold); // Only update items that aren't sold
    
    console.log(`Updating eBay listed values for ${items.length} items for user ${userId}`);
    
    // Update each item's eBay listed price
    let totalListedValue = 0;
    let updatedCount = 0;
    
    for (const item of items) {
      try {
        // Skip items without a name
        if (!item.name) continue;
        
        // Fetch eBay prices
        const prices = await fetchEbayPrices(item.name, 'listed');
        
        if (prices.median === undefined || prices.median === null) {
          console.log(`No valid median price found for item ${item.id}: ${item.name}`);
          continue;
        }
        
        // Round the median price to the nearest whole number
        const roundedPrice = Math.round(prices.median);
        
        // Update the database with the new price
        const updateResult = await updateItemAction(item.id, { ebayListed: roundedPrice });
        
        if (!updateResult.isSuccess) {
          console.log(`Failed to update item ${item.id} in database:`, updateResult.error);
          continue;
        }
        
        totalListedValue += roundedPrice;
        updatedCount++;
        console.log(`Updated item ${item.id}: ${item.name} with eBay listed value: £${roundedPrice}`);
      } catch (itemError) {
        console.error(`Failed to update item ${item.id}:`, itemError);
        // Continue with the next item
      }
    }
    
    // Record the total value for historical tracking
    if (updatedCount > 0) {
      try {
        console.log(`Recording total value of £${totalListedValue} for user ${userId}`);
        await recordEbayHistoryForUserAction(totalListedValue, userId);
      }
      catch (historyError) {
        console.error(`Error recording history for user ${userId}:`, historyError);
      }
    }
    
    return { 
      success: true, 
      userId,
      updatedItems: updatedCount,
      totalItems: items.length,
      totalValue: totalListedValue
    };
  } catch (error) {
    console.error(`Error updating all eBay prices for user ${userId}:`, error);
    return { 
      success: false, 
      userId,
      error: error instanceof Error ? error.message : 'Failed to update all eBay prices' 
    };
  }
}

export async function GET(req: NextRequest) {
  console.log("Cron job API called with headers:", JSON.stringify(Object.fromEntries([...req.headers])));
  console.log("Query params:", req.nextUrl.searchParams.toString());
  
  // Bypass auth for initial testing when flag is enabled
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
    // Get all users to process their collections
    const { data: users } = await clerkClient.users.getUserList();
    console.log(`Found ${users.length} users to process`);
    
    // Process each user's items
    const results = [];
    let totalUpdatedItems = 0;
    let totalProcessedUsers = 0;
    
    for (const user of users) {
      try {
        console.log(`Processing user ${user.id}`);
        const userResult = await updateEbayValuesForUser(user.id);
        results.push(userResult);
        
        if (userResult.success) {
          totalUpdatedItems += userResult.updatedItems || 0;
          totalProcessedUsers++;
        }
      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        results.push({ 
          success: false, 
          userId: user.id, 
          error: userError instanceof Error ? userError.message : 'Failed to process user' 
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated ${totalUpdatedItems} items across ${totalProcessedUsers} users`,
      results
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ error: 'Failed to process cron job' }, { status: 500 });
  }
} 