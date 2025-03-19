/**
 * Form Utilities - Helper functions and components for form validation
 */

import { z } from 'zod';

/**
 * Creates a numeric schema for the add item form
 */
export function createCostValueSchema() {
  return z.preprocess(
    (val) => {
      // Handle empty string, null or undefined
      if (val === '' || val === null || val === undefined) return 0;
      const num = Number(val);
      // Ensure we have a non-negative number
      return isNaN(num) ? 0 : Math.max(0, num);
    },
    z.number().nonnegative('Value cannot be negative').default(0)
  );
}

/**
 * Creates a nullable string schema that converts empty strings to null
 */
export function createNullableStringSchema() {
  return z.preprocess(
    (val) => {
      return val === '' ? null : val;
    },
    z.string().nullable().optional()
  );
}

/**
 * Creates a required string schema with a minimum length
 */
export function createRequiredStringSchema(
  minLength = 1, 
  errorMessage = 'This field is required'
) {
  return z.string().min(minLength, errorMessage);
}

/**
 * Formats a number as currency
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Helper to safely parse numeric inputs
 */
export function parseNumericInput(value: string, defaultValue = 0): number {
  if (value === '') return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
} 