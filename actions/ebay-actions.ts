'use server'

import { revalidatePath } from 'next/cache'
import { updateItemAction } from './items-actions' // Import your database update function

// Remove the API_BASE_URL constant and use absolute URL instead
const API_URL = '/api/ebay';

export async function fetchEbayPrices(toyName: string, listingType: 'listed' | 'sold') {
  const url = new URL(API_URL);
  url.searchParams.append('toyName', toyName);
  url.searchParams.append('listingType', listingType);

  try {
    const response = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!response.ok) {
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

    // Round the median price to the nearest whole number
    const roundedPrice = Math.round(prices.median);

    // Update the database with the new prices
    const updateData = {
      [type === 'listed' ? 'ebayListed' : 'ebaySold']: roundedPrice
    };

    const updateResult = await updateItemAction(id, updateData);

    if (!updateResult.isSuccess) {
      throw new Error('Failed to update item in database');
    }

    revalidatePath('/catalog');
    return { 
      success: true, 
      prices: {
        ...prices,
        median: roundedPrice // Return the rounded price
      }
    };
  } catch (error) {
    console.error('Error updating eBay prices:', error);
    return { success: false, error: 'Failed to update eBay prices' };
  }
}