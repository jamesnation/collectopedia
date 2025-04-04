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
    
    console.log(`[DETAILED DEBUG] fetchEbayPrices called for "${toyName}" (${listingType}, ${condition || 'Any condition'}, Franchise: ${franchise || 'Any'}, Region: ${effectiveRegion})`);
    
    // Build the URL with query parameters
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const url = new URL('/api/ebay', baseUrl);
    
    // Create search term that includes franchise if provided
    let searchTerm = toyName;
    if (franchise && franchise.trim() && !['Other', 'Unknown'].includes(franchise)) {
      searchTerm = `${franchise} ${toyName}`;
      console.log('[DETAILED DEBUG] Added franchise to search term:', { originalName: toyName, franchise, finalSearchTerm: searchTerm });
    } else {
      console.log('[DETAILED DEBUG] Using original name without franchise:', { toyName, franchise: franchise || 'None', reason: !franchise ? 'No franchise' : franchise === 'Other' || franchise === 'Unknown' ? 'Excluded franchise' : 'Empty franchise' });
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

    console.log('[DETAILED DEBUG] Fetching from URL:', url.toString());
    
    // Fetch the data from our API route
    console.log('[DETAILED DEBUG] Starting fetch request to eBay API endpoint');
    const response = await fetch(url.toString(), { next: { revalidate: 3600 } });
    console.log('[DETAILED DEBUG] Fetch response received:', { 
      status: response.status, 
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`[DETAILED DEBUG] HTTP error fetching eBay prices: ${response.status} ${text}`);
      throw new Error(`HTTP error! status: ${response.status} ${text}`);
    }
    
    // Parse the response
    const responseText = await response.text();
    console.log('[DETAILED DEBUG] Raw response text length:', responseText.length);
    console.log('[DETAILED DEBUG] Raw response preview:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('[DETAILED DEBUG] Successfully parsed JSON response');
    } catch (parseError) {
      console.error('[DETAILED DEBUG] Error parsing JSON response:', parseError);
      throw new Error('Failed to parse response from eBay API');
    }
    
    console.log('[DETAILED DEBUG] eBay API response data:', {
      hasLowest: data.lowest !== null && data.lowest !== undefined,
      hasMedian: data.median !== null && data.median !== undefined,
      hasHighest: data.highest !== null && data.highest !== undefined,
      lowestValue: data.lowest,
      medianValue: data.median,
      highestValue: data.highest,
      itemCount: data.items?.length || 0,
      message: data.message,
      success: data.success,
      error: data.error,
      firstTwoItems: data.items?.slice(0, 2)
    });
    
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
    
    // Log the processed result
    console.log('[DETAILED DEBUG] Processed eBay price data:', {
      lowest: result.lowest,
      median: result.median,
      highest: result.highest,
      itemCount: result.items.length,
      message: result.message,
      error: result.error
    });
    
    // If we got no results AND we were using a franchise in the search term, retry with just the toy name
    if (result.lowest === null && result.median === null && result.highest === null && 
        searchTerm !== toyName && franchise && franchise.trim()) {
      console.log('[DETAILED DEBUG] No results found with franchise in search term. Retrying with just the toy name.');
      
      // Use just the toy name without franchise
      url.searchParams.set('toyName', toyName);
      
      console.log('[DETAILED DEBUG] Fetching from fallback URL:', url.toString());
      const fallbackResponse = await fetch(url.toString(), { next: { revalidate: 3600 } });
      
      if (!fallbackResponse.ok) {
        console.error(`[DETAILED DEBUG] HTTP error in fallback request: ${fallbackResponse.status}`);
        return result; // Return original (empty) result if fallback failed
      }
      
      // Process the fallback response
      const fallbackResponseText = await fallbackResponse.text();
      const fallbackData = JSON.parse(fallbackResponseText);
      
      if (fallbackData.lowest !== undefined || fallbackData.median !== undefined || fallbackData.highest !== undefined) {
        console.log('[DETAILED DEBUG] Fallback search successful, found results with generic search');
        
        // Override with fallback data
        result.lowest = fallbackData.lowest !== undefined ? Number(fallbackData.lowest) || null : null;
        result.median = fallbackData.median !== undefined ? Number(fallbackData.median) || null : null;
        result.highest = fallbackData.highest !== undefined ? Number(fallbackData.highest) || null : null;
        result.items = fallbackData.items || [];
      }
    }
    
    return result;
  } catch (error) {
    console.error('[DETAILED DEBUG] Error fetching eBay prices:', error);
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

    console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} Prices (${condition || 'Any Condition'}):`, prices);

    // Check if prices.median is undefined or null
    if (prices.median === undefined || prices.median === null) {
      console.error('No valid median price found');
      return { success: false, error: 'No valid price data found' };
    }

    // Round the median price to the nearest whole number
    const roundedPrice = Math.round(prices.median);
    console.log(`Rounded median price: ${roundedPrice}`);

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
 * Performance optimized by:
 * - Using a debounce system to prevent excessive API calls
 * - Only processing primary images
 * - Adding lightweight caching
 * - Limiting results to essential data
 */
export async function searchEbayByImage(
  imageUrl: string | null,
  itemTitle: string,
  condition: string = "new",
  cacheKey?: string
): Promise<EbaySearchResult> {
  const startTime = Date.now();
  
  // DIAGNOSTIC LOG: Starting point
  console.log(`[eBay Image Search] STARTING with image URL: ${imageUrl?.substring(0, 30)}...`);
  console.log(`[eBay Image Search] Item title: "${itemTitle}", Condition: "${condition}"`);
  
  if (!imageUrl) {
    console.warn("[searchEbayByImage] No image URL provided");
    return {
      success: true,
      prices: { lowest: 0, median: 0, highest: 0 },
      items: [],
      debugData: {
        imageSearchDetails: {
          error: "Image processing error",
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

  console.log(`[searchEbayByImage] Starting search for image: ${imageUrl.substring(0, 30)}...`);
  
  try {
    // Fetch the image and convert to base64
    console.log(`[eBay Image Search] STEP 1: Fetching image from URL`);
    
    // DIAGNOSTIC LOG: Add pre-fetch logging
    console.log(`[eBay Image Search] Full image URL being fetched: ${imageUrl}`);
    
    let imageResponse;
    try {
      imageResponse = await fetch(imageUrl);
      
      // DIAGNOSTIC LOG: Response status
      console.log(`[eBay Image Search] Image fetch response status: ${imageResponse.status} ${imageResponse.statusText}`);
      console.log(`[eBay Image Search] Image fetch headers:`, Object.fromEntries([...imageResponse.headers.entries()]));
      
    } catch (fetchError) {
      console.error(`[eBay Image Search] ERROR FETCHING IMAGE: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
      throw new Error(`Failed to fetch image: ${fetchError instanceof Error ? fetchError.message : 'Network error'}`);
    }
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    
    // DIAGNOSTIC LOG: After successful fetch
    console.log(`[eBay Image Search] Image successfully fetched with status: ${imageResponse.status}`);
    
    let imageBuffer;
    try {
      imageBuffer = await imageResponse.arrayBuffer();
      // DIAGNOSTIC LOG: Buffer size
      console.log(`[eBay Image Search] Image array buffer size: ${imageBuffer.byteLength} bytes`);
    } catch (bufferError) {
      console.error(`[eBay Image Search] ERROR CREATING BUFFER: ${bufferError instanceof Error ? bufferError.message : String(bufferError)}`);
      throw new Error(`Failed to process image data: ${bufferError instanceof Error ? bufferError.message : 'Buffer processing error'}`);
    }
    
    let base64Image;
    try {
      base64Image = Buffer.from(imageBuffer).toString('base64');
      const imageSizeKB = Math.round(base64Image.length * 0.75 / 1024);
      console.log(`[eBay Image Search] Image converted to base64 (${imageSizeKB}KB), first 100 chars: ${base64Image.substring(0, 100)}...`);
      
      if (imageSizeKB > 5000) {
        console.warn(`[eBay Image Search] WARNING: Image is large (${imageSizeKB}KB), which may cause issues`);
      }
    } catch (base64Error) {
      console.error(`[eBay Image Search] ERROR CONVERTING TO BASE64: ${base64Error instanceof Error ? base64Error.message : String(base64Error)}`);
      throw new Error(`Failed to encode image: ${base64Error instanceof Error ? base64Error.message : 'Encoding error'}`);
    }
    
    // Construct absolute URL for the API endpoint
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/ebay/search-by-image`;
    console.log(`[eBay Image Search] STEP 2: Using API endpoint: ${apiUrl}`);
    
    // DIAGNOSTIC LOG: Request payload
    console.log(`[eBay Image Search] Request payload: title = "${itemTitle}", condition = "${condition}", image data length = ${base64Image.length} chars`);
    
    // Send the image to our API
    let response;
    try {
      console.log('[VERBOSE-CLIENT] About to send request to image search API:', {
        url: apiUrl,
        withCredentials: true,
        titleLength: itemTitle.length,
        imageDataLength: base64Image.length
      });
      
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Added to include authentication cookies
        body: JSON.stringify({
          imageBase64: base64Image,
          title: itemTitle,
          condition: condition,
          debug: true
        }),
      });
      
      // DIAGNOSTIC LOG: Response status
      console.log(`[VERBOSE-CLIENT] API response status: ${response.status} ${response.statusText}`);
      console.log(`[VERBOSE-CLIENT] API response ok: ${response.ok}`);
      console.log(`[VERBOSE-CLIENT] API response headers:`, Object.fromEntries([...response.headers.entries()]));
      
    } catch (apiError) {
      console.error(`[VERBOSE-CLIENT] ERROR CALLING API:`, apiError);
      console.error(`[eBay Image Search] ERROR CALLING API: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
      throw new Error(`Failed to call search API: ${apiError instanceof Error ? apiError.message : 'API request error'}`);
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    // DIAGNOSTIC LOG: After successful API call
    console.log(`[VERBOSE-CLIENT] STEP 3: API call successful with status: ${response.status}`);
    
    // Parse the response
    let data;
    try {
      console.log('[VERBOSE-CLIENT] Getting response text...');
      const responseText = await response.text();
      console.log(`[VERBOSE-CLIENT] Response text length: ${responseText.length}`);
      console.log(`[VERBOSE-CLIENT] Response text preview: ${responseText.substring(0, 200)}...`);
      
      console.log('[VERBOSE-CLIENT] Parsing JSON...');
      data = JSON.parse(responseText);
      
      // DIAGNOSTIC LOG: Raw response data
      console.log(`[VERBOSE-CLIENT] Raw API response data:`, {
        success: data.success,
        hasItems: !!(data.itemSummaries?.length || data.items?.length),
        itemCount: (data.itemSummaries?.length || data.items?.length || 0),
        hasPrices: !!data.prices,
        hasDebugData: !!data.debugData
      });
      
      // Add detailed logging for the first item to debug image structure
      if (data.itemSummaries?.length > 0) {
        console.log(`[VERBOSE-CLIENT] First itemSummary image structure:`, {
          hasImage: !!data.itemSummaries[0].image,
          imageType: typeof data.itemSummaries[0].image,
          imageUrlExists: !!data.itemSummaries[0].image?.imageUrl,
          imageUrl: data.itemSummaries[0].image?.imageUrl
        });
      } else if (data.items?.length > 0) {
        console.log(`[VERBOSE-CLIENT] First item image structure:`, {
          hasImage: !!data.items[0].image,
          imageType: typeof data.items[0].image,
          imageUrlExists: !!data.items[0].image?.imageUrl,
          imageUrl: data.items[0].image?.imageUrl
        });
      } else {
        console.log('[VERBOSE-CLIENT] No items found in response');
      }
    } catch (jsonError) {
      console.error(`[VERBOSE-CLIENT] ERROR PARSING JSON:`, jsonError);
      console.error(`[eBay Image Search] ERROR PARSING JSON: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
      throw new Error(`Failed to parse API response: ${jsonError instanceof Error ? jsonError.message : 'JSON parsing error'}`);
    }
    
    // DIAGNOSTIC LOG: Debug data
    if (data.debugData?.imageSearchDetails) {
      console.log(`[eBay Image Search] Debug data from API:`, {
        originalResultCount: data.debugData.imageSearchDetails.originalResultCount,
        error: data.debugData.imageSearchDetails.error,
        message: data.debugData.imageSearchDetails.message,
        imageSearchSuccess: data.debugData.imageSearchDetails.imageSearchSuccess
      });
    }

    // Check if there was an error in the API response
    if (data.error) {
      console.error('eBay image search API returned error:', data.error);
      console.error('Details:', data.details);
      
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
    // Detailed error logging
    const errorType = imageError instanceof Error ? imageError.constructor.name : typeof imageError;
    const errorMessage = imageError instanceof Error ? imageError.message : String(imageError);
    const errorStack = imageError instanceof Error ? imageError.stack : undefined;
    
    console.error(`[searchEbayByImage] Image processing error:`, {
      type: errorType,
      message: errorMessage,
      imageUrl: imageUrl?.substring(0, 50) + '...',
      stack: errorStack
    });
    
    // Create a descriptive error message based on error type
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
          errorType: errorType,
          imageUrl: imageUrl?.substring(0, 100) + '...',
          timestamp: new Date().toISOString()
        }
      }
    };
  }
}

/**
 * Enhanced function to get eBay pricing data using both text and image search
 * When debug mode is enabled, it also returns the matching items
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
  console.log(`getEnhancedEbayPrices called with debug mode: ${includeDebugData}`);
  console.log('Item details:', { 
    title: item.title, 
    franchise: item.franchise, 
    condition: item.condition,
    region: item.region
  });
  
  const result: any = {};
  
  // Initialize debug data if requested
  if (includeDebugData) {
    console.log('Debug mode is enabled, initializing debug data structure');
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
  } else {
    console.log('Debug mode is disabled, no debug data will be collected');
  }
  
  // Get text-based results with franchise
  const textResults = await fetchEbayPrices(
    item.title,
    'listed',
    item.condition as 'New' | 'Used' | undefined,
    item.franchise,
    getRegionFromCookie()
  );
  
  // Add more detailed logging about the text results
  console.log('[ENHANCED-DEBUG] Text results received:', {
    hasResults: !!textResults,
    hasMedian: textResults?.median !== undefined && textResults?.median !== null,
    medianValue: textResults?.median,
    hasError: !!textResults?.error,
    errorMessage: textResults?.error,
    message: textResults?.message
  });

  if (textResults && typeof textResults === 'object') {
    result.textBased = {
      lowest: textResults.lowest || 0,
      median: textResults.median || 0,
      highest: textResults.highest || 0
    };
    
    console.log('[ENHANCED-DEBUG] Text-based results processed:', result.textBased);
    
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
        console.log(`[ENHANCED-DEBUG] Found ${textResults.items.length} text matches for debug`);
        
        // Log the first item to debug image structure
        if (textResults.items.length > 0) {
          console.log(`[ENHANCED-DEBUG] First text match item structure:`, {
            hasImage: !!textResults.items[0].image,
            imageType: typeof textResults.items[0].image,
            hasImageUrl: !!textResults.items[0].imageUrl,
            imageUrlType: typeof textResults.items[0].imageUrl,
            fullItem: JSON.stringify(textResults.items[0]).substring(0, 500) + '...'
          });
        }
        
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
    console.log('No valid text results returned:', textResults);
    // Set default values to prevent undefined errors
    result.textBased = { lowest: 0, median: 0, highest: 0 };
  }
  
  // Get image-based results if an image is available
  if (item.image) {
    try {
      console.log('Fetching image-based results for image URL:', item.image.substring(0, 50) + '...');
      const imageResults = await searchEbayByImage(
        item.image,
        item.title,
        item.condition as 'New' | 'Used' | undefined,
        `ebay_img_${item.image?.split('/').pop()}`
      );
      
      if (imageResults.success && imageResults.prices) {
        result.imageBased = imageResults.prices;
        console.log('Image-based results:', result.imageBased);
        
        // Store raw items data for debug mode
        if (includeDebugData && (imageResults.items || imageResults.itemSummaries)) {
          const imageItems = imageResults.itemSummaries || imageResults.items || [];
          console.log(`Found ${imageItems.length} image matches for debug`);
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
            console.log('Added detailed image search debug data');
          }
        }
      } else {
        console.log('Image search unsuccessful or no prices returned:', imageResults);
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
  
  // Log debug info to help troubleshoot
  if (includeDebugData) {
    console.log('Debug data summary:', {
      hasTextMatches: result.debugData.textMatches?.length > 0,
      textMatchCount: result.debugData.textMatches?.length || 0,
      hasImageMatches: result.debugData.imageMatches?.length > 0,
      imageMatchCount: result.debugData.imageMatches?.length || 0,
      searchParams: result.debugData.searchParams
    });
  }
  
  return result;
}

/**
 * Updates all items for the authenticated user with enhanced eBay prices using both image and text search.
 * Fetches user items, gets primary images, processes in batches, and updates prices.
 */
export async function refreshAllItemPricesEnhanced(): Promise<{
  success: boolean;
  totalUpdated: number;
  error?: string;
}> {
  // Add Clerk authentication check
  const { userId } = auth();
  if (!userId) {
    console.error('[refreshAllItemPricesEnhanced] Authentication required.');
    return { success: false, totalUpdated: 0, error: "Authentication required." };
  }
  
  try {
    console.log('Starting enhanced batch price refresh for user:', userId);
    
    // Fetch all user's items using the authenticated userId
    const itemsResult = await getItemsByUserIdAction(userId); // Relies on auth check within getItemsByUserIdAction
    if (!itemsResult.isSuccess) {
      console.error('[refreshAllItemPricesEnhanced] Failed to fetch items:', itemsResult.error);
      return { success: false, totalUpdated: 0, error: 'Failed to fetch items' };
    }
    
    const items = itemsResult.data || [];
    if (items.length === 0) {
      console.log('[refreshAllItemPricesEnhanced] No items found for user, exiting.');
      return { success: true, totalUpdated: 0 };
    }
    console.log(`[refreshAllItemPricesEnhanced] Found ${items.length} items to process`);
    
    // Get image info for each item (we'll need the primary image for visual search)
    const itemImages: Record<string, string | undefined> = {};
    
    // Batch the image fetching in groups of 10 to avoid overwhelming the connection
    const IMAGE_BATCH_SIZE = 10;
    console.log(`[refreshAllItemPricesEnhanced] Fetching images in batches of ${IMAGE_BATCH_SIZE}`);
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
          console.warn(`[refreshAllItemPricesEnhanced] Couldn't fetch images for item ${item.id}:`, error);
        }
      }));
      console.log(`[refreshAllItemPricesEnhanced] Processed image batch ${Math.floor(i / IMAGE_BATCH_SIZE) + 1}`);
    }
    
    console.log(`[refreshAllItemPricesEnhanced] Found images for ${Object.keys(itemImages).length} items`);
    
    // Process items in batches to prevent overwhelming the system
    let totalUpdated = 0;
    let totalListedValue = 0;
    const PRICE_BATCH_SIZE = 5; // Smaller batch size for pricing to avoid rate limits
    console.log(`[refreshAllItemPricesEnhanced] Processing prices in batches of ${PRICE_BATCH_SIZE}`);

    for (let i = 0; i < items.length; i += PRICE_BATCH_SIZE) {
      const batch = items.slice(i, i + PRICE_BATCH_SIZE);
      
      // Process this batch in parallel
      await Promise.all(batch.map(async (item) => {
        try {
          console.log(`[refreshAllItemPricesEnhanced] Processing item: ${item.name} (ID: ${item.id})`);
          
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
            console.log(`[refreshAllItemPricesEnhanced] Updating item ${item.id} with price: ${bestPrice}`);
            // updateItemAction already checks auth internally
            await updateItemAction(item.id, {
              ebayListed: bestPrice,
              ebayLastUpdated: new Date()
            });
            
            // Track total value and count
            totalListedValue += bestPrice;
            totalUpdated++;
          } else {
            console.log(`[refreshAllItemPricesEnhanced] No valid price found for item ${item.id}, skipping update.`);
          }
        } catch (itemError) {
          console.error(`[refreshAllItemPricesEnhanced] Failed to process item ${item.id}:`, itemError);
        }
      }));
      
      console.log(`[refreshAllItemPricesEnhanced] Processed price batch ${Math.floor(i / PRICE_BATCH_SIZE) + 1}`);
      // Small delay between batches to avoid rate limits
      if (i + PRICE_BATCH_SIZE < items.length) {
        console.log(`[refreshAllItemPricesEnhanced] Waiting 500ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Record the eBay history if any items were updated
    if (totalUpdated > 0) {
      console.log(`[refreshAllItemPricesEnhanced] Recording eBay history: ${totalUpdated} items, total value ${totalListedValue}`);
      // recordEbayHistoryAction already checks auth internally
      await recordEbayHistoryAction(totalListedValue);
    }
    
    console.log(`[refreshAllItemPricesEnhanced] Batch update completed. Total items updated: ${totalUpdated}`);
    revalidatePath('/settings'); // Revalidate settings page where this is often triggered
    return {
      success: true,
      totalUpdated
    };
  } catch (error) {
    console.error('[refreshAllItemPricesEnhanced] Error in batch update:', error);
    return {
      success: false,
      totalUpdated: 0,
      error: error instanceof Error ? error.message : 'Failed to update all eBay prices'
    };
  }
}