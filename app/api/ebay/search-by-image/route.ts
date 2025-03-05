import { NextResponse } from 'next/server';
import axios from 'axios';
import qs from 'querystring';

const EBAY_APP_ID = process.env.EBAY_APP_ID;
const EBAY_CERT_ID = process.env.EBAY_CERT_ID;

// Get eBay token - reused from main eBay API route
async function getEbayToken() {
  const auth = Buffer.from(`${EBAY_APP_ID}:${EBAY_CERT_ID}`).toString('base64');
  const data = qs.stringify({ grant_type: 'client_credentials', scope: 'https://api.ebay.com/oauth/api_scope' });

  try {
    console.log('Requesting eBay token for image search...');
    const response = await axios.post('https://api.ebay.com/identity/v1/oauth2/token', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      }
    });
    console.log('eBay token response for image search:', response.status);
    return response.data.access_token;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error getting eBay token for image search:', error.response?.status);
      console.error('Error response data:', error.response?.data);
    } else {
      console.error('Error getting eBay token for image search:', error);
    }
    throw error;
  }
}

export async function POST(request: Request) {
  console.log('[eBay API Route] Starting POST request to /api/ebay/search-by-image');
  
  try {
    // Parse the request body
    const requestBody = await request.json();
    const { imageBase64, title, condition = 'new', debug = false } = requestBody;
    
    // Basic request validation
    if (!imageBase64) {
      console.error('[eBay API Route] Missing imageBase64 in request');
      return NextResponse.json({ success: false, error: 'Missing imageBase64' }, { status: 400 });
    }
    
    // Log image data length for debugging
    console.log(`[eBay API Route] Received image data (${Math.round(imageBase64.length * 0.75 / 1024)}KB), title: "${title}", condition: "${condition}"`);
    
    // Verify image is valid base64
    try {
      const bufferSize = Buffer.from(imageBase64, 'base64').length;
      console.log(`[eBay API Route] Valid base64 image, buffer size: ${bufferSize} bytes`);
    } catch (base64Error) {
      console.error('[eBay API Route] Invalid base64 data received:', base64Error);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid base64 image data',
        details: base64Error instanceof Error ? base64Error.message : 'Unknown error'
      }, { status: 400 });
    }
    
    // Get eBay OAuth token - wrap with more detailed error handling
    let oauthToken;
    try {
      console.log('[eBay API Route] Getting OAuth token...');
      oauthToken = await getEbayToken();
      console.log('[eBay API Route] Successfully obtained OAuth token');
    } catch (tokenError) {
      console.error('[eBay API Route] Error getting OAuth token:', tokenError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to authenticate with eBay API',
        details: tokenError instanceof Error ? tokenError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // Build the search request to eBay API
    const imageSearchUrl = 'https://api.ebay.com/buy/browse/v1/item_summary/search_by_image';
    
    // Log the complete filter string for debugging
    let filterString = '';
    if (condition.toLowerCase() === 'new') {
      filterString = 'conditions:{NEW}';
    } else if (condition.toLowerCase() === 'used') {
      filterString = 'conditions:{USED}';
    }
    console.log(`[eBay API Route] Using filter string: "${filterString}"`);
    
    // Prepare headers and request payload - add more logging
    const headers = {
      'Authorization': `Bearer ${oauthToken}`,
      'Content-Type': 'application/json',
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB'
    };
    console.log('[eBay API Route] Request headers:', headers);
    
    // Define proper type for the payload
    interface EbayImageSearchPayload {
      image: string;
      limit: number;
      filter?: string;
    }
    
    const payload: EbayImageSearchPayload = {
      image: imageBase64,
      limit: 100 // Increased from 50 to get more potential matches
    };
    
    if (filterString) {
      payload.filter = filterString;
    }
    
    console.log(`[eBay API Route] Making request to eBay API with payload size ~${JSON.stringify(payload).length / 1024}KB`);
    
    // DETAILED LOGGING: Add request information
    console.log(`[eBay API Route] eBay request details: ${JSON.stringify({
      url: imageSearchUrl,
      headers: {
        ...headers,
        'Authorization': 'Bearer [REDACTED]' // Don't log the actual token
      },
      payloadSize: JSON.stringify(payload).length,
      filter: filterString || 'None',
      imageDataFirstChars: payload.image.substring(0, 50) + '...'
    })}`);
    
    // Make the request to eBay with detailed error handling
    let response;
    let ebayData: any;
    
    try {
      console.log('[eBay API Route] Sending request to eBay Image Search API...');
      response = await fetch(imageSearchUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });
      
      console.log(`[eBay API Route] eBay API response status: ${response.status} ${response.statusText}`);
      console.log('[eBay API Route] eBay API response headers:', Object.fromEntries([...response.headers.entries()]));
      
      // CRITICAL DEBUGGING: Log full response for troubleshooting
      const responseText = await response.text();
      console.log(`[eBay API Route] eBay API full response: ${responseText.substring(0, 1000)}${responseText.length > 1000 ? '...' : ''}`);
      
      // Check if response was not OK
      if (!response.ok) {
        console.error(`[eBay API Route] eBay API error (${response.status}):`, responseText);
        
        return NextResponse.json({
          success: true, // Keep true to prevent UI errors
          prices: { lowest: 0, median: 0, highest: 0 },
          itemSummaries: [],
          debugData: {
            imageSearchDetails: {
              error: 'eBay API error',
              message: `eBay API returned status ${response.status}: ${responseText.substring(0, 200)}`,
              imageSearchSuccess: false,
              apiResponse: {
                status: response.status,
                statusText: response.statusText,
                errorText: responseText.substring(0, 500)
              },
              timestamp: new Date().toISOString(),
              filterString: filterString
            }
          }
        });
      }
      
      // Parse the response back to JSON for processing
      if (responseText && responseText.trim() !== '') {
        ebayData = JSON.parse(responseText);
        console.log('[eBay API Route] Successfully parsed eBay API response');
      } else {
        console.error('[eBay API Route] eBay API returned empty response');
        throw new Error('Empty response from eBay API');
      }
      
    } catch (fetchError) {
      console.error('[eBay API Route] Error with eBay API request:', fetchError);
      return NextResponse.json({ 
        success: true, // Keep true to prevent UI errors
        prices: { lowest: 0, median: 0, highest: 0 },
        itemSummaries: [],
        debugData: {
          imageSearchDetails: {
            error: 'eBay API error',
            message: fetchError instanceof Error ? fetchError.message : 'Failed to connect to eBay API',
            imageSearchSuccess: false,
            timestamp: new Date().toISOString(),
            filterString: filterString
          }
        }
      });
    }
    
    // Check if the response contains itemSummaries
    if (!ebayData.itemSummaries || ebayData.itemSummaries.length === 0) {
      console.log('[eBay API Route] No results returned from eBay image search');
      
      return NextResponse.json({
        success: true,
        prices: { lowest: 0, median: 0, highest: 0 },
        itemSummaries: [],
        debugData: {
          imageSearchDetails: {
            originalResultCount: 0,
            imageSearchSuccess: true,
            message: 'No results found for this image',
            apiResponse: {
              status: response.status,
              total: ebayData.total || 0
            },
            timestamp: new Date().toISOString(),
            filterString: filterString
          }
        }
      });
    }
    
    // We got results! Log detailed info
    console.log(`[eBay API Route] eBay returned ${ebayData.itemSummaries.length} results from image search`);
    console.log(`[eBay API Route] First few results:`, 
      ebayData.itemSummaries.slice(0, 3).map((item: any) => ({
        title: item.title,
        price: item.price?.value,
        hasImage: !!item.image
      }))
    );
    
    // Store original results for debugging
    const originalResults = ebayData.itemSummaries;
    
    // Extract prices from the results
    const prices = originalResults
      .filter((item: any) => item.price && parseFloat(item.price.value))
      .map((item: any) => parseFloat(item.price.value));
    
    // Calculate stats if we have prices
    let lowestPrice = 0;
    let medianPrice = 0;
    let highestPrice = 0;
    
    if (prices.length > 0) {
      // Sort prices for calculations
      prices.sort((a: number, b: number) => a - b);
      
      lowestPrice = prices[0];
      highestPrice = prices[prices.length - 1];
      
      // Calculate median
      const mid = Math.floor(prices.length / 2);
      medianPrice = prices.length % 2 === 0
        ? (prices[mid - 1] + prices[mid]) / 2
        : prices[mid];
    }
    
    // Return the processed data
    return NextResponse.json({
      success: true,
      prices: {
        lowest: lowestPrice,
        median: medianPrice,
        highest: highestPrice
      },
      itemSummaries: originalResults.slice(0, 20), // Renamed from items to itemSummaries to match client expectations
      debugData: {
        imageSearchDetails: {
          originalResultCount: ebayData.itemSummaries.length,
          imageSearchSuccess: true,
          timestamp: new Date().toISOString(),
          filterString: filterString
        }
      }
    });
  }
  catch (error) {
    console.error('[eBay API Route] Unhandled error in API route:', error);
    return NextResponse.json({ 
      success: true, // Keep true to prevent UI errors
      prices: { lowest: 0, median: 0, highest: 0 },
      itemSummaries: [],
      debugData: {
        imageSearchDetails: {
          error: 'Server error',
          message: error instanceof Error ? error.message : 'Unexpected server error in image search API',
          imageSearchSuccess: false,
          timestamp: new Date().toISOString()
        }
      }
    });
  }
} 