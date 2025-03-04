import { SelectItem } from "@/db/schema/items-schema";
import { getEbayPrices } from "./ebay-service";

interface AIEstimate {
  low: number;
  medium: number;
  high: number;
  confidence: "High" | "Medium" | "Low";
}

export async function calculateAIEstimate(item: SelectItem): Promise<AIEstimate> {
  try {
    // Build search query using all available fields
    const searchTerms = [
      item.name,
      item.type,
      item.franchise,
      item.brand,
      item.year?.toString(),
      item.condition
    ].filter(Boolean).join(" ");

    // Get eBay prices
    const ebayPrices = await getEbayPrices(searchTerms, "listed");

    if (!ebayPrices.median) {
      return {
        low: 0,
        medium: 0,
        high: 0,
        confidence: "Low"
      };
    }

    // Calculate confidence based on number of matching fields
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

    // Calculate price ranges based on confidence
    const basePrice = ebayPrices.median;
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