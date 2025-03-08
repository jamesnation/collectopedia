"use client";

import { REGIONS, RegionCode } from "@/hooks/use-region-preference";

/**
 * Format a number as currency based on region preference
 * @param value The number value to format
 * @param region Region code ('US' or 'UK')
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | null | undefined, region: RegionCode = 'US'): string {
  if (value === null || value === undefined) {
    return '-';
  }
  
  const regionData = REGIONS[region];
  
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
}

/**
 * Extract the currency symbol from a formatted currency string
 */
export function getCurrencySymbol(region: RegionCode = 'US'): string {
  return REGIONS[region].currency;
} 