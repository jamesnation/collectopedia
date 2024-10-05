const EbayNodeApi = require('ebay-node-api');
const axios = require('axios');
const qs = require('querystring');

require('dotenv').config();

const ebay = new EbayNodeApi({
  clientID: process.env.EBAY_APP_ID,
  clientSecret: process.env.EBAY_CERT_ID,
  env: 'PRODUCTION', // Use 'SANDBOX' for testing
  headers: {
    'X-EBAY-C-MARKETPLACE-ID': 'EBAY-GB' // Change to 'EBAY-US' for US market
  }
});

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

async function getEbayPrices(searchTerm, listingType = 'active') {
  try {
    console.log(`getEbayPrices called with searchTerm: ${searchTerm}, listingType: ${listingType}`);
    console.log('Getting eBay access token...');
    await ebay.getAccessToken();
    console.log('eBay access token obtained successfully');

    console.log(`Searching eBay ${listingType} items with term:`, searchTerm);

    let data;
    if (listingType === 'sold') {
      console.log('Using RapidAPI for sold items');
      // Use RapidAPI for sold items
      const options = {
        method: 'POST',
        url: 'https://ebay-average-selling-price.p.rapidapi.com/findCompletedItems',
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'ebay-average-selling-price.p.rapidapi.com'
        },
        data: {
          keywords: searchTerm,
          max_search_results: '100',
          category_id: '9355', // You might want to make this dynamic
          site_id: '3', // UK site ID
          remove_outliers: true
        }
      };

      const response = await axios.request(options);
      data = response.data;
      console.log('RapidAPI response:', data);
    } else {
      console.log('Using eBay API for active listings');
      // Use existing searchItems for active listings
      data = await ebay.searchItems({
        keyword: searchTerm,
        sortOrder: 'PricePlusShippingLowest',
        limit: '100',
        filter: {
          itemLocationCountry: 'GB',
          deliveryCountry: 'GB'
        },
        marketplace: 'EBAY_GB'
      });
      console.log('eBay API response:', data);
    }

    console.log('eBay search completed');

    if (listingType === 'sold') {
      // Process RapidAPI response
      if (data.results === 0) {
        console.log('No sold items found');
        return { lowest: null, median: null, highest: null, listingType, message: 'No sold items found' };
      }
      console.log(`Found ${data.results} sold items`);
      console.log(`Extracted ${data.results} valid prices`);
      console.log('All extracted prices:', data.products.map(p => p.sale_price));

      return {
        lowest: data.min_price,
        median: data.median_price,
        highest: data.max_price,
        listingType
      };
    } else {
      // Process active listings
      let parsedData = data;
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
        } catch (parseError) {
          console.error('Error parsing eBay API response:', parseError);
          return { lowest: null, median: null, highest: null, listingType, message: 'Error parsing eBay response' };
        }
      }

      if (!parsedData || typeof parsedData.total === 'undefined') {
        console.error('Invalid response structure from eBay API:', JSON.stringify(parsedData));
        return { lowest: null, median: null, highest: null, listingType, message: 'Invalid eBay response structure' };
      }

      if (parsedData.total === 0) {
        console.log('No active items found');
        return { lowest: null, median: null, highest: null, listingType, message: 'No active items found' };
      }

      if (!parsedData.itemSummaries || !Array.isArray(parsedData.itemSummaries)) {
        console.error('Unexpected response structure from eBay API:', JSON.stringify(parsedData));
        return { lowest: null, median: null, highest: null, listingType, message: 'Unexpected eBay response structure' };
      }

      const items = parsedData.itemSummaries;
      console.log(`Found ${items.length} active items`);

      const prices = items
        .filter(item => item.price && item.price.value)
        .map(item => {
          const price = parseFloat(item.price.value);
          return isNaN(price) ? null : price;
        })
        .filter(price => price !== null);

      console.log(`Extracted ${prices.length} valid prices`);
      console.log('All extracted prices:', prices);

      if (prices.length === 0) {
        console.log('No valid prices found');
        return { lowest: null, median: null, highest: null, listingType, message: 'No valid prices found' };
      }

      prices.sort((a, b) => a - b);
      const lowest = prices[0];
      const highest = prices[prices.length - 1];
      const median = prices[Math.floor(prices.length / 2)];

      console.log('Calculated prices:', { lowest, median, highest });
      return { lowest, median, highest, listingType };
    }
  } catch (error) {
    console.error('Error in getEbayPrices:', error);
    return { lowest: null, median: null, highest: null, listingType, message: 'Error fetching eBay prices' };
  }
}

async function getEbayPublicKey(keyId) {
  try {
    const token = await getEbayToken();
    const response = await axios.get(`https://api.ebay.com/commerce/notification/v1/public_key/${keyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data.key;
  } catch (error) {
    console.error('Error fetching eBay public key:', error);
    throw error;
  }
}

module.exports = { getEbayPrices, getEbayPublicKey };