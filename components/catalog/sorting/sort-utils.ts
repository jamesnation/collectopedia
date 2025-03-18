/**
 * Sort Utilities
 * 
 * Utility functions for sorting items in the catalog.
 */

import { SelectItem as Item } from '@/db/schema/items-schema';
import { SortOption } from '../context/catalog-context';
import { SortOptionConfig } from './sort-dropdown';

/**
 * Default sort options for the catalog
 */
export const defaultSortOptions: SortOptionConfig[] = [
  { value: 'createdAt', label: 'Date Added: Newest', direction: 'desc' },
  { value: 'createdAt', label: 'Date Added: Oldest', direction: 'asc' },
  { value: 'name', label: 'Name: A-Z', direction: 'asc' },
  { value: 'name', label: 'Name: Z-A', direction: 'desc' },
  { value: 'value', label: 'Value: High to Low', direction: 'desc' },
  { value: 'value', label: 'Value: Low to High', direction: 'asc' },
  { value: 'cost', label: 'Cost: High to Low', direction: 'desc' },
  { value: 'cost', label: 'Cost: Low to High', direction: 'asc' },
  { value: 'year', label: 'Year: Newest', direction: 'desc' },
  { value: 'year', label: 'Year: Oldest', direction: 'asc' },
  { value: 'type', label: 'Type', direction: 'asc' },
  { value: 'franchise', label: 'Franchise', direction: 'asc' },
];

/**
 * Get the default sort option
 */
export const getDefaultSortOption = (): SortOption => {
  return {
    column: 'createdAt',
    direction: 'desc',
  };
};

/**
 * Sort function for items
 */
export const sortItems = (items: Item[], sortOption: SortOption): Item[] => {
  const { column, direction } = sortOption;
  
  return [...items].sort((a, b) => {
    let valueA = getItemPropertyValue(a, column);
    let valueB = getItemPropertyValue(b, column);
    
    // Handle null/undefined values
    if (valueA === null || valueA === undefined) {
      return direction === 'asc' ? -1 : 1;
    }
    if (valueB === null || valueB === undefined) {
      return direction === 'asc' ? 1 : -1;
    }
    
    // Sort based on value type
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return direction === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }
    
    // For dates, convert to timestamps
    if (valueA instanceof Date && valueB instanceof Date) {
      valueA = valueA.getTime();
      valueB = valueB.getTime();
    }
    
    // For numbers and date timestamps
    return direction === 'asc' 
      ? Number(valueA) - Number(valueB)
      : Number(valueB) - Number(valueA);
  });
};

/**
 * Get a property value from an item for sorting
 */
export const getItemPropertyValue = (item: Item, property: string): any => {
  switch (property) {
    case 'name':
    case 'type':
    case 'franchise':
    case 'brand':
      return item[property] || '';
    case 'year':
    case 'value':
    case 'cost':
      return item[property] || 0;
    case 'createdAt':
    case 'updatedAt':
    case 'acquired':
      return item[property] || new Date(0);
    case 'soldPrice':
      return item.soldPrice || 0;
    case 'soldDate':
      return item.soldDate || new Date(0);
    default:
      return item[property as keyof Item] || null;
  }
}; 