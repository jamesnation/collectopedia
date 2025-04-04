import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import axios from 'axios';
import qs from 'querystring';
import { isValidUrl, createSecureUrl, getSecurityHeaders } from '@/utils/validate-url';
import { EbayImageSearchBodySchema, type EbayImageSearchBody } from '@/lib/schemas/ebay-schemas';
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import { auth } from '@clerk/nextjs/server';

// Tell Next.js this is a dynamic route that shouldn't be statically optimized
export const dynamic = 'force-dynamic';

// Feature flag to enable/disable auth requirement
// Using environment variables like the main route for consistency
// Re-enable authentication with logging-only mode for testing
const REQUIRE_AUTH = process.env.EBAY_REQUIRE_AUTH !== 'false';
const AUTH_LOGGING_ONLY = true; // Keep in logging-only mode for testing

// Set environment variable info in console for debugging
console.log('[eBay Image Search API] Authentication settings:');
console.log('- REQUIRE_AUTH:', REQUIRE_AUTH ? 'Enabled' : 'Disabled');
console.log('- AUTH_LOGGING_ONLY:', AUTH_LOGGING_ONLY ? 'Enabled (auth is logged but not enforced)' : 'Disabled');
console.log('- Credentials are included in fetch request');

const EBAY_APP_ID = process.env.EBAY_APP_ID;
const EBAY_CERT_ID = process.env.EBAY_CERT_ID;

// Set up rate limiting with a more permissive limit - 10 requests per minute
// This is less likely to interfere with normal usage while still preventing abuse
let ratelimit: Ratelimit | null = null;

// Only initialize rate limiting if KV is available
try {
  ratelimit = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    analytics: true,
    prefix: '@ebay/image-search',
  });
  console.log('[eBay API Route] Rate limiting initialized successfully');
} catch (error) {
  console.warn('[eBay API Route] Failed to initialize rate limiting:', error);
  // Continue without rate limiting if initialization fails
}

// Create secure axios instance with predefined base URL
const ebayAuthClient = axios.create({
  baseURL: 'https://api.ebay.com',
  headers: {
    ...getSecurityHeaders(),
    'Content-Type': 'application/x-www-form-urlencoded',
  }
});

// Get eBay token - reused from main eBay API route
async function getEbayToken() {
  // Make sure we have credentials before attempting to get a token
  if (!EBAY_APP_ID || !EBAY_CERT_ID) {
    console.error('[getEbayToken] Missing API credentials');
    throw new Error('Missing eBay API credentials');
  }

  const auth = Buffer.from(`${EBAY_APP_ID}:${EBAY_CERT_ID}`).toString('base64');
  const data = qs.stringify({ grant_type: 'client_credentials', scope: 'https://api.ebay.com/oauth/api_scope' });

  try {
    console.log('[getEbayToken] Requesting eBay token for image search...');
    const tokenUrl = '/identity/v1/oauth2/token';
    
    const response = await ebayAuthClient.post(tokenUrl, data, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    console.log('[getEbayToken] eBay token response for image search:', response.status);
    return response.data.access_token;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[getEbayToken] Error getting eBay token for image search:', error.response?.status);
      console.error('[getEbayToken] Error response data:', error.response?.data);
    } else {
      console.error('[getEbayToken] Error getting eBay token for image search:', error);
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log('=============================================');
  console.log('[VERBOSE] Starting POST request to /api/ebay/search-by-image');
  
  // Log auth status early
  let authInfo;
  try {
    const { userId } = auth();
    authInfo = { userId, isAuthenticated: !!userId };
    console.log('[VERBOSE] Authentication info:', authInfo);
  } catch (authError) {
    console.error('[VERBOSE] Auth error:', authError);
    authInfo = { error: 'Auth error', message: authError instanceof Error ? authError.message : String(authError) };
  }
  
  // Log request headers to see if credentials are included
  console.log('[VERBOSE] Request headers:', Object.fromEntries([...request.headers.entries()]));
  
  console.log('[eBay API Route] Starting POST request to /api/ebay/search-by-image');
  
  // Check authentication if enabled
  const { userId } = auth();
  const isAuthenticated = !!userId;
  
  if (REQUIRE_AUTH) {
    console.log(`[eBay API Route] Authentication check: userId=${userId || 'not authenticated'}`);
    
    if (!isAuthenticated && !AUTH_LOGGING_ONLY) {
      console.warn('[eBay API Route] Unauthenticated request rejected');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required',
          message: 'You must be logged in to access this API'
        },
        { status: 401 }
      );
    }
  }
  
  // Apply rate limiting only if initialized
  let rateLimitHeaders = {};
  let rateLimitKey = userId || request.ip || '127.0.0.1';
  
  if (ratelimit) {
    try {
      // Use userId for rate limiting if authenticated, otherwise use IP
      console.log(`[eBay API Route] Using rate limit key: ${rateLimitKey}`);
      
      // Check rate limit - but don't block yet, just warn
      const { success, limit, remaining, reset } = await ratelimit.limit(rateLimitKey);
      console.log(`[eBay API Route] Rate limit status: ${success ? 'OK' : 'Exceeded'}, remaining=${remaining}, reset=${reset}`);
      
      rateLimitHeaders = {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString()
      };
      
      // Only actually block if rate limit exceeded by a large margin (less than 3 remaining)
      if (!success && remaining < -3) {
        console.warn(`[eBay API Route] Rate limit significantly exceeded for key: ${rateLimitKey}`);
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
  
  try {
    // Parse the request body
    console.log('[VERBOSE] Attempting to parse request body...');
    const requestBody = await request.json();
    console.log('[VERBOSE] Request body parsed successfully, size:', JSON.stringify(requestBody).length);
    
    // Validate using Zod schema
    console.log('[VERBOSE] Validating request body with Zod schema...');
    const validationResult = EbayImageSearchBodySchema.safeParse(requestBody);
    
    // If validation fails, return validation errors
    if (!validationResult.success) {
      console.error('[VERBOSE] Input validation failed:', JSON.stringify(validationResult.error.format()));
      console.error('[eBay API Route] Input validation failed:', validationResult.error.format());
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid input data',
        validationErrors: validationResult.error.format()
      }, { 
        status: 400,
        headers: rateLimitHeaders
      });
    }
    
    console.log('[VERBOSE] Validation successful!');
    
    // Extract validated data - typesafe access via Zod
    const { imageBase64, title, condition, debug } = validationResult.data;
    
    // Log image data length for debugging
    console.log(`[eBay API Route] Received valid image data (${Math.round(imageBase64.length * 0.75 / 1024)}KB), title: "${title}", condition: "${condition}", isAuthenticated: ${isAuthenticated}`);
    
    // Get eBay OAuth token - wrap with more detailed error handling
    let oauthToken;
    try {
      console.log('[VERBOSE] Getting OAuth token...');
      oauthToken = await getEbayToken();
      console.log('[VERBOSE] Successfully obtained OAuth token, length:', oauthToken.length);
    } catch (tokenError) {
      console.error('[VERBOSE] Error getting OAuth token:', tokenError);
      console.error('[eBay API Route] Error getting OAuth token:', tokenError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to authenticate with eBay API',
        details: tokenError instanceof Error ? tokenError.message : 'Unknown error'
      }, { 
        status: 500,
        headers: rateLimitHeaders
      });
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
    console.log(`[VERBOSE] Using filter string: "${filterString}"`);
    
    // Prepare headers and request payload - add more logging
    const ebayHeaders = {
      'Authorization': `Bearer ${oauthToken}`,
      'Content-Type': 'application/json',
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB'
    };
    console.log('[VERBOSE] eBay request headers:', {
      ...ebayHeaders,
      'Authorization': 'Bearer [REDACTED]' // Don't log the actual token
    });
    
    // Define proper type for the payload
    interface EbayImageSearchPayload {
      image: string;
      limit: number;
      filter?: string;
      q?: string;  // Add search query parameter
    }
    
    // STEP 1: First search using only the image
    const payload: EbayImageSearchPayload = {
      image: imageBase64,
      limit: 100 // Increased from 50 to get more potential matches
      // Removed title as query parameter for initial search
    };
    
    if (filterString) {
      payload.filter = filterString;
    }
    
    console.log(`[VERBOSE] Making request to eBay API with payload size ~${imageBase64.length} bytes`);
    
    // Make the request to eBay with detailed error handling
    let response;
    let ebayData: any;
    
    try {
      console.log('[VERBOSE] Sending request to eBay Image Search API...');
      response = await fetch(imageSearchUrl, {
        method: 'POST',
        headers: ebayHeaders,
        body: JSON.stringify(payload)
      });
      
      console.log(`[VERBOSE] eBay API response received: Status=${response.status}, OK=${response.ok}`);
      console.log('[VERBOSE] eBay API response headers:', Object.fromEntries([...response.headers.entries()]));
      
      // CRITICAL DEBUGGING: Log full response for troubleshooting
      const responseText = await response.text();
      console.log(`[VERBOSE] eBay API full response: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);
      
      // Check if response was not OK
      if (!response.ok) {
        console.error(`[VERBOSE] eBay API error (${response.status}):`, responseText);
        
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
        }, {
          headers: rateLimitHeaders
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
        }, {
          headers: rateLimitHeaders
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
      
      // STEP 2: Refine results with title keywords
      // Extract meaningful keywords from the title
      const titleWords = title.toLowerCase()
        .split(/\s+/)
        .filter((word: string) => 
          word.length > 2 && !['the', 'and', 'for', 'with', 'this', 'that', 'from'].includes(word)
        );
      
      console.log(`[eBay API Route] STEP 2: Refining results with title keywords: ${titleWords.join(', ')}`);
      
      // Score each result based on title matching
      const scoredResults = originalResults.map((item: any) => {
        if (!item.title) return { ...item, score: 0 };
        
        const itemTitleLower = item.title.toLowerCase();
        let score = 0;
        
        // Calculate match score based on:
        // 1. Exact phrase matches (highest weight)
        if (itemTitleLower.includes(title.toLowerCase())) {
          score += 100; // Exact phrase match is best
          console.log(`[eBay API Route] Exact phrase match found: "${item.title}"`);
        }
        
        // 2. Keyword matches (medium weight)
        const matchingWords = titleWords.filter((word: string) => itemTitleLower.includes(word));
        const matchPercentage = titleWords.length > 0 ? (matchingWords.length / titleWords.length) : 0;
        
        // Add proportional score based on match percentage
        score += matchPercentage * 50;
        
        // 3. Word order similarity (lower weight)
        // Check if words appear in the same order
        let orderScore = 0;
        let lastIndex = -1;
        let orderMatches = 0;
        
        for (const word of titleWords) {
          const index = itemTitleLower.indexOf(word);
          if (index > lastIndex && index !== -1) {
            orderMatches++;
            lastIndex = index;
          }
        }
        
        if (titleWords.length > 1) {
          orderScore = (orderMatches / (titleWords.length - 1)) * 20;
          score += orderScore;
        }
        
        // Log high-scoring matches
        if (score > 30) {
          console.log(`[eBay API Route] High score: ${score.toFixed(1)} for "${item.title}" (matched ${matchingWords.length}/${titleWords.length} keywords)`);
        }
        
        return { ...item, score };
      });
      
      // Sort by score (highest first) and filter low scores
      const MIN_ACCEPTABLE_SCORE = 50; // Minimum score to keep - increased from 10 for better relevance
      const filteredResults = scoredResults
        .filter((item: any) => item.score >= MIN_ACCEPTABLE_SCORE)
        .sort((a: any, b: any) => b.score - a.score);
      
      console.log(`[eBay API Route] Filtered from ${originalResults.length} to ${filteredResults.length} results after title matching`);
      
      // Use the filtered results for price calculations
      // Extract prices from the filtered results
      const prices = filteredResults
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
      
      // Update the response to include both original and filtered results
      // Include rate limit headers if available
      const responseObj = {
        success: true,
        prices: {
          lowest: lowestPrice,
          median: medianPrice,
          highest: highestPrice
        },
        itemSummaries: filteredResults.slice(0, 20), // Renamed from items to itemSummaries to match client expectations
        debugData: {
          imageSearchDetails: {
            originalResultCount: originalResults.length,
            filteredResultCount: filteredResults.length,
            imageSearchSuccess: true,
            apiResponse: {
              status: response.status,
              total: ebayData.total || 0
            },
            filterString: filterString,
            titleFilterWords: titleWords,
            timestamp: new Date().toISOString(),
            // Include both original and filtered results for debug
            originalResults: originalResults.slice(0, 10),
            filteredResults: filteredResults.slice(0, 10)
          }
        }
      };
      
      // Add rate limit headers if available, but make them optional
      return Object.keys(rateLimitHeaders).length > 0 
        ? NextResponse.json(responseObj, { headers: rateLimitHeaders })
        : NextResponse.json(responseObj);
      
    } catch (error) {
      console.error('[eBay API Route] Error with eBay API request:', error);
      
      // Add rate limit headers if available, but make them optional
      const errorResponseObj = { 
        success: true, // Keep true to prevent UI errors
        prices: { lowest: 0, median: 0, highest: 0 },
        itemSummaries: [],
        debugData: {
          imageSearchDetails: {
            error: 'eBay API error',
            message: error instanceof Error ? error.message : 'Failed to connect to eBay API',
            imageSearchSuccess: false,
            timestamp: new Date().toISOString(),
            filterString: filterString
          }
        }
      };
      
      return Object.keys(rateLimitHeaders).length > 0 
        ? NextResponse.json(errorResponseObj, { 
            status: 500,
            headers: rateLimitHeaders
          })
        : NextResponse.json(errorResponseObj, { status: 500 });
    }
  } catch (error) {
    console.error('[eBay API Route] Unexpected error:', error);
    
    // Add rate limit headers if available, but make them optional
    const unexpectedErrorObj = {
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return Object.keys(rateLimitHeaders).length > 0 
      ? NextResponse.json(unexpectedErrorObj, { 
          status: 500,
          headers: rateLimitHeaders
        })
      : NextResponse.json(unexpectedErrorObj, { status: 500 });
  }
} 