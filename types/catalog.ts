export type CatalogItem = {
  id: string;
  userId: string;
  name: string;
  type: string;
  franchise: string;
  brand?: string | null;
  year?: number | null;
  condition: "New" | "Used";
  acquired: Date;
  cost: number;
  value: number;
  notes: string;
  image?: string | null;
  images?: string[];
  isSold: boolean;
  soldPrice?: number | null;
  soldDate?: Date | null;
  // AI estimate fields
  aiEstimateLow?: number | null;
  aiEstimateMedium?: number | null;
  aiEstimateHigh?: number | null;
  aiConfidence?: "High" | "Medium" | "Low" | null;
  aiLastUpdated?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}; 