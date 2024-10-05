import { NextResponse } from 'next/server';
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

async function getEbayPrices(searchTerm: string, listingType: 'listed' | 'sold') {
  try {
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
      console.log('eBay API request URL:', 'https://api.ebay.com/buy/browse/v1/item_summary/search');
      console.log('eBay API request params:', {
        q: searchTerm,
        sort: 'price',
        limit: 100,
        filter: 'deliveryCountry:GB,itemLocationCountry:GB'
      });
      const response = await axios.get('https://api.ebay.com/buy/browse/v1/item_summary/search', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY-GB'
        },
        params: {
          q: searchTerm,
          sort: 'price',
          limit: 100,
          filter: 'deliveryCountry:GB,itemLocationCountry:GB'
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
      return {
        lowest: prices[0],
        median: prices[Math.floor(prices.length / 2)],
        highest: prices[prices.length - 1],
        listingType
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const toyName = searchParams.get('toyName');
  const listingType = searchParams.get('listingType') as 'listed' | 'sold';

  console.log('Received request for:', { toyName, listingType });
  console.log('Environment:', process.env.NODE_ENV);

  if (!toyName || !listingType) {
    console.error('Missing parameters:', { toyName, listingType });
    return NextResponse.json({ error: 'Missing toyName or listingType parameter' }, { status: 400 });
  }

  try {
    const prices = await getEbayPrices(toyName, listingType);
    console.log(`eBay prices for ${toyName} (${listingType}):`, prices);
    return NextResponse.json(prices);
  } catch (error) {
    console.error('Error fetching eBay prices:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch eBay prices', 
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}