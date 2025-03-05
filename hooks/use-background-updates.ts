import { useEffect } from 'react';

// The interval in milliseconds between updates (24 hours)
const UPDATE_INTERVAL = 24 * 60 * 60 * 1000;
// Key for storing the last update time in localStorage
const LAST_UPDATE_KEY = 'lastEbayUpdateTime';

// Helper function for safely accessing localStorage
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Error accessing localStorage:', e);
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error('Error setting localStorage:', e);
      return false;
    }
  }
};

/**
 * Hook to trigger background eBay price updates
 * This will run once per day when the user loads the collection page
 */
export function useBackgroundUpdates() {
  useEffect(() => {
    // Don't run on server
    if (typeof window === 'undefined') return;
    
    // Check when we last triggered an update
    const lastUpdateTime = safeLocalStorage.getItem(LAST_UPDATE_KEY);
    const now = Date.now();
    
    // If we've never updated or it's been more than the update interval
    if (!lastUpdateTime || now - parseInt(lastUpdateTime) > UPDATE_INTERVAL) {
      console.log('Triggering background eBay price updates...');
      
      // Make the request in the background
      triggerBackgroundUpdate()
        .then(response => {
          if (response.success) {
            console.log(`Background update completed: ${response.message}`);
            // Update the last update time
            safeLocalStorage.setItem(LAST_UPDATE_KEY, now.toString());
          } else {
            console.error('Background update failed:', response.error);
          }
        })
        .catch(error => {
          console.error('Error triggering background update:', error);
        });
    } else {
      const nextUpdateTime = new Date(parseInt(lastUpdateTime) + UPDATE_INTERVAL);
      console.log(`Background updates were run recently. Next update due: ${nextUpdateTime.toLocaleString()}`);
    }
  }, []);
}

/**
 * Trigger a background update of eBay prices
 */
async function triggerBackgroundUpdate() {
  try {
    const response = await fetch('/api/ebay-updates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to trigger update: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error triggering background update:', error);
    throw error;
  }
} 