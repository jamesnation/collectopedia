'use server'

import { revalidatePath } from 'next/cache'
import { updateItemAction } from './items-actions' // Import your database update function
import { getItemsByUserIdAction } from './items-actions' // Import for bulk updates
import { recordEbayHistoryAction } from './ebay-history-actions' // Import for recording history
import { auth } from "@clerk/nextjs/server";

// Remove the API_BASE_URL constant and use absolute URL instead
const API_URL = '/api/ebay';

export async function fetchEbayPrices(toyName: string, listingType: 'listed' | 'sold') {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  
  const url = new URL(API_URL, baseUrl);
  url.searchParams.append('toyName', toyName);
  url.searchParams.append('listingType', listingType);

  console.log('NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
  console.log('Fetching eBay prices from:', url.toString());

  try {
    const response = await fetch(url.toString(), { next: { revalidate: 3600 } });
    console.log('Fetch response status:', response.status);
    if (!response.ok) {
      console.error('Fetch error:', response.status, response.statusText);
      const text = await response.text();
      console.error('Response body:', text);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching eBay prices:', error);
    throw error;
  }
}

export async function updateEbayPrices(id: string, name: string, type: 'listed' | 'sold') {
  try {
    const prices = await fetchEbayPrices(name, type);

    console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} Prices:`, prices);

    // Check if prices.median is undefined or null
    if (prices.median === undefined || prices.median === null) {
      console.error('No valid median price found');
      return { success: false, error: 'No valid price data found' };
    }

    // Round the median price to the nearest whole number
    const roundedPrice = Math.round(prices.median);

    // Update the database with the new prices
    const updateData = {
      [type === 'listed' ? 'ebayListed' : 'ebaySold']: roundedPrice
    };

    const updateResult = await updateItemAction(id, updateData);

    if (!updateResult.isSuccess) {
      console.error('Failed to update item in database:', updateResult.error);
      throw new Error(updateResult.error || 'Failed to update item in database');
    }

    revalidatePath('/my-collection');
    return { 
      success: true, 
      prices: {
        ...prices,
        median: roundedPrice // Return the rounded price
      }
    };
  } catch (error) {
    console.error('Error updating eBay prices:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update eBay prices' };
  }
}

/**
 * Updates all items' eBay listed values for a user and records the total
 * This should be called from the cron job
 */
export async function updateAllEbayListedValues() {
  try {
    // Get current user
    const { userId } = auth();
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Get all items for the user
    const itemsResult = await getItemsByUserIdAction(userId);
    
    if (!itemsResult.isSuccess || !itemsResult.data) {
      return { success: false, error: 'Failed to fetch items' };
    }
    
    const items = itemsResult.data.filter(item => !item.isSold); // Only update items that aren't sold
    
    console.log(`Updating eBay listed values for ${items.length} items`);
    
    // Update each item's eBay listed price
    let totalListedValue = 0;
    let updatedCount = 0;
    
    for (const item of items) {
      try {
        // Skip items without a name
        if (!item.name) continue;
        
        // Update the eBay listed price
        const result = await updateEbayPrices(item.id, item.name, 'listed');
        
        if (result.success && result.prices && result.prices.median) {
          totalListedValue += result.prices.median;
          updatedCount++;
        }
      } catch (itemError) {
        console.error(`Failed to update item ${item.id}:`, itemError);
        // Continue with the next item
      }
    }
    
    // Record the total value for historical tracking
    if (updatedCount > 0) {
      await recordEbayHistoryAction(totalListedValue);
    }
    
    // Return success
    return { 
      success: true, 
      message: `Updated ${updatedCount} of ${items.length} items with a total value of £${totalListedValue.toFixed(2)}` 
    };
  } catch (error) {
    console.error('Error updating all eBay prices:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update all eBay prices' };
  }
}