"use client";

/**
 * components/item-details/ui/item-details-section.tsx
 * 
 * This component manages the right column of the item details page,
 * including the item header, metrics, and details card.
 */

import { useItemDetails } from "../context";
import { ItemHeader } from "./item-header";
import { ItemMetricsSection } from "./item-metrics-section";
import { ItemDetailsCard } from "./item-details-card";

export function ItemDetailsSection() {
  const { item } = useItemDetails();

  if (!item) return null;

  return (
    <div className="space-y-6">
      {/* Item Header */}
      <ItemHeader />
      
      {/* Metrics Section - combines ItemMetrics and ProfitMetrics */}
      <ItemMetricsSection />
      
      {/* Item Details Card - includes all item information fields */}
      <ItemDetailsCard />
    </div>
  );
} 