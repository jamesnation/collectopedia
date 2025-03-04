import { SelectItem } from "@/db/schema/items-schema";

// Mock the eBay service if the import fails
let getEbayPrices: (searchTerm: string, listingType: 'listed' | 'sold') => Promise<{
  lowest: number | null;
  median: number | null;
  highest: number | null;
  listingType: string;
  message?: string;
}>;

try {
  // Try to import the real service
  getEbayPrices = require('./ebay-service').getEbayPrices;
} catch (error) {
  console.warn('Could not import eBay service, using mock implementation');
  // Mock implementation
  getEbayPrices = async (searchTerm, listingType) => {
    console.log(`MOCK getEbayPrices called with searchTerm: ${searchTerm}, listingType: ${listingType}`);
    return {
      lowest: null,
      median: null, 
      highest: null,
      listingType,
      message: 'Using mock implementation'
    };
  };
}

interface AIEstimate {
  low: number;
  medium: number;
  high: number;
  confidence: "High" | "Medium" | "Low";
}

// Internal helper to estimate price based on item attributes
function estimateBasePrice(item: SelectItem): number {
  // If item already has a value, use that as a starting point
  if (item.value) {
    return item.value;
  }
  
  // Otherwise, use the cost as a base and add a markup
  // This is a simple placeholder logic - you may want to improve this
  return item.cost ? Math.round(item.cost * 1.3) : 0;
}

export async function calculateAIEstimate(item: SelectItem): Promise<AIEstimate> {
  try {
    // Calculate confidence based on number of available fields
    let confidenceScore = 0;
    if (item.name) confidenceScore++;
    if (item.type) confidenceScore++;
    if (item.franchise) confidenceScore++;
    if (item.brand) confidenceScore++;
    if (item.year) confidenceScore++;
    if (item.condition) confidenceScore++;

    // Determine confidence level
    let confidence: "High" | "Medium" | "Low";
    if (confidenceScore >= 5) {
      confidence = "High";
    } else if (confidenceScore >= 3) {
      confidence = "Medium";
    } else {
      confidence = "Low";
    }

    // Calculate base price using internal algorithm instead of eBay data
    const basePrice = estimateBasePrice(item);
    
    // If no meaningful price can be calculated
    if (basePrice <= 0) {
      return {
        low: 0,
        medium: 0,
        high: 0,
        confidence: "Low"
      };
    }

    // Calculate price ranges based on confidence
    let lowMultiplier = 0.8;
    let highMultiplier = 1.2;

    if (confidence === "Medium") {
      lowMultiplier = 0.7;
      highMultiplier = 1.3;
    } else if (confidence === "Low") {
      lowMultiplier = 0.6;
      highMultiplier = 1.4;
    }

    return {
      low: Math.round(basePrice * lowMultiplier),
      medium: Math.round(basePrice),
      high: Math.round(basePrice * highMultiplier),
      confidence
    };
  } catch (error) {
    console.error("Error calculating AI estimate:", error);
    return {
      low: 0,
      medium: 0,
      high: 0,
      confidence: "Low"
    };
  }
}

export async function updateAIEstimates(items: SelectItem[]) {
  const updates = await Promise.all(
    items.map(async (item) => {
      const estimate = await calculateAIEstimate(item);
      return {
        id: item.id,
        aiEstimateLow: estimate.low,
        aiEstimateMedium: estimate.medium,
        aiEstimateHigh: estimate.high,
        aiConfidence: estimate.confidence,
        aiLastUpdated: new Date()
      };
    })
  );

  return updates;
} 