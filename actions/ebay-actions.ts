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
 * This should be called from the cron job
 */
export async function updateAllEbayListedValues(userId: string) {
  try {
    // Use the passed in userId instead of getting it from auth
    if (!userId) {
      return { success: false, error: 'User ID not provided' };
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
        
        // Update the eBay listed price - pass the item's condition and franchise
        const result = await updateEbayPrices(item.id, item.name, 'listed', item.condition, getRegionFromCookie());
        
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
 * Updates all items for the authenticated user with enhanced eBay prices using both image and text search.
 * Fetches user items, gets primary images, processes in batches, and updates prices.
 */
export async function refreshAllItemPricesEnhanced(userId: string): Promise<{
  success: boolean;
  totalUpdated: number;
  error?: string;
}> {
  // Check for userId instead of using auth()
  if (!userId) {
    console.error('[refreshAllItemPricesEnhanced] User ID not provided.');
    return { success: false, totalUpdated: 0, error: "User ID not provided." };
  }
  
  try {
    console.log('Starting enhanced batch price refresh for user:', userId);
    
    // Fetch all user's items using the provided userId
    const itemsResult = await getItemsByUserIdAction(userId);
    if (!itemsResult.isSuccess) {
      console.error('Failed to fetch items:', itemsResult.error);
      return { success: false, totalUpdated: 0, error: 'Failed to fetch items' };
    }
    
    const items = itemsResult.data || [];
    if (items.length === 0) {
      console.log('No items found for user, exiting.');
      return { success: true, totalUpdated: 0 };
    }
    console.log(`Found ${items.length} items to process`);
    
    // Get image info for each item (we'll need the primary image for visual search)
    const itemImages: Record<string, string | undefined> = {};
    
    // Batch the image fetching in groups of 10 to avoid overwhelming the connection
    const IMAGE_BATCH_SIZE = 10;
    console.log(`Fetching images in batches of ${IMAGE_BATCH_SIZE}`);
    for (let i = 0; i < items.length; i += IMAGE_BATCH_SIZE) {
      const batch = items.slice(i, i + IMAGE_BATCH_SIZE);
      
      // Fetch images for this batch in parallel
      await Promise.all(batch.map(async (item) => {
        try {
          // getImagesByItemIdAction already checks auth internally
          const imagesResult = await getImagesByItemIdAction(item.id);
          if (imagesResult.isSuccess && imagesResult.data && imagesResult.data.length > 0) {
            itemImages[item.id] = imagesResult.data[0].url; // Use primary image
          }
        } catch (error) {
          console.warn(`Couldn't fetch images for item ${item.id}:`, error);
        }
      }));
    }
    
    console.log(`Found images for ${Object.keys(itemImages).length} items`);
    
    // Process items in batches to prevent overwhelming the system
    let totalUpdated = 0;
    let totalListedValue = 0;
    const PRICE_BATCH_SIZE = 5; // Smaller batch size for pricing to avoid rate limits
    console.log(`Processing prices in batches of ${PRICE_BATCH_SIZE}`);

    for (let i = 0; i < items.length; i += PRICE_BATCH_SIZE) {
      const batch = items.slice(i, i + PRICE_BATCH_SIZE);
      
      // Process this batch in parallel
      await Promise.all(batch.map(async (item) => {
        try {
          console.log(`Processing item: ${item.name} (ID: ${item.id})`);
          
          // Get the enhanced prices using both text and image search
          const result = await getEnhancedEbayPrices({
            title: item.name.trim(),
            image: itemImages[item.id],
            condition: item.condition,
            franchise: item.franchise,
            region: getRegionFromCookie() // Use region from cookie preference
          }, false); // Keep debug mode off for batch updates
          
          // Extract the best price (prefer image-based, then text-based)
          const bestPrice = (result.imageBased && result.imageBased.median > 0) 
                            ? result.imageBased.median 
                            : result.textBased?.median || 0;
          
          if (bestPrice > 0) {
            console.log(`Updating item ${item.id} with price: ${bestPrice}`);
            // updateItemAction already checks auth internally
            await updateItemAction(item.id, {
              ebayListed: bestPrice,
              ebayLastUpdated: new Date()
            });
            
            // Track total value and count
            totalListedValue += bestPrice;
            totalUpdated++;
          } else {
            console.log(`No valid price found for item ${item.id}, skipping update.`);
          }
        } catch (itemError) {
          console.error(`Failed to process item ${item.id}:`, itemError);
        }
      }));
      
      // Small delay between batches to avoid rate limits
      if (i + PRICE_BATCH_SIZE < items.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Record the eBay history if any items were updated
    if (totalUpdated > 0) {
      console.log(`Recording eBay history: ${totalUpdated} items, total value ${totalListedValue}`);
      // recordEbayHistoryAction already checks auth internally
      await recordEbayHistoryAction(totalListedValue);
    }
    
    console.log(`Batch update completed. Total items updated: ${totalUpdated}`);
    revalidatePath('/settings'); // Revalidate settings page where this is often triggered
    return {
      success: true,
      totalUpdated
    };
  } catch (error) {
    console.error('Error in batch update:', error);
    return {
      success: false,
      totalUpdated: 0,
      error: error instanceof Error ? error.message : 'Failed to update all eBay prices'
    };
  }
}