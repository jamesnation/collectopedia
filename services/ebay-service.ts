import axios from 'axios';
import qs from 'querystring';

interface EbayPrices {
  lowest: number | null;
  median: number | null;
  highest: number | null;
  listingType: string;
  message?: string;
}

async function getEbayToken() {
  const auth = Buffer.from(`${process.env.EBAY_APP_ID}:${process.env.EBAY_CERT_ID}`).toString('base64');
  const data = qs.stringify({ grant_type: 'client_credentials', scope: 'https://api.ebay.com/oauth/api_scope' });

  try {
    const response = await axios.post('https://api.ebay.com/identity/v1/oauth2/token', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      }
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting eBay token:', error);
    throw error;
  }
}

export async function getEbayPrices(searchTerm: string, listingType: 'listed' | 'sold'): Promise<EbayPrices> {
  try {
    console.log(`getEbayPrices called with searchTerm: ${searchTerm}, listingType: ${listingType}`);
    
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
  } catch (error) {
    console.error('Error in getEbayPrices:', error);
    if (axios.isAxiosError(error)) {
      console.error('Error response data:', error.response?.data);
    }
    return { lowest: null, median: null, highest: null, listingType, message: 'Error fetching eBay prices' };
  }
} 