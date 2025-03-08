"use client";

import { useState, useEffect } from 'react';

// Key for storing region preference
const REGION_PREFERENCE_KEY = 'collectopedia_region_preference';

// Available regions with their data
export const REGIONS = {
  US: {
    code: 'US',
    currency: '$',
    currencyCode: 'USD',
    ebayMarketplace: 'EBAY-US',
    locationCountry: 'US',
    deliveryCountry: 'US',
    siteId: '0', // US site ID for RapidAPI
    label: 'United States'
  },
  UK: {
    code: 'UK',
    currency: '£',
    currencyCode: 'GBP',
    ebayMarketplace: 'EBAY-GB',
    locationCountry: 'GB',
    deliveryCountry: 'GB',
    siteId: '3', // UK site ID for RapidAPI
    label: 'United Kingdom'
  }
};

export type RegionCode = keyof typeof REGIONS;

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
 * Hook to manage region and currency preference
 */
export function useRegionPreference() {
  // Default to US region
  const [region, setRegion] = useState<RegionCode>('US');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Load preference from localStorage on mount
  useEffect(() => {
    try {
      const savedPreference = safeLocalStorage.getItem(REGION_PREFERENCE_KEY);
      console.log('Region preference loaded:', savedPreference);
      
      if (savedPreference && (savedPreference === 'US' || savedPreference === 'UK')) {
        setRegion(savedPreference as RegionCode);
        console.log('Region initialized to:', savedPreference);
      }
    } catch (error) {
      console.error('Error loading region preference:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);
  
  // Change region and save to localStorage
  const changeRegion = (newRegion: RegionCode) => {
    console.log('Changing region to:', newRegion);
    setRegion(newRegion);
    
    safeLocalStorage.setItem(REGION_PREFERENCE_KEY, newRegion);
    console.log('Region preference saved successfully');
  };
  
  return {
    region,
    regionData: REGIONS[region],
    isInitialized,
    changeRegion
  };
} 