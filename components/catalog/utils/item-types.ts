/**
 * Item Types - Extended type definitions for catalog items
 * 
 * This file extends the base SelectItem type from the schema with additional
 * properties that may be added during runtime (like ebayPrice).
 */

import { SelectItem } from '@/db/schema/items-schema';
import { 
  CatalogItem as OriginalCatalogItem,
  mapSchemaItemToCatalogItem,
  mapCatalogItemToSchemaItem 
} from './schema-adapter';

/**
 * Extended item type that includes additional properties like ebayPrice
 * that may be added at runtime but aren't in the base schema.
 * 
 * We use the original CatalogItem as the base to ensure compatibility.
 */
export interface CatalogItem extends OriginalCatalogItem {
  // Additional properties for eBay integration
  ebayPrice?: number;
  
  // Properties for analysis
  priceChange?: number;
  profitMargin?: number;
}

/**
 * Re-export the schema adapter functions for simpler imports
 */
export {
  mapSchemaItemToCatalogItem,
  mapCatalogItemToSchemaItem
};

/**
 * Type guard to check if an item has ebay price information
 */
export function hasEbayPrice(item: CatalogItem): boolean {
  return item.ebayPrice !== undefined && item.ebayPrice !== null;
}

/**
 * Type guard to check if an item is sold
 */
export function isItemSold(item: CatalogItem): boolean {
  return !!item.isSold;
} 