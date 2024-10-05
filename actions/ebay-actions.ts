'use server'

import { revalidatePath } from 'next/cache'
import { updateItemAction } from './items-actions' // Import your database update function

// Remove the API_BASE_URL constant and use absolute URL instead
const API_URL = '/api/ebay';

export async function fetchEbayPrices(toyName: string, listingType: 'listed' | 'sold') {
  // Use an absolute URL for production, fallback to relative URL for development
  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL 
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` 
    : 'http://localhost:3000';
  
  const url = new URL('/api/ebay', baseUrl);
  url.searchParams.append('toyName', toyName);
  url.searchParams.append('listingType', listingType);

  console.log('Fetching eBay prices from:', url.toString()); // Add this log

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
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update eBay prices' };
  }
}