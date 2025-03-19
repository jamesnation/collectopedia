/**
 * Filter Controls Barrel Export
 * 
 * This file exports all filter-related components from the filter-controls directory.
 * Updated to use named exports per TypeScript standards.
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

// Export the components using named exports
export { FilterBar } from './filter-bar';
export { FilterDropdown } from './filter-dropdown';
export { SearchInput } from './search-input';
export { ActiveFilters } from './active-filters';
export type { FilterBarProps } from './filter-bar';
export type { FilterDropdownProps } from './filter-dropdown';
export type { SearchInputProps } from './search-input';
export type { ActiveFiltersProps } from './active-filters'; 