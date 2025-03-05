'use server'

import { revalidatePath } from 'next/cache'
import { getItemsByUserIdAction, updateItemAction } from './items-actions'
import { recordEbayHistoryAction } from './ebay-history-actions' // Import for recording history
import { auth } from "@clerk/nextjs/server";
import { getImagesByItemIdAction } from './images-actions' // Correct import from images-actions

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

export async function fetchEbayPrices(
  toyName: string, 
  listingType: 'listed' | 'sold', 
  condition?: 'New' | 'Used'
): Promise<{
  lowest: number | null;
  median: number | null;
  highest: number | null;
  listingType: string;
  items?: any[];
  error?: string;
}> {
  try {
    console.log(`Fetching eBay prices for "${toyName}" (${listingType}, ${condition || 'Any condition'})`);
    
    // Build the URL with query parameters
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const url = new URL('/api/ebay', baseUrl);
    url.searchParams.append('toyName', toyName);
    url.searchParams.append('listingType', listingType);
    if (condition) {
      url.searchParams.append('condition', condition);
    }
    
    // Add debug parameter to get item details
    url.searchParams.append('includeItems', 'true');

    console.log('Fetching from URL:', url.toString());
    
    // Fetch the data from our API route
    const response = await fetch(url.toString(), { next: { revalidate: 3600 } });
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`HTTP error fetching eBay prices: ${response.status} ${text}`);
      throw new Error(`HTTP error! status: ${response.status} ${text}`);
    }
    
    // Parse the response
    const data = await response.json();
    
    console.log('eBay API response:', {
      hasLowest: data.lowest !== null && data.lowest !== undefined,
      hasMedian: data.median !== null && data.median !== undefined,
      hasHighest: data.highest !== null && data.highest !== undefined,
      itemCount: data.items?.length || 0
    });
    
    // Ensure we have numeric values or null
    const result = {
      lowest: data.lowest !== undefined ? Number(data.lowest) || null : null,
      median: data.median !== undefined ? Number(data.median) || null : null,
      highest: data.highest !== undefined ? Number(data.highest) || null : null,
      listingType,
      items: data.items || []
    };
    
    // Log the processed result
    console.log('Processed eBay price data:', {
      lowest: result.lowest,
      median: result.median,
      highest: result.highest,
      itemCount: result.items.length
    });
    
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
  condition?: 'New' | 'Used'
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
    console.log(`Updating eBay ${type} prices for item "${name}" (${condition || 'Any condition'})`);
    
    const prices = await fetchEbayPrices(name, type, condition);

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
      [type === 'listed' ? 'ebayListed' : 'ebaySold']: roundedPrice
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
        
        // Update the eBay listed price - pass the item's condition
        const result = await updateEbayPrices(item.id, item.name, 'listed', item.condition);
        
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
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          title: itemTitle,
          condition: condition,
          debug: true
        }),
      });
      
      // DIAGNOSTIC LOG: Response status
      console.log(`[eBay Image Search] API response status: ${response.status} ${response.statusText}`);
      console.log(`[eBay Image Search] API response headers:`, Object.fromEntries([...response.headers.entries()]));
      
    } catch (apiError) {
      console.error(`[eBay Image Search] ERROR CALLING API: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
      throw new Error(`Failed to call search API: ${apiError instanceof Error ? apiError.message : 'API request error'}`);
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    // DIAGNOSTIC LOG: After successful API call
    console.log(`[eBay Image Search] STEP 3: API call successful with status: ${response.status}`);
    
    // Parse the response
    let data;
    try {
      data = await response.json();
      // DIAGNOSTIC LOG: Raw response data
      console.log(`[eBay Image Search] Raw API response data:`, JSON.stringify(data).substring(0, 500) + '...');
      console.log(`[eBay Image Search] Response success:`, data.success);
      console.log(`[eBay Image Search] Items count:`, (data.itemSummaries?.length || data.items?.length || 0));
      
      // Add detailed logging for the first item to debug image structure
      if (data.itemSummaries?.length > 0) {
        console.log(`[eBay Image Search] First itemSummary image structure:`, {
          hasImage: !!data.itemSummaries[0].image,
          imageType: typeof data.itemSummaries[0].image,
          imageUrlExists: !!data.itemSummaries[0].image?.imageUrl,
          imageUrl: data.itemSummaries[0].image?.imageUrl
        });
      } else if (data.items?.length > 0) {
        console.log(`[eBay Image Search] First item image structure:`, {
          hasImage: !!data.items[0].image,
          imageType: typeof data.items[0].image,
          imageUrlExists: !!data.items[0].image?.imageUrl,
          imageUrl: data.items[0].image?.imageUrl
        });
      }
    } catch (jsonError) {
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
  },
  includeDebugData: boolean = false
): Promise<{
  textBased?: { lowest: number; median: number; highest: number };
  imageBased?: { lowest: number; median: number; highest: number };
  combined?: { lowest: number; median: number; highest: number };
  debugData?: {
    textMatches?: any[];
    imageMatches?: any[];
    imageSearchDetails?: any;
    searchParams?: {
      title: string;
      imageUrl?: string;
      condition?: string;
    };
  };
}> {
  console.log(`getEnhancedEbayPrices called with debug mode: ${includeDebugData}`);
  
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
        condition: item.condition
      }
    };
  } else {
    console.log('Debug mode is disabled, no debug data will be collected');
  }
  
  // Get text-based results (use existing function)
  try {
    console.log('Fetching text-based results for:', item.title);
    const textResults = await fetchEbayPrices(
      item.title, 
      'listed', 
      item.condition as 'New' | 'Used' | undefined
    );
    
    if (textResults && typeof textResults === 'object') {
      result.textBased = {
        lowest: textResults.lowest || 0,
        median: textResults.median || 0,
        highest: textResults.highest || 0
      };
      
      console.log('Text-based results:', result.textBased);
      
      // Store raw items data for debug mode
      if (includeDebugData && textResults.items) {
        console.log(`Found ${textResults.items.length} text matches for debug`);
        
        // Log the first item to debug image structure
        if (textResults.items.length > 0) {
          console.log(`First text match item structure:`, {
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
    } else {
      console.log('No valid text results returned:', textResults);
      // Set default values to prevent undefined errors
      result.textBased = { lowest: 0, median: 0, highest: 0 };
    }
  } catch (error) {
    console.error('Error getting text-based eBay prices:', error);
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
            image: item.image || (item.imageUrl ? { imageUrl: item.imageUrl } : undefined)
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
  
  // Calculate combined results with weighted averaging
  if (result.textBased || result.imageBased) {
    result.combined = calculateCombinedPrice(result.textBased, result.imageBased);
    console.log('Combined results calculated:', result.combined);
  } else {
    console.log('Unable to calculate combined results - no valid source data');
    // Set default values to prevent undefined errors
    result.combined = { lowest: 0, median: 0, highest: 0 };
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
 * Calculate a combined price from text-based and image-based searches
 * Now completely prioritizes image-based results when available
 */
function calculateCombinedPrice(
  textBased?: { lowest: number; median: number; highest: number } | null,
  imageBased?: { lowest: number; median: number; highest: number } | null
) {
  console.log('Calculating combined price with inputs:', { textBased, imageBased });

  // Handle cases where only one result type is available
  if (!textBased && !imageBased) {
    console.log('No price data available for combination');
    return { lowest: 0, median: 0, highest: 0 };
  }
  
  if (!textBased) {
    console.log('Only image-based prices available, using those directly');
    return imageBased;
  }
  
  if (!imageBased) {
    console.log('Only text-based prices available, using those directly');
    return textBased;
  }

  // Determine if image-based data has zero values
  const imageHasZeros = imageBased.lowest === 0 && imageBased.median === 0 && imageBased.highest === 0;
  
  // If image-based results are available and not all zeros, use them exclusively
  if (!imageHasZeros) {
    console.log('Image-based prices available, prioritizing them completely');
    return imageBased;
  }
  
  // If image-based results are all zeros, fall back to text-based
  console.log('Image-based prices are all zeros, falling back to text-based prices');
  return textBased;
}

/**
 * Updates all items for a user with enhanced eBay prices using both image and text search
 * Performance optimized to process items in batches
 */
export async function refreshAllItemPricesEnhanced(
  userId: string
): Promise<{
  success: boolean;
  totalUpdated: number;
  error?: string;
}> {
  try {
    console.log('Starting enhanced batch price refresh for user:', userId);
    
    // Fetch all user's items
    const itemsResult = await getItemsByUserIdAction(userId);
    if (!itemsResult.isSuccess) {
      return { success: false, totalUpdated: 0, error: 'Failed to fetch items' };
    }
    
    const items = itemsResult.data || [];
    console.log(`Found ${items.length} items to process`);
    
    // Get image info for each item (we'll need the primary image for visual search)
    const itemImages: Record<string, string | undefined> = {};
    
    // Batch the image fetching in groups of 10 to avoid overwhelming the connection
    const BATCH_SIZE = 10;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      
      // Fetch images for this batch in parallel
      await Promise.all(batch.map(async (item) => {
        try {
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
    
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      
      // Process this batch in parallel
      await Promise.all(batch.map(async (item) => {
        try {
          // Get the enhanced prices using both text and image search
          const result = await getEnhancedEbayPrices({
            title: item.name,
            image: itemImages[item.id],
            condition: item.condition
          });
          
          // Extract the best price (prefer combined, then image-based, then text-based)
          const bestPrice = result.combined?.median || 
                            result.imageBased?.median || 
                            result.textBased?.median;
          
          if (bestPrice) {
            // Update the item in the database
            await updateItemAction(item.id, {
              ebayListed: bestPrice
            });
            
            // Track total value and count
            totalListedValue += bestPrice;
            totalUpdated++;
          }
        } catch (itemError) {
          console.error(`Failed to update item ${item.id}:`, itemError);
        }
      }));
      
      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < items.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Record the eBay history if any items were updated
    if (totalUpdated > 0) {
      await recordEbayHistoryAction(totalListedValue);
    }
    
    return {
      success: true,
      totalUpdated
    };
  } catch (error) {
    console.error('Error in refreshAllItemPricesEnhanced:', error);
    return {
      success: false,
      totalUpdated: 0,
      error: error instanceof Error ? error.message : 'Failed to update all eBay prices'
    };
  }
}

/**
 * Updates all items for a user with eBay prices (text-based search only)
 */
export async function refreshAllEbayPrices(
  userId: string
): Promise<{
  success: boolean;
  totalUpdated: number;
  error?: string;
}> {
  try {
    console.log('Starting batch price refresh for user:', userId);
    
    // Fetch all user's items
    const itemsResult = await getItemsByUserIdAction(userId);
    if (!itemsResult.isSuccess) {
      return { success: false, totalUpdated: 0, error: 'Failed to fetch items' };
    }
    
    const items = itemsResult.data || [];
    console.log(`Found ${items.length} items to process`);
    
    // Process items in batches to prevent overwhelming the system
    let totalUpdated = 0;
    let totalListedValue = 0;
    const BATCH_SIZE = 5; // Smaller batch size for text-only search
    
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      
      // Process this batch in parallel
      await Promise.all(batch.map(async (item) => {
        try {
          const result = await updateEbayPrices(item.id, item.name, 'listed', item.condition);
          
          if (result.success && result.prices?.median) {
            totalListedValue += result.prices.median;
            totalUpdated++;
          }
        } catch (itemError) {
          console.error(`Failed to update item ${item.id}:`, itemError);
        }
      }));
      
      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < items.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Record the eBay history if any items were updated
    if (totalUpdated > 0) {
      await recordEbayHistoryAction(totalListedValue);
    }
    
    return {
      success: true,
      totalUpdated
    };
  } catch (error) {
    console.error('Error in refreshAllEbayPrices:', error);
    return {
      success: false,
      totalUpdated: 0,
      error: error instanceof Error ? error.message : 'Failed to update all eBay prices'
    };
  }
}