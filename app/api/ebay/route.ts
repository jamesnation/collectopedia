import { NextResponse, NextRequest } from 'next/server';
import axios from 'axios';
import qs from 'querystring';

const EBAY_APP_ID = process.env.EBAY_APP_ID;
const EBAY_CERT_ID = process.env.EBAY_CERT_ID;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

console.log('EBAY_APP_ID:', EBAY_APP_ID ? 'Set' : 'Not set');
console.log('EBAY_CERT_ID:', EBAY_CERT_ID ? 'Set' : 'Not set');
console.log('RAPIDAPI_KEY:', RAPIDAPI_KEY ? 'Set' : 'Not set');

async function getEbayToken() {
  const auth = Buffer.from(`${EBAY_APP_ID}:${EBAY_CERT_ID}`).toString('base64');
  const data = qs.stringify({ grant_type: 'client_credentials', scope: 'https://api.ebay.com/oauth/api_scope' });

  try {
    console.log('Requesting eBay token...');
    console.log('Auth header (first 10 chars):', auth.substring(0, 10));
    console.log('Token request URL:', 'https://api.ebay.com/identity/v1/oauth2/token');
    console.log('Token request data:', data);
    const response = await axios.post('https://api.ebay.com/identity/v1/oauth2/token', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      }
    });
    console.log('eBay token response:', response.status, response.statusText);
    return response.data.access_token;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error getting eBay token:', error.response?.status, error.response?.statusText);
      console.error('Error response data:', error.response?.data);
    } else {
      console.error('Error getting eBay token:', error);
    }
    throw error;
  }
}

async function getEbayPrices(searchTerm: string, listingType: 'listed' | 'sold', condition?: 'New' | 'Used') {
  try {
    console.log(`Getting eBay prices for search term: "${searchTerm}", type: ${listingType}, condition: ${condition || 'Any'}`);
    
    if (listingType === 'sold') {
      // Use RapidAPI for sold items
      const options = {
        method: 'POST',
        url: 'https://ebay-average-selling-price.p.rapidapi.com/findCompletedItems',
        headers: {
          'content-type': 'application/json',
          'x-rapidapi-host': 'ebay-average-selling-price.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY
        },
        data: {
          keywords: searchTerm,
          excluded_keywords: "",
          max_search_results: "100",
          category_id: "9355",
          remove_outliers: true,
          site_id: "3",
          aspects: []
        }
      };

      // If condition is provided, add a filter for it
      if (condition) {
        console.log(`Adding condition filter: ${condition} for sold items`);
        // RapidAPI doesn't seem to support condition filtering directly
        // We can modify the keywords to include the condition
        options.data.keywords = `${options.data.keywords} ${condition}`;
      }

      const response = await axios.request(options);
      const data = response.data;

      if (data.results === 0) {
        return { lowest: null, median: null, highest: null, listingType, message: 'No sold items found' };
      }

      return {
        lowest: data.min_price,
        median: data.median_price,
        highest: data.max_price,
        listingType
      };
    } else {
      // Use eBay API for active listings
      const token = await getEbayToken();
      
      // Build the filter string - start with existing filters
      let filterString = 'deliveryCountry:GB,itemLocationCountry:GB';
      
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
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY-GB'
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
      
      // Process items for debug mode - extract only what we need
      const processedItems = items.slice(0, 5).map((item: any) => ({
        id: item.itemId,
        title: item.title,
        price: item.price?.value,
        currency: item.price?.currency,
        image: item.image?.imageUrl,
        url: item.itemWebUrl,
        condition: item.condition
      }));
      
      return {
        lowest: prices[0],
        median: prices[Math.floor(prices.length / 2)],
        highest: prices[prices.length - 1],
        listingType,
        items: processedItems // Include items for debug mode
      };
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error in getEbayPrices:', error.response?.status, error.response?.statusText);
      console.error('Error response data:', error.response?.data);
    } else {
      console.error('Error in getEbayPrices:', error);
    }
    return { lowest: null, median: null, highest: null, listingType, message: 'Error fetching eBay prices' };
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const toyName = searchParams.get('toyName');
    const listingType = searchParams.get('listingType') as 'listed' | 'sold';
    const condition = searchParams.get('condition') as 'New' | 'Used' | undefined;
    
    console.log('eBay API route received request:', {
      toyName,
      listingType,
      condition,
      fullUrl: request.nextUrl.toString()
    });
    
    if (!toyName) {
      return NextResponse.json({ error: 'Missing toyName parameter' }, { status: 400 });
    }
    
    if (!listingType || !['listed', 'sold'].includes(listingType)) {
      return NextResponse.json({ error: 'Invalid listingType parameter' }, { status: 400 });
    }
    
    // Get prices from eBay - toyName already includes franchise if provided
    const prices = await getEbayPrices(toyName, listingType, condition);
    
    return NextResponse.json(prices);
  } catch (error) {
    console.error('Error in eBay API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}