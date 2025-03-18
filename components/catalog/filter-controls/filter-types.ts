/**
 * Filter Types - Type definitions for filter components
 * 
 * Defines the common types used across filter components.
 */

// Custom entity type (for types, franchises, brands)
export interface CustomEntity {
  id: string;
  name: string;
}

// Year type (string representation of year)
export type Year = string;

// Filter option type
export interface FilterOption {
  value: string;
  label: string;
} 