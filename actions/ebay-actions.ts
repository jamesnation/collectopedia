'use server'

import { revalidatePath } from 'next/cache'
import { getItemsByUserIdAction, updateItemAction } from './items-actions'
import { recordEbayHistoryAction } from './ebay-history-actions' // Import for recording history
import { getImagesByItemIdAction } from './images-actions' // Correct import from images-actions
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server'; // Corrected import path for server actions

// Remove the API_BASE_URL constant and use absolute URL instead
const API_URL = '/api/ebay';

// Define type for eBay search results
interface EbaySearchResult {
  success: boolean;
  prices: { lowest: number; median: number; highest: number };
  items: any[]; // Items returned by the search
  itemSummaries?: any[]; // Alternative name for items in API responses
  debugData?: {
    imageSearchDetails?: {
      error?: string;
      message?: string;
      errorType?: string;
      imageUrl?: string;
      timestamp: string;
      apiResponse?: any;
      originalResultCount?: number;
      originalResults?: any[];
      imageSearchSuccess?: boolean;
      filterString?: string;
    }
  };
}

// For handling both specific or global region parameter
const getRegionFromPreference = (): string | undefined => {
  // Since this is server-side, we can't directly access localStorage
  // This function should be overridden with the actual region from client components
  return undefined;
};

// Helper to get region from a cookie
function getRegionFromCookie(): string | undefined {
  const cookieStore = cookies();
  const regionCookie = cookieStore.get('collectopedia_region_preference');
  return regionCookie?.value;
}

export async function fetchEbayPrices(
  toyName: string, 
  listingType: 'listed' | 'sold', 
  condition?: 'New' | 'Used',
  franchise?: string,
  region?: string
): Promise<{
  lowest: number | null;
  median: number | null;
  highest: number | null;
  listingType: string;
  items?: any[];
  error?: string;
  message?: string;
}> {
  try {
    // Get region from cookie if not provided
    const effectiveRegion = region || getRegionFromCookie() || 'UK'; // Default to UK if not found
    
    console.log(`Fetching eBay prices for "${toyName}" (${listingType}, ${condition || 'Any condition'}, Region: ${effectiveRegion})`);
    
    // Build the URL with query parameters
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const url = new URL('/api/ebay', baseUrl);
    
    // Create search term that includes franchise if provided
    let searchTerm = toyName;
    if (franchise && franchise.trim() && !['Other', 'Unknown'].includes(franchise)) {
      searchTerm = `${franchise} ${toyName}`;
      console.log('Added franchise to search term:', franchise);
    }
    url.searchParams.append('toyName', searchTerm);
    url.searchParams.append('listingType', listingType);
    if (condition) {
      url.searchParams.append('condition', condition);
    }
    
    // Add region parameter
    url.searchParams.append('region', effectiveRegion);
    
    // Add debug parameter to get item details
    url.searchParams.append('includeItems', 'true');
    
    // Fetch the data from our API route - add credentials:include to ensure cookies are sent
    const response = await fetch(url.toString(), { 
      next: { revalidate: 3600 },
      credentials: 'include' // Add credentials to include auth cookies
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`HTTP error fetching eBay prices: ${response.status} ${text}`);
      throw new Error(`HTTP error! status: ${response.status} ${text}`);
    }
    
    // Parse the response
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      throw new Error('Failed to parse response from eBay API');
    }
    
    // Ensure we have numeric values or null
    const result = {
      lowest: data.lowest !== undefined ? Number(data.lowest) || null : null,
      median: data.median !== undefined ? Number(data.median) || null : null,
      highest: data.highest !== undefined ? Number(data.highest) || null : null,
      listingType,
      items: data.items || [],
      message: data.message,
      error: data.error
    };
    
    // If we got no results AND we were using a franchise in the search term, retry with just the toy name
    if (result.lowest === null && result.median === null && result.highest === null && 
        searchTerm !== toyName && franchise && franchise.trim()) {
      console.log('No results found with franchise in search term. Retrying with just the toy name.');
      
      // Use just the toy name without franchise
      url.searchParams.set('toyName', toyName);
      
      // Use credentials here too for the fallback request
      const fallbackResponse = await fetch(url.toString(), { 
        next: { revalidate: 3600 },
        credentials: 'include'
      });
      
      if (!fallbackResponse.ok) {
        console.error(`HTTP error in fallback request: ${fallbackResponse.status}`);
        return result; // Return original (empty) result if fallback failed
      }
      
      // Process the fallback response
      const fallbackResponseText = await fallbackResponse.text();
      const fallbackData = JSON.parse(fallbackResponseText);
      
      if (fallbackData.lowest !== undefined || fallbackData.median !== undefined || fallbackData.highest !== undefined) {
        console.log('Fallback search successful, found results with generic search');
        
        // Override with fallback data
        result.lowest = fallbackData.lowest !== undefined ? Number(fallbackData.lowest) || null : null;
        result.median = fallbackData.median !== undefined ? Number(fallbackData.median) || null : null;
        result.highest = fallbackData.highest !== undefined ? Number(fallbackData.highest) || null : null;
        result.items = fallbackData.items || [];
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching eBay prices:', error);
    return { 
      lowest: null, 
      median: null, 
      highest: null, 
      listingType, 
      items: [],
      error: error instanceof Error ? error.message : 'Failed to fetch eBay prices' 
    };
  }
}

export async function updateEbayPrices(
  id: string, 
  name: string, 
  type: 'listed' | 'sold', 
  condition?: 'New' | 'Used',
  region?: string
): Promise<{
  success: boolean;
  prices?: {
    lowest: number | null;
    median: number | null;
    highest: number | null;
  };
  error?: string;
}> {
  try {
    // Get region from cookie if not provided
    const effectiveRegion = region || getRegionFromCookie() || 'UK'; // Default to UK if not found
    
    console.log(`Updating eBay ${type} prices for item "${name}" (${condition || 'Any condition'}, Region: ${effectiveRegion})`);
    
    const prices = await fetchEbayPrices(name, type, condition, undefined, effectiveRegion);

    // Check if prices.median is undefined or null
    if (prices.median === undefined || prices.median === null) {
      console.error('No valid median price found');
      return { success: false, error: 'No valid price data found' };
    }

    // Round the median price to the nearest whole number
    const roundedPrice = Math.round(prices.median);
    
    // Update the database with the new prices
    const updateData = {
      [type === 'listed' ? 'ebayListed' : 'ebaySold']: roundedPrice,
      ebayLastUpdated: new Date()
    };

    console.log(`Updating item ${id} with ${type} price: ${roundedPrice}`);
    const updateResult = await updateItemAction(id, updateData);

    if (!updateResult.isSuccess) {
      console.error('Failed to update item in database:', updateResult.error);
      throw new Error(updateResult.error || 'Failed to update item in database');
    }

    console.log(`Successfully updated ${type} price for item ${id}`);
    revalidatePath('/my-collection');
    
    return { 
      success: true, 
      prices: {
        lowest: prices.lowest,
        median: roundedPrice, // Return the rounded price
        highest: prices.highest
      }
    };
  } catch (error) {
    console.error('Error updating eBay prices:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update eBay prices' 
    };
  }
}

/**
 * Updates all items' eBay listed values for a user and records the total
 * This should be called from the cron job OR triggered by the authenticated user.
 */
export async function updateAllEbayListedValues() {
  try {
    // Get authenticated userId from Clerk session
    const { userId } = auth();
    if (!userId) {
      console.error('Authentication Required for updateAllEbayListedValues');
      return { success: false, error: 'Authentication Required' };
    }
    
    // Fetch items for the authenticated user
    console.log(`Updating all eBay listed values for user: ${userId}`);
    // Note: getItemsByUserIdAction internally checks if its passed userId matches auth().userId,
    // but we fetch using the confirmed authenticated userId here for clarity and safety.
    const itemsResult = await getItemsByUserIdAction(userId); 

    if (!itemsResult.isSuccess || !itemsResult.data) {
      console.error('Failed to fetch items for user:', itemsResult.error);
      return { success: false, error: itemsResult.error || 'Failed to fetch items' };
    }

    const items = itemsResult.data;
    console.log(`Found ${items.length} items to update for user ${userId}`);
    let updatedCount = 0;
    let totalValue = 0;
    const errors: string[] = [];

    // Use Promise.allSettled for concurrent updates
    const updatePromises = items.map(async (item) => {
      try {
        // Determine condition, default to 'Used' if not specified
        const condition = item.condition === 'New' ? 'New' : 'Used';
        const region = getRegionFromCookie() || 'UK'; // Get region preference

        console.log(`Fetching listed price for item: ${item.name} (ID: ${item.id})`);
        const prices = await fetchEbayPrices(item.name, 'listed', condition, item.franchise, region);

        if (prices.median !== null && prices.median !== undefined) {
          const roundedPrice = Math.round(prices.median);
          console.log(`Updating item ${item.id} with listed price: ${roundedPrice}`);
          
          // Use updateItemAction which performs owner check again (defense-in-depth)
          const updateResult = await updateItemAction(item.id, { 
            ebayListed: roundedPrice,
            ebayLastUpdated: new Date() 
          });

          if (updateResult.isSuccess) {
            totalValue += roundedPrice;
            return { status: 'fulfilled', id: item.id };
          } else {
            console.error(`Failed to update item ${item.id}:`, updateResult.error);
            errors.push(`Item ${item.id} (${item.name}): ${updateResult.error}`);
            return { status: 'rejected', id: item.id, reason: updateResult.error };
          }
        } else {
           console.log(`No median price found for item ${item.id} (${item.name}). Skipping update.`);
           return { status: 'skipped', id: item.id }; // Indicate skipped due to no price
        }
      } catch (error) {
        console.error(`Error processing item ${item.id}:`, error);
        errors.push(`Item ${item.id} (${item.name}): ${error instanceof Error ? error.message : 'Unknown error'}`);
        return { status: 'rejected', id: item.id, reason: error instanceof Error ? error.message : 'Unknown processing error' };
      }
    });

    const results = await Promise.allSettled(updatePromises);
    
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value?.status === 'fulfilled') {
        updatedCount++;
      }
    });

    console.log(`Finished updating eBay listed values for user ${userId}. ${updatedCount} items updated.`);

    // Record the history only if some items were successfully updated
    if (updatedCount > 0) {
      console.log(`Recording eBay history for user ${userId} with total value: ${totalValue}`);
      await recordEbayHistoryAction(totalValue);
    } else {
       console.log(`No items were updated for user ${userId}, skipping history record.`);
    }

    revalidatePath('/my-collection'); // Revalidate relevant path
    return { success: true, updatedCount, totalValue, errors: errors.length > 0 ? errors : undefined };

  } catch (error) {
    console.error('Error in updateAllEbayListedValues:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update eBay listed values' 
    };
  }
}

/**
 * Search eBay by image for pricing data
 */
export async function searchEbayByImage(
  imageUrl: string | null,
  itemTitle: string,
  condition: string = "new",
  cacheKey?: string
): Promise<EbaySearchResult> {
  if (!imageUrl) {
    console.warn("No image URL provided for eBay image search");
    return {
      success: true,
      prices: { lowest: 0, median: 0, highest: 0 },
      items: [],
      debugData: {
        imageSearchDetails: {
          message: "No image URL provided",
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  // Check if we're in a browser environment before using localStorage
  const isBrowser = typeof window !== 'undefined' && window.localStorage;
  
  // Try to use cached results first if in browser
  if (isBrowser && cacheKey) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, data, items, debugData } = JSON.parse(cached);
        // Use cache if less than 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          console.log('Using cached eBay image search results');
          return { success: true, prices: data, items, debugData };
        }
      }
    } catch (cacheError) {
      console.error('Error reading from cache:', cacheError);
      // Continue with the search if cache fails
    }
  }

  console.log(`Starting image search for "${itemTitle}" with condition: ${condition}`);
  
  try {
    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    // Construct absolute URL for the API endpoint
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/ebay/search-by-image`;
    
    // Send the image to our API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        imageBase64: base64Image,
        title: itemTitle,
        condition: condition,
        debug: true
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response
    const responseText = await response.text();
    const data = JSON.parse(responseText);

    // Check if there was an error in the API response
    if (data.error) {
      console.error('eBay image search API returned error:', data.error);
      
      // Even with an error, we return success: true so the UI doesn't break
      // but we include the error message in the debug data
      return { 
        success: true, 
        prices: { lowest: 0, median: 0, highest: 0 }, 
        items: [],
        debugData: {
          error: data.error,
          details: data.details,
          ...data.debugData
        }
      };
    }
    
    // Extract just the pricing information
    if ((!data.itemSummaries || data.itemSummaries.length === 0) && (!data.items || data.items.length === 0)) {
      console.log('No item summaries found in eBay search response');
      return { 
        success: true, 
        prices: { lowest: 0, median: 0, highest: 0 }, 
        items: [],
        debugData: data.debugData
      };
    }

    // Process prices - support both itemSummaries (from API) and items (from cached results)
    const itemsToProcess = data.itemSummaries || data.items || [];
    const prices = itemsToProcess
      .filter((item: any) => item.price && item.price.value)
      .map((item: any) => parseFloat(item.price.value))
      .filter((price: number) => !isNaN(price) && price > 0);
    
    console.log(`Found ${prices.length} valid prices from ${itemsToProcess.length} items`);
    
    if (prices.length === 0) {
      return { 
        success: true, 
        prices: { lowest: 0, median: 0, highest: 0 }, 
        items: [],
        debugData: data.debugData
      };
    }

    // Sort prices (ascending) and extract statistics
    prices.sort((a: number, b: number) => a - b);
    
    const lowest = prices[0] || 0;
    const highest = prices[prices.length - 1] || 0;
    
    // Calculate median - handle even and odd number of prices
    let median;
    if (prices.length === 0) {
      median = 0;
    } else if (prices.length % 2 === 0) {
      median = (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2;
    } else {
      median = prices[Math.floor(prices.length / 2)];
    }
    
    // Store data in the cache if we're in a browser and have a cache key
    if (isBrowser && cacheKey) {
      try {
        const cacheData = {
          timestamp: Date.now(),
          data: { lowest, median, highest },
          items: data.itemSummaries || data.items || [],
          debugData: data.debugData
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log('Cached eBay image search results');
      } catch (cacheError) {
        console.error('Error writing to cache:', cacheError);
      }
    }
    
    // Return the final result
    return {
      success: true,
      prices: { lowest, median, highest },
      items: data.itemSummaries || data.items || [],
      debugData: data.debugData
    };
  } catch (imageError: unknown) {
    // Create a descriptive error message based on error type
    const errorMessage = imageError instanceof Error ? imageError.message : String(imageError);
    
    console.error('Error in eBay image search:', errorMessage);
    
    let userMessage = "Failed to process the image.";
    
    if (errorMessage.includes("fetch")) {
      userMessage = "Failed to fetch the image. The image URL may be invalid or inaccessible.";
    } else if (errorMessage.includes("URL")) {
      userMessage = "Failed to parse URL from the image source.";
    } else if (errorMessage.includes("buffer") || errorMessage.includes("base64")) {
      userMessage = "Failed to convert the image to the required format.";
    } else if (errorMessage.includes("status") || errorMessage.includes("statusText")) {
      userMessage = `HTTP error when fetching the image: ${errorMessage}`;
    }
    
    return {
      success: true, // still return success:true to not break the UI
      prices: { lowest: 0, median: 0, highest: 0 },
      items: [],
      debugData: {
        imageSearchDetails: {
          error: "Image processing error",
          message: userMessage,
          timestamp: new Date().toISOString()
        }
      }
    };
  }
}

/**
 * Enhanced function to get eBay pricing data using both text and image search
 */
export async function getEnhancedEbayPrices(
  item: { 
    title: string; 
    image?: string; 
    condition?: string;
    franchise?: string;
    region?: string;
  },
  includeDebugData: boolean = false
): Promise<{
  textBased?: { lowest: number; median: number; highest: number };
  imageBased?: { lowest: number; median: number; highest: number };
  debugData?: {
    textMatches?: any[];
    imageMatches?: any[];
    imageSearchDetails?: any;
    searchParams?: {
      title: string;
      imageUrl?: string;
      condition?: string;
      franchise?: string;
      region?: string;
    };
  };
}> {
  console.log(`Getting enhanced eBay prices for "${item.title}" (${item.condition || 'Any condition'}, Region: ${item.region || getRegionFromCookie() || 'UK'})`);
  
  const result: any = {};
  
  // Initialize debug data if requested
  if (includeDebugData) {
    result.debugData = {
      textMatches: [],
      imageMatches: [],
      searchParams: {
        title: item.title,
        imageUrl: item.image,
        condition: item.condition,
        franchise: item.franchise,
        region: item.region
      }
    };
  }
  
  // Get text-based results with franchise
  const textResults = await fetchEbayPrices(
    item.title,
    'listed',
    item.condition as 'New' | 'Used' | undefined,
    item.franchise,
    getRegionFromCookie()
  );

  if (textResults && typeof textResults === 'object') {
    result.textBased = {
      lowest: textResults.lowest || 0,
      median: textResults.median || 0,
      highest: textResults.highest || 0
    };
    
    // Store raw items data for debug mode
    if (includeDebugData) {
      // Add error information to debug data if available
      if (textResults.error || textResults.message) {
        result.debugData.textApiInfo = {
          error: textResults.error,
          message: textResults.message,
          timestamp: new Date().toISOString()
        };
      }
      
      if (textResults.items && textResults.items.length > 0) {
        result.debugData.textMatches = textResults.items.map((item: any) => {
          // Create a consistent image object structure
          let imageObj;
          if (item.image) {
            imageObj = typeof item.image === 'string' 
              ? { imageUrl: item.image } 
              : item.image;
          } else if (item.imageUrl) {
            imageObj = { imageUrl: item.imageUrl };
          }
          
          return {
            ...item,
            searchType: 'text',
            matchConfidence: item.relevanceScore || 'unknown',
            // Use the consistent image object
            image: imageObj
          };
        });
      }
    }
  } else {
    // Set default values to prevent undefined errors
    result.textBased = { lowest: 0, median: 0, highest: 0 };
  }
  
  // Get image-based results if an image is available
  if (item.image) {
    try {
      const imageResults = await searchEbayByImage(
        item.image,
        item.title,
        item.condition as 'New' | 'Used' | undefined,
        `ebay_img_${item.image?.split('/').pop()}`
      );
      
      if (imageResults.success && imageResults.prices) {
        result.imageBased = imageResults.prices;
        
        // Store raw items data for debug mode
        if (includeDebugData && (imageResults.items || imageResults.itemSummaries)) {
          const imageItems = imageResults.itemSummaries || imageResults.items || [];
          result.debugData.imageMatches = imageItems.map((item: any) => ({
            ...item,
            searchType: 'image',
            matchConfidence: item.relevanceScore || 'unknown',
            image: item.image || (item.imageUrl ? { imageUrl: item.imageUrl } : undefined),
            url: item.itemWebUrl || item.webUrl || `https://www.ebay.co.uk/itm/${item.itemId || item.id}`
          }));
          
          // Store additional debug data if available
          if (imageResults.debugData) {
            result.debugData.imageSearchDetails = imageResults.debugData;
          }
        }
      } else {
        // Set default values to prevent undefined errors
        result.imageBased = { lowest: 0, median: 0, highest: 0 };
      }
    } catch (error) {
      console.error('Error getting image-based eBay prices:', error);
      // Set default values to prevent undefined errors
      result.imageBased = { lowest: 0, median: 0, highest: 0 };
    }
  } else {
    console.log('No image provided, skipping image-based search');
  }
  
  return result;
}

/**
 * Refreshes prices for all items owned by the current user using the enhanced method.
 * @returns {Promise<{success: boolean, totalUpdated: number, error?: string}>}
 */
export async function refreshAllItemPricesEnhanced(): Promise<{
  success: boolean;
  totalUpdated: number;
  error?: string;
}> {
  try {
    // Get authenticated userId from Clerk session
    const { userId } = auth();
    if (!userId) {
      console.error('Authentication Required for refreshAllItemPricesEnhanced');
      return { success: false, totalUpdated: 0, error: 'Authentication Required' };
    }

    console.log(`Starting enhanced price refresh for user: ${userId}`);
    // Fetch items for the authenticated user
    const itemsResult = await getItemsByUserIdAction(userId);

    if (!itemsResult.isSuccess || !itemsResult.data) {
      console.error('Failed to fetch items for enhanced refresh:', itemsResult.error);
      return { success: false, totalUpdated: 0, error: itemsResult.error || 'Failed to fetch items' };
    }

    const items = itemsResult.data;
    let totalUpdated = 0;
    const errors: string[] = [];
    const region = getRegionFromCookie() || 'UK'; // Get region preference once

    console.log(`Found ${items.length} items for enhanced refresh for user ${userId}`);

    // Process items sequentially or in batches to avoid overwhelming APIs/DB
    // Using sequential processing for simplicity here
    for (const item of items) {
      try {
        console.log(`Processing enhanced price refresh for item: ${item.name} (ID: ${item.id})`);
        const prices = await getEnhancedEbayPrices({
          title: item.name,
          image: item.image || undefined,
          condition: item.condition || 'Used',
          franchise: item.franchise || undefined,
          region: region,
        });

        // Determine the best median price (prefer image-based if available)
        let medianPrice: number | undefined | null = undefined;
        if (prices.imageBased?.median !== null && prices.imageBased?.median !== undefined) {
          medianPrice = prices.imageBased.median;
        } else if (prices.textBased?.median !== null && prices.textBased?.median !== undefined) {
          medianPrice = prices.textBased.median;
        }

        if (medianPrice !== null && medianPrice !== undefined) {
          const roundedPrice = Math.round(medianPrice);
          console.log(`Updating item ${item.id} with enhanced listed price: ${roundedPrice}`);
          
          // Use updateItemAction which performs owner check
          const updateResult = await updateItemAction(item.id, {
            ebayListed: roundedPrice,
            ebayLastUpdated: new Date()
          });

          if (updateResult.isSuccess) {
            totalUpdated++;
          } else {
            console.error(`Failed to update item ${item.id} during enhanced refresh:`, updateResult.error);
            errors.push(`Item ${item.id} (${item.name}): ${updateResult.error}`);
          }
        } else {
           console.log(`No median price found via enhanced search for item ${item.id} (${item.name}). Skipping update.`);
        }
      } catch (error) {
        console.error(`Error processing item ${item.id} during enhanced refresh:`, error);
        errors.push(`Item ${item.id} (${item.name}): ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`Finished enhanced price refresh for user ${userId}. ${totalUpdated} items updated.`);
    if (errors.length > 0) {
      console.warn('Errors occurred during enhanced refresh:', errors);
    }
    
    // Optionally record history here as well if needed

    revalidatePath('/my-collection'); // Revalidate relevant path
    return { success: true, totalUpdated };

  } catch (error) {
    console.error('Error in refreshAllItemPricesEnhanced:', error);
    return { 
      success: false, 
      totalUpdated: 0, 
      error: error instanceof Error ? error.message : 'Failed to refresh enhanced prices' 
    };
  }
}