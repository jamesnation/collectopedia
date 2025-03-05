"use client";

import { useState, useEffect } from 'react';

// Key for storing debug mode preference
const EBAY_DEBUG_MODE_KEY = 'collectopedia_ebay_debug_mode';

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
 * Hook to manage eBay debug mode preference
 * This allows viewing the actual eBay matches for AI price estimation
 */
export function useEbayDebugMode() {
  // Default to false (debug mode off)
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Load preference from localStorage on mount
  useEffect(() => {
    try {
      const savedPreference = safeLocalStorage.getItem(EBAY_DEBUG_MODE_KEY);
      console.log('eBay debug mode preference loaded:', savedPreference);
      
      if (savedPreference) {
        const debugEnabled = savedPreference === 'true';
        setIsDebugMode(debugEnabled);
        console.log('eBay debug mode initialized to:', debugEnabled);
      }
    } catch (error) {
      console.error('Error loading debug mode preference:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);
  
  // Toggle debug mode and save to localStorage
  const toggleDebugMode = () => {
    const newValue = !isDebugMode;
    console.log('Toggling eBay debug mode to:', newValue);
    setIsDebugMode(newValue);
    
    safeLocalStorage.setItem(EBAY_DEBUG_MODE_KEY, String(newValue));
    console.log('eBay debug mode preference saved successfully');
  };
  
  return {
    isDebugMode,
    isInitialized,
    toggleDebugMode
  };
} 