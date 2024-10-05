const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
console.log('API_URL:', API_URL); // Keep this for debugging

const fetchWithCredentials = (url, options = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
    },
  });
};

// Remove this function as it's duplicated
// async function fetchToys() {
//   ...
// }

export const fetchToys = async () => {
  try {
    const url = `${API_URL}/collection`;
    console.log('Fetching from:', url);
    const response = await fetchWithCredentials(url);
    console.log('Response status:', response.status);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Fetched data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching toys:', error);
    throw error;
  }
};

export const addToy = async (formData) => {
  const response = await fetch(`${API_URL}/collection`, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type header, let the browser set it with the correct boundary
  });
  if (!response.ok) {
    throw new Error('Failed to add toy');
  }
  return response.json();
};

export const updateToy = async (id, toyData) => {
  try {
    let body;
    let headers = {};

    if (toyData instanceof FormData) {
      body = toyData;
    } else {
      body = JSON.stringify(toyData);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}/collection/${id}`, {
      method: 'PUT',
      headers,
      body,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update toy');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error updating toy:', error);
    throw error;
  }
};


export const deleteToy = async (id) => {
  const response = await fetch(`${API_URL}/collection/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete toy');
  }
  return response.json();
};

export const fetchToy = async (id) => {
  const response = await fetch(`${API_URL}/collection/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch toy');
  }
  return response.json();
};

// In api.js
export const fetchToyById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/collection/${id}`);
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Server response:', errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching toy:', error);
    throw error;
  }
};

export const fetchEbayPrices = async (toyName, listingType = 'active') => {
  try {
    console.log(`Fetching eBay prices for ${toyName}, listingType: ${listingType}`);
    const response = await fetch(`${API_URL}/ebay-prices/${encodeURIComponent(toyName)}?listingType=${listingType}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Received eBay price data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching eBay prices:', error);
    throw error;
  }
};
