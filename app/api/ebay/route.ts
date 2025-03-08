import { NextResponse, NextRequest } from 'next/server';
import axios from 'axios';
import qs from 'querystring';

const EBAY_APP_ID = process.env.EBAY_APP_ID;
const EBAY_CERT_ID = process.env.EBAY_CERT_ID;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

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
  const auth = Buffer.from(`${EBAY_APP_ID}:${EBAY_CERT_ID}`).toString('base64');
  const data = qs.stringify({ grant_type: 'client_credentials', scope: 'https://api.ebay.com/oauth/api_scope' });

  try {
    console.log('Getting eBay token...');
    const response = await axios.post('https://api.ebay.com/identity/v1/oauth2/token', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      }
    });
    console.log('eBay token obtained');
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting eBay token:', error);
    throw error;
  }
}

// Main function to get eBay prices
async function getEbayPrices(searchTerm: string, listingType: 'listed' | 'sold', condition?: 'New' | 'Used', region: string = DEFAULT_REGION) {
  try {
    // Validate and get region config
    const regionConfig = REGION_CONFIGS[region] || REGION_CONFIGS[DEFAULT_REGION];
    console.log(`Using region config for ${region}:`, regionConfig);

    if (listingType === 'sold') {
      // Use RapidAPI for sold items
      const options = {
        method: 'POST',
        url: 'https://ebay-average-selling-price.p.rapidapi.com/findCompletedItems',
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'ebay-average-selling-price.p.rapidapi.com'
        },
        data: {
          keywords: searchTerm,
          max_search_results: '100',
          category_id: '9355', // Toys & Hobbies category
          site_id: regionConfig.siteId, // Dynamic based on region
          remove_outliers: true
        }
      };
      
      // Add condition to keywords for sold items
      if (condition) {
        options.data.keywords = `${options.data.keywords} ${condition}`;
        console.log(`Adding condition "${condition}" to search term for sold items`);
      }
      
      console.log('RapidAPI request URL:', options.url);
      console.log('RapidAPI request data:', options.data);
      
      const response = await axios.request(options);
      
      // Process the data from RapidAPI
      const completedItems = response.data;
      if (!completedItems || !completedItems.average_sold_price) {
        return { lowest: null, median: null, highest: null, listingType, message: 'No sold items data' };
      }
      
      const averagePrice = parseFloat(completedItems.average_sold_price);
      if (isNaN(averagePrice)) {
        return { lowest: null, median: null, highest: null, listingType, message: 'Invalid average price' };
      }
      
      // Extract prices for median calculation
      const itemPrices = completedItems.items
        .filter((item: any) => item.price)
        .map((item: any) => parseFloat(item.price))
        .filter((price: number) => !isNaN(price));
      
      if (itemPrices.length === 0) {
        return { lowest: null, median: null, highest: null, listingType, message: 'No valid prices found' };
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
    } else {
      // Use eBay API for active listings
      const token = await getEbayToken();
      
      // Build the filter string with region-specific values
      let filterString = `deliveryCountry:${regionConfig.deliveryCountry},itemLocationCountry:${regionConfig.locationCountry}`;
      
      // Add condition filter if provided
      if (condition) {
        console.log(`Adding condition filter: ${condition} for active listings`);
        filterString += `,conditions:${condition.toUpperCase()}`;
      }
      
      console.log('eBay API request URL:', 'https://api.ebay.com/buy/browse/v1/item_summary/search');
      console.log('eBay API request params:', {
        q: searchTerm,
        sort: 'price',
        limit: 100,
        filter: filterString
      });
      console.log('eBay API token (first 10 chars):', token.substring(0, 10));
      
      const response = await axios.get('https://api.ebay.com/buy/browse/v1/item_summary/search', {
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
      console.log('eBay API response:', response.status, response.statusText);

      const items = response.data.itemSummaries;
      if (!items || items.length === 0) {
        return { lowest: null, median: null, highest: null, listingType, message: 'No active items found' };
      }

      const prices = items
        .filter((item: any) => item.price && item.price.value)
        .map((item: any) => parseFloat(item.price.value))
        .filter((price: number) => !isNaN(price));

      if (prices.length === 0) {
        return { lowest: null, median: null, highest: null, listingType, message: 'No valid prices found' };
      }

      prices.sort((a: number, b: number) => a - b);

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

      return { 
        lowest, 
        median, 
        highest, 
        listingType,
        items
      };
    }
  } catch (error) {
    console.error('Error fetching eBay prices:', error);
    return { lowest: null, median: null, highest: null, listingType, error: 'Failed to fetch prices' };
  }
}

export async function GET(request: NextRequest) {
  try {
    const toyName = request.nextUrl.searchParams.get('toyName');
    const listingType = request.nextUrl.searchParams.get('listingType') as 'listed' | 'sold';
    const conditionParam = request.nextUrl.searchParams.get('condition');
    const condition = conditionParam === 'New' || conditionParam === 'Used' ? conditionParam : undefined;
    const includeItems = request.nextUrl.searchParams.get('includeItems') === 'true';
    const region = request.nextUrl.searchParams.get('region') || DEFAULT_REGION;
    
    if (!toyName) {
      return NextResponse.json({ error: 'Missing toyName parameter' }, { status: 400 });
    }
    
    if (!listingType || (listingType !== 'listed' && listingType !== 'sold')) {
      return NextResponse.json({ error: 'Invalid or missing listingType parameter' }, { status: 400 });
    }
    
    console.log(`eBay API request for "${toyName}" (${listingType}, ${condition || 'Any'}, Region: ${region})`);
    
    // Get prices from eBay
    const prices = await getEbayPrices(toyName, listingType, condition, region);
    
    // Prepare the response
    const response: any = {
      lowest: prices.lowest,
      median: prices.median,
      highest: prices.highest,
      listingType: prices.listingType
    };
    
    // Include items in response if requested
    if (includeItems && prices.items) {
      response.items = prices.items;
    }
    
    // Include error message if present
    if (prices.error) {
      response.error = prices.error;
    }
    
    // Include informational message if present
    if (prices.message) {
      response.message = prices.message;
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in eBay API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}