'use server';

/**
 * Debug actions for eBay API integration
 * This file provides functions to help troubleshoot eBay API-related issues
 */

import { auth } from "@clerk/nextjs/server";
import { getImagesByItemIdAction } from './images-actions';
import { getItemByIdAction } from './items-actions';
import { getEnhancedEbayPrices } from './ebay-actions';

/**
 * Debug function that tests the eBay API connection and returns detailed information
 * about the response, including any error messages
 */
export async function debugEbayPriceRefresh(itemId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated',
        phase: 'auth-check'
      };
    }

    // Step 1: Get the item
    console.log(`[DEBUG] Fetching item ${itemId}`);
    const itemResult = await getItemByIdAction(itemId);
    if (!itemResult.isSuccess || !itemResult.data) {
      return {
        success: false,
        error: `Failed to load item: ${itemResult.error || 'Unknown error'}`,
        phase: 'item-fetch'
      };
    }
    
    // Step 2: Get the item images
    console.log(`[DEBUG] Fetching images for item ${itemId}`);
    const imagesResult = await getImagesByItemIdAction(itemId);
    const primaryImage = imagesResult.isSuccess && imagesResult.data && imagesResult.data.length > 0 
                        ? imagesResult.data[0].url 
                        : undefined;
    
    // Step 3: Call the eBay API
    console.log(`[DEBUG] Calling eBay API for ${itemResult.data.name}`);
    
    // Create parameters object for better debugging
    const ebayParams = {
      title: itemResult.data.name,
      image: primaryImage,
      condition: itemResult.data.condition,
      franchise: itemResult.data.franchise,
      region: "UK" // Default to UK
    };
    
    console.log(`[DEBUG] eBay API parameters:`, ebayParams);
    
    try {
      const result = await getEnhancedEbayPrices(ebayParams, true);
      
      // Step 4: Process the API response
      console.log(`[DEBUG] eBay API response received`);
      
      // Check for valid prices
      const bestPrice = result.imageBased?.median || 
                         result.textBased?.median || 
                         result.combined?.median;
      
      if (!bestPrice) {
        return {
          success: false,
          error: 'No valid price found in the API response',
          phase: 'price-check',
          apiResponse: result,
          requestParams: ebayParams
        };
      }
      
      // Success case
      return {
        success: true,
        price: bestPrice,
        roundedPrice: Math.round(bestPrice),
        apiResponse: result,
        requestParams: ebayParams,
        phase: 'complete'
      };
      
    } catch (apiError) {
      // API call failed
      return {
        success: false,
        error: apiError instanceof Error ? apiError.message : 'Unknown API error',
        phase: 'api-call',
        requestParams: ebayParams
      };
    }
    
  } catch (error) {
    // General error
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      phase: 'general'
    };
  }
} 