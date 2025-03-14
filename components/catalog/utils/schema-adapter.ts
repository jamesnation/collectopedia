import { SelectItem } from "@/db/schema/items-schema";

// Define internal types that are not dependent on the schema
export interface CatalogItem {
  id: string;
  userId: string;
  name: string;
  type: string;
  franchise: string;
  brand: string | null;
  year: number | null;
  condition: "New" | "Used";
  acquired: Date | string;
  cost: number;
  value: number;
  image: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  isSold: boolean;
  soldPrice: number | null;
  soldDate: Date | null;
  images?: string[];
  ebayListed?: number | null;
  ebaySold?: number | null;
}

export interface CustomEntity {
  id: string;
  name: string;
}

// Transform from schema type to component type
export const mapSchemaItemToCatalogItem = (item: SelectItem): CatalogItem => {
  return {
    ...item,
    // Ensure dates are properly converted if needed
    acquired: item.acquired instanceof Date ? item.acquired : new Date(item.acquired),
    soldDate: item.soldDate ? (item.soldDate instanceof Date ? item.soldDate : new Date(item.soldDate)) : null,
    createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt),
    updatedAt: item.updatedAt instanceof Date ? item.updatedAt : new Date(item.updatedAt),
  };
};

// Transform from component type to schema type for sending to the server
export const mapCatalogItemToSchemaItem = (item: CatalogItem) => {
  // Create a new object with all properties except those that need special handling
  const { notes, soldDate, soldPrice, image, ebayListed, ebaySold, ...rest } = item;
  
  return {
    ...rest,
    // Transform any fields that need special handling
    acquired: item.acquired instanceof Date ? item.acquired : new Date(item.acquired),
    // Convert null values to undefined for the schema
    soldDate: soldDate || undefined,
    soldPrice: soldPrice || undefined,
    image: image || undefined,
    ebayListed: ebayListed || undefined,
    ebaySold: ebaySold || undefined,
    // Ensure notes is always a string
    notes: notes || '',
  };
};

// Constants for hard-coded options
export const CONDITION_OPTIONS = ["New", "Used"];

// These could be fetched from an API or config file instead of hardcoded
export const DEFAULT_BRANDS = [
  'Hasbro',
  'Toyworld',
  'Mattel',
  'Playmates',
  'Sunbrow',
  'Kenner',
  'Mirage Studios',
  'Filmation',
  'Neca',
  'Super7',
  'Takara',
  'Games Workshop',
  'Senate',
  'Other',
  'Medium',
  'Dead X',
  'WWF'
]; 