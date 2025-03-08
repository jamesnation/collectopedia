"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RegionCode, REGIONS, useRegionPreference } from '@/hooks/use-region-preference';

// Define the context type
type RegionContextType = {
  region: RegionCode;
  regionData: typeof REGIONS.US;
  changeRegion: (newRegion: RegionCode) => void;
  formatCurrency: (value: number | null | undefined) => string;
  currencySymbol: string;
};

// Create context with a default value
const RegionContext = createContext<RegionContextType | undefined>(undefined);

// Create a provider component
export function RegionProvider({ children }: { children: ReactNode }) {
  const { region, regionData, isInitialized, changeRegion } = useRegionPreference();
  
  // Format currency based on the current region
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) {
      return '-';
    }
    
    // Handle zero values
    if (value === 0) {
      return `${regionData.currency}0`;
    }
    
    // Format with region-specific currency
    return new Intl.NumberFormat('en-' + region, {
      style: 'currency',
      currency: regionData.currencyCode,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Update cookie when region changes to make it available to server components
  useEffect(() => {
    if (isInitialized) {
      document.cookie = `collectopedia_region_preference=${region}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, [region, isInitialized]);
  
  // Context value
  const contextValue: RegionContextType = {
    region,
    regionData,
    changeRegion,
    formatCurrency,
    currencySymbol: regionData.currency
  };
  
  return (
    <RegionContext.Provider value={contextValue}>
      {children}
    </RegionContext.Provider>
  );
}

// Create a hook to use the context
export function useRegionContext() {
  const context = useContext(RegionContext);
  
  if (context === undefined) {
    throw new Error('useRegionContext must be used within a RegionProvider');
  }
  
  return context;
} 