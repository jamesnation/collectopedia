import { NextResponse, NextRequest } from 'next/server';
import axios from 'axios';
import qs from 'querystring';
import { isValidUrl, createSecureUrl, getSecurityHeaders } from '@/utils/validate-url';
import { EbayApiQuerySchema } from '@/lib/schemas/ebay-schemas'; // Import Zod schema
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

// Tell Next.js this is a dynamic route that shouldn't be statically optimized
export const dynamic = 'force-dynamic';

const EBAY_APP_ID = process.env.EBAY_APP_ID;
const EBAY_CERT_ID = process.env.EBAY_CERT_ID;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// Set up rate limiting with a permissive limit - 10 requests per minute
// Using the same approach as the image search route for consistency
let ratelimit: Ratelimit | null = null;

// Only initialize rate limiting if KV is available
try {
  ratelimit = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    analytics: true,
    prefix: '@ebay/main-route', // Different prefix from image search for separate analytics
  });
  console.log('[eBay API Route] Rate limiting initialized successfully');
} catch (error) {
  console.warn('[eBay API Route] Failed to initialize rate limiting:', error);
  // Continue without rate limiting if initialization fails
}

// Create secure axios instances with predefined base URLs
const ebayAuthClient = axios.create({
  baseURL: 'https://api.ebay.com',
  headers: {
    ...getSecurityHeaders(),
    'Content-Type': 'application/x-www-form-urlencoded',
  }
});

const ebayBrowseClient = axios.create({
  baseURL: 'https://api.ebay.com/buy/browse/v1',
  headers: {
    ...getSecurityHeaders()
  }
});

const rapidApiClient = axios.create({
  baseURL: 'https://ebay-average-selling-price.p.rapidapi.com',
  headers: {
    ...getSecurityHeaders(),
    'content-type': 'application/json',
    'X-RapidAPI-Host': 'ebay-average-selling-price.p.rapidapi.com'
  }
});

// Define region configuration types
interface RegionConfig {
  marketplaceId: string;
  locationCountry: string;
  deliveryCountry: string;
  siteId: string;
}

// Available region configurations
const REGION_CONFIGS: Record<string, RegionConfig> = {
  US: {
    marketplaceId: 'EBAY-US',
    locationCountry: 'US',
    deliveryCountry: 'US',
    siteId: '0'  // US site ID for RapidAPI
  },
  UK: {
    marketplaceId: 'EBAY-GB',
    locationCountry: 'GB',
    deliveryCountry: 'GB',
    siteId: '3'  // UK site ID for RapidAPI
  }
};

// Default to UK if no region specified
const DEFAULT_REGION = 'UK';

console.log('EBAY_APP_ID:', EBAY_APP_ID ? 'Set' : 'Not set');
console.log('EBAY_CERT_ID:', EBAY_CERT_ID ? 'Set' : 'Not set');
console.log('RAPIDAPI_KEY:', RAPIDAPI_KEY ? 'Set' : 'Not set');

// Function to get eBay OAuth token
async function getEbayToken() {
  // Make sure we have credentials before attempting to get a token
  if (!EBAY_APP_ID || !EBAY_CERT_ID) {
    console.error('[getEbayToken] Missing API credentials');
    throw new Error('Missing eBay API credentials');
  }
  
  const auth = Buffer.from(`${EBAY_APP_ID}:${EBAY_CERT_ID}`).toString('base64');
  const data = qs.stringify({ grant_type: 'client_credentials', scope: 'https://api.ebay.com/oauth/api_scope' });

  try {
    console.log('[getEbayToken] Getting eBay token...');
    const tokenUrl = '/identity/v1/oauth2/token';
    
    const response = await ebayAuthClient.post(tokenUrl, data, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    console.log('[getEbayToken] eBay token obtained');
    return response.data.access_token;
  } catch (error) {
    console.error('[getEbayToken] Error getting eBay token:', error);
    throw error;
  }
}

// Main function to get eBay prices
async function getEbayPrices(searchTerm: string, listingType: 'listed' | 'sold', condition?: 'New' | 'Used', region: string = DEFAULT_REGION) {
  try {
    console.log(`[API-DEBUG] getEbayPrices: Starting with params:`, {
      searchTerm,
      listingType,
      condition,
      region
    });
    
    // Check if we have API credentials
    if (!EBAY_APP_ID || !EBAY_CERT_ID) {
      console.error('[API-DEBUG] getEbayPrices: Missing API credentials');
      return { 
        lowest: 0, 
        median: 0, 
        highest: 0, 
        listingType, 
        message: 'Missing API credentials' 
      };
    }
    
    // Validate and get region config
    const regionConfig = REGION_CONFIGS[region] || REGION_CONFIGS[DEFAULT_REGION];
    console.log(`[API-DEBUG] getEbayPrices: Using region config for ${region}:`, regionConfig);

    if (listingType === 'sold') {
      // Use RapidAPI for sold items
      if (!RAPIDAPI_KEY) {
        console.error('[API-DEBUG] getEbayPrices: RAPIDAPI_KEY is not set');
        return { lowest: 0, median: 0, highest: 0, listingType, message: 'API configuration error' };
      }
      
      // Add condition to keywords for sold items
      let keywords = searchTerm;
      if (condition) {
        keywords = `${keywords} ${condition}`;
        console.log(`[API-DEBUG] getEbayPrices: Adding condition "${condition}" to search term for sold items`);
      }
      
      console.log('[API-DEBUG] getEbayPrices: RapidAPI request endpoint: /findCompletedItems');
      
      try {
        const response = await rapidApiClient.post('/findCompletedItems', {
          keywords,
          max_search_results: '100',
          category_id: '9355', // Toys & Hobbies category
          site_id: regionConfig.siteId, // Dynamic based on region
          remove_outliers: true
        }, {
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY
          }
        });
        
        // Process the data from RapidAPI
        const completedItems = response.data;
        if (!completedItems || !completedItems.average_sold_price) {
          return { lowest: 0, median: 0, highest: 0, listingType, message: 'No sold items data' };
        }
        
        const averagePrice = parseFloat(completedItems.average_sold_price);
        if (isNaN(averagePrice)) {
          return { lowest: 0, median: 0, highest: 0, listingType, message: 'Invalid average price' };
        }
        
        // Extract prices for median calculation
        const itemPrices = completedItems.items
          .filter((item: any) => item.price)
          .map((item: any) => parseFloat(item.price))
          .filter((price: number) => !isNaN(price));
        
        if (itemPrices.length === 0) {
          return { lowest: 0, median: 0, highest: 0, listingType, message: 'No valid prices found' };
        }
        
        itemPrices.sort((a: number, b: number) => a - b);
        
        const lowest = itemPrices[0];
        const highest = itemPrices[itemPrices.length - 1];
        
        // Calculate the median price
        let median;
        const mid = Math.floor(itemPrices.length / 2);
        if (itemPrices.length % 2 === 0) {
          median = (itemPrices[mid - 1] + itemPrices[mid]) / 2;
        } else {
          median = itemPrices[mid];
        }
        
        // Return the results
        return { 
          lowest,
          median, 
          highest,
          listingType,
          items: completedItems.items
        };
      } catch (rapidApiError) {
        console.error('[API-DEBUG] getEbayPrices: RapidAPI request failed:', rapidApiError);
        return { 
          lowest: 0, 
          median: 0, 
          highest: 0, 
          listingType, 
          error: 'Failed to fetch sold item prices' 
        };
      }
    } else {
      // Use eBay API for active listings
      try {
        console.log('[API-DEBUG] getEbayPrices: Getting eBay OAuth token...');
        const token = await getEbayToken();
        console.log('[API-DEBUG] getEbayPrices: Successfully obtained token');
        
        // Build the filter string with region-specific values
        let filterString = `deliveryCountry:${regionConfig.deliveryCountry},itemLocationCountry:${regionConfig.locationCountry}`;
        
        // Add condition filter if provided
        if (condition) {
          console.log(`[API-DEBUG] getEbayPrices: Adding condition filter: ${condition} for active listings`);
          filterString += `,conditions:${condition.toUpperCase()}`;
        }
        
        console.log('[API-DEBUG] getEbayPrices: Preparing eBay API request with params:', {
          q: searchTerm,
          sort: 'price',
          limit: 100,
          filter: filterString
        });
        
        // Perform the request with detailed error logging
        try {
          console.log('[API-DEBUG] getEbayPrices: Sending request to /item_summary/search');
          const response = await ebayBrowseClient.get('/item_summary/search', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-EBAY-C-MARKETPLACE-ID': regionConfig.marketplaceId
            },
            params: {
              q: searchTerm,
              sort: 'price',
              limit: 100,
              filter: filterString
            }
          });
          
          console.log('[API-DEBUG] getEbayPrices: eBay API response received:', {
            status: response.status, 
            statusText: response.statusText,
            hasData: !!response.data,
            dataType: typeof response.data
          });
          
          // Add more detailed debugging for response data
          console.log('[API-DEBUG] getEbayPrices: Raw response preview:', 
            JSON.stringify(response.data).substring(0, 500) + '...');
          
          if (response.data && response.data.itemSummaries) {
            console.log('[API-DEBUG] getEbayPrices: itemSummaries count:', response.data.itemSummaries.length);
          } else {
            console.log('[API-DEBUG] getEbayPrices: No itemSummaries in response');
          }

          // Process the response
          const items = response.data.itemSummaries;
          if (!items || items.length === 0) {
            console.log('[API-DEBUG] getEbayPrices: No items found in the response');
            return { lowest: 0, median: 0, highest: 0, listingType, message: 'No active items found' };
          }

          console.log('[API-DEBUG] getEbayPrices: Found', items.length, 'items, extracting prices...');
          const prices = items
            .filter((item: any) => {
              const hasPrice = item.price && item.price.value;
              if (!hasPrice) {
                console.log('[API-DEBUG] getEbayPrices: Item missing price:', item.title);
              }
              return hasPrice;
            })
            .map((item: any) => {
              const price = parseFloat(item.price.value);
              console.log('[API-DEBUG] getEbayPrices: Parsed price for', item.title, '=', price);
              return price;
            })
            .filter((price: number) => {
              const isValid = !isNaN(price);
              if (!isValid) {
                console.log('[API-DEBUG] getEbayPrices: Invalid price found (NaN)');
              }
              return isValid;
            });

          console.log('[API-DEBUG] getEbayPrices: Valid prices count:', prices.length);
          if (prices.length === 0) {
            console.log('[API-DEBUG] getEbayPrices: No valid prices found in the items');
            return { lowest: 0, median: 0, highest: 0, listingType, message: 'No valid prices found' };
          }

          // Sort and calculate statistics
          prices.sort((a: number, b: number) => a - b);
          console.log('[API-DEBUG] getEbayPrices: Sorted prices range:', prices[0], 'to', prices[prices.length - 1]);

          const lowest = prices[0];
          const highest = prices[prices.length - 1];

          // Calculate the median price
          let median;
          const mid = Math.floor(prices.length / 2);
          if (prices.length % 2 === 0) {
            median = (prices[mid - 1] + prices[mid]) / 2;
          } else {
            median = prices[mid];
          }
          
          console.log('[API-DEBUG] getEbayPrices: Calculated price statistics:', {
            lowest,
            median,
            highest,
            pricesCount: prices.length
          });

          // Return successful result
          return { 
            lowest, 
            median, 
            highest, 
            listingType,
            items
          };
          
        } catch (ebayRequestError) {
          console.error('[API-DEBUG] getEbayPrices: eBay Browse API request failed:', ebayRequestError);
          if (axios.isAxiosError(ebayRequestError)) {
            console.error('[API-DEBUG] getEbayPrices: Axios error details:', {
              status: ebayRequestError.response?.status,
              statusText: ebayRequestError.response?.statusText,
              responseData: ebayRequestError.response?.data
            });
          }
          throw ebayRequestError;
        }
      } catch (ebayApiError) {
        console.error('[API-DEBUG] getEbayPrices: eBay API request failed:', ebayApiError);
        return { 
          lowest: 0, 
          median: 0, 
          highest: 0, 
          listingType, 
          error: 'Failed to fetch active listing prices',
          errorDetails: ebayApiError instanceof Error ? ebayApiError.message : 'Unknown error' 
        };
      }
    }
  } catch (error) {
    console.error('[API-DEBUG] getEbayPrices: Error:', error);
    return { 
      lowest: 0, 
      median: 0, 
      highest: 0, 
      listingType, 
      error: error instanceof Error ? error.message : 'Failed to fetch prices' 
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('[eBay API Route] Processing request');
    
    // Apply rate limiting if initialized
    let rateLimitHeaders = {};
    if (ratelimit) {
      try {
        // Get IP for rate limiting
        const ip = request.ip || '127.0.0.1';
        
        // Check rate limit - but don't block yet, just warn
        const { success, limit, remaining, reset } = await ratelimit.limit(ip);
        console.log(`[eBay API Route] Rate limit status: ${success ? 'OK' : 'Exceeded'}, remaining=${remaining}, reset=${reset}`);
        
        rateLimitHeaders = {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString()
        };
        
        // Only actually block if rate limit exceeded by a large margin (less than 3 remaining)
        if (!success && remaining < -3) {
          console.warn(`[eBay API Route] Rate limit significantly exceeded for IP: ${ip}`);
          return NextResponse.json({
            success: false,
            error: 'Rate limit exceeded',
            message: 'Too many requests, please try again later'
          }, { 
            status: 429,
            headers: rateLimitHeaders
          });
        }
      } catch (rateLimitError) {
        // If rate limiting fails, log but continue with the request
        console.error('[eBay API Route] Rate limiting error:', rateLimitError);
      }
    }
    
    // Extract query parameters
    const searchParams = {
      toyName: request.nextUrl.searchParams.get('toyName'),
      listingType: request.nextUrl.searchParams.get('listingType'),
      condition: request.nextUrl.searchParams.get('condition'),
      region: request.nextUrl.searchParams.get('region') || DEFAULT_REGION,
      includeItems: request.nextUrl.searchParams.get('includeItems') === 'true'
    };
    
    // Validate query parameters using Zod
    const validationResult = EbayApiQuerySchema.safeParse(searchParams);
    
    if (!validationResult.success) {
      console.error('[eBay API Route] Validation failed:', validationResult.error);
      
      // Return error response with validation details
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          validationErrors: validationResult.error.format()
        }, 
        { 
          status: 400,
          headers: rateLimitHeaders 
        }
      );
    }
    
    // Extract validated data
    const { toyName, listingType, condition, region, includeItems } = validationResult.data;
    
    // Input validation
    if (!toyName || !listingType) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters: 'toyName' and 'listingType'" },
        { 
          status: 400,
          headers: rateLimitHeaders
        }
      );
    }

    console.log('[eBay API Route] Request:', { 
      toyName, 
      listingType, 
      condition: condition || 'Any',
      region, 
      includeItems
    });

    // Comment out the URL validation that's likely causing the issue
    /*
    if (!isValidUrl(toyName)) {
      return NextResponse.json(
        { success: false, error: "Invalid toy name" }, 
        { status: 400 }
      );
    }
    */

    // Fetch prices from eBay
    const prices = await getEbayPrices(toyName, listingType, condition, region);

    if (includeItems && prices.items) {
      // Return with items data and optional rate limit headers
      return Object.keys(rateLimitHeaders).length > 0
        ? NextResponse.json(prices, { headers: rateLimitHeaders })
        : NextResponse.json(prices);
    } else {
      // Return only price data (no items) and optional rate limit headers
      const { items, ...priceData } = prices;
      return Object.keys(rateLimitHeaders).length > 0
        ? NextResponse.json(priceData, { headers: rateLimitHeaders })
        : NextResponse.json(priceData);
    }
  } catch (error) {
    console.error('[eBay API Route] Error:', error);
    
    // Determine status code
    let statusCode = 500;
    if (axios.isAxiosError(error) && error.response) {
      statusCode = error.response.status;
      console.error('[eBay API Route] Axios error response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    // Provide more detailed error for debugging
    const errorMessage = axios.isAxiosError(error) && error.response
      ? `eBay API error: ${error.response.status} ${JSON.stringify(error.response.data)}`
      : 'Failed to fetch eBay data';
    
    // Get rate limit headers if available
    let rateLimitHeaders = {};
    try {
      if (ratelimit) {
        const ip = request?.ip || '127.0.0.1';
        const { limit, remaining, reset } = await ratelimit.limit(ip);
        rateLimitHeaders = {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString()
        };
      }
    } catch (rateLimitError) {
      console.error('[eBay API Route] Error getting rate limit headers for error response:', rateLimitError);
    }
    
    // Return error response with optional rate limit headers
    return Object.keys(rateLimitHeaders).length > 0
      ? NextResponse.json(
          { success: false, error: errorMessage },
          { 
            status: statusCode,
            headers: rateLimitHeaders
          }
        )
      : NextResponse.json(
          { success: false, error: errorMessage },
          { status: statusCode }
        );
  }
}