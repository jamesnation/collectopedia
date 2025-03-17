"use client";

/**
 * components/item-details/ui/item-metrics-section.tsx
 * 
 * This component combines ItemMetrics and ProfitMetrics to display
 * pricing information and financial metrics for an item.
 * Updated to only show AI price loading in the refresh button itself.
 */

import { useItemDetails } from "../context";
import { ItemMetrics, ProfitMetrics } from "../item-info";

export function ItemMetricsSection() {
  const {
    item,
    isEditingField,
    isLoadingAiPrice,
    handleEditStart,
    handleEditCancel,
    handleUpdateField,
    handleRefreshAiPrice
  } = useItemDetails();

  // Skip rendering if item is not loaded yet
  if (!item) return null;

  return (
    <>
      {/* Main Metrics - Cost, Value, etc. */}
      <ItemMetrics
        cost={item.cost}
        value={item.value}
        soldPrice={item.soldPrice}
        isSold={item.isSold}
        ebayListed={item.ebayListed}
        isEditingCost={isEditingField === "cost"}
        isEditingValue={isEditingField === "value"}
        isEditingSoldPrice={isEditingField === "soldPrice"}
        isLoadingAiPrice={isLoadingAiPrice}
        onEditCostStart={() => handleEditStart("cost")}
        onEditValueStart={() => handleEditStart("value")}
        onEditSoldPriceStart={() => handleEditStart("soldPrice")}
        onEditCancel={handleEditCancel}
        onEditCostSave={(cost) => handleUpdateField("cost", cost)}
        onEditValueSave={(value) => handleUpdateField("value", value)}
        onEditSoldPriceSave={(soldPrice) => handleUpdateField("soldPrice", soldPrice)}
        onRefreshAiPrice={handleRefreshAiPrice}
      />
      
      {/* Profit Metrics - Calculate ROI and other profit metrics */}
      <ProfitMetrics
        cost={item.cost}
        value={item.value}
        soldPrice={item.soldPrice}
        isSold={item.isSold}
      />
    </>
  );
} 