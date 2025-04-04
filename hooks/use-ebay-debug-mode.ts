"use client";

import { useState, useEffect } from 'react';
import { useAdminCheck } from './use-admin-check';

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
 * Only available to admin users
 */
export function useEbayDebugMode() {
  // Default to false (debug mode off)
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Check if user is an admin
  const { isAdmin, isLoading: isAdminLoading } = useAdminCheck();
  
  // Load preference from localStorage on mount
  useEffect(() => {
    if (isAdminLoading) return; // Wait until admin status is loaded
    
    try {
      // Only load preference if user is an admin
      if (isAdmin) {
        const savedPreference = safeLocalStorage.getItem(EBAY_DEBUG_MODE_KEY);
        console.log('eBay debug mode preference loaded:', savedPreference);
        
        if (savedPreference) {
          const debugEnabled = savedPreference === 'true';
          setIsDebugMode(debugEnabled);
          console.log('eBay debug mode initialized to:', debugEnabled);
        }
      } else {
        // If user is not an admin, ensure debug mode is off
        console.log('Non-admin user, disabling debug mode');
        setIsDebugMode(false);
        // Clear any previously saved preference
        safeLocalStorage.setItem(EBAY_DEBUG_MODE_KEY, 'false');
      }
    } catch (error) {
      console.error('Error loading debug mode preference:', error);
    } finally {
      setIsInitialized(true);
    }
  }, [isAdmin, isAdminLoading]);
  
  // Toggle debug mode and save to localStorage
  const toggleDebugMode = () => {
    // Only allow admins to toggle debug mode
    if (!isAdmin) {
      console.warn('Non-admin user attempted to toggle debug mode');
      return;
    }
    
    const newValue = !isDebugMode;
    console.log('Toggling eBay debug mode to:', newValue);
    setIsDebugMode(newValue);
    
    safeLocalStorage.setItem(EBAY_DEBUG_MODE_KEY, String(newValue));
    console.log('eBay debug mode preference saved successfully');
  };
  
  return {
    isDebugMode: isAdmin && isDebugMode, // Only return true if user is admin AND debug mode is on
    isInitialized,
    toggleDebugMode
  };
} 