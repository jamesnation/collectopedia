/**
 * Filter Controls Barrel Export
 * 
 * This file exports all filter-related components from the filter-controls directory.
 */

// Export type definitions directly from this file
export interface CustomEntity {
  id: string;
  name: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

// This is the only export we need for now - direct import works elsewhere
export { default } from './filter-bar'; 