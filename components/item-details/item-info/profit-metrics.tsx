"use client";

/**
 * components/item-details/item-info/profit-metrics.tsx
 * 
 * This component displays profit metrics including total profit and profit margin.
 */

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useRegionContext } from "@/contexts/region-context";
import { BarChart4, Percent } from "lucide-react";

interface ProfitMetricsProps {
  cost: number;
  value: number;
  soldPrice: number | null;
  isSold: boolean;
}

export function ProfitMetrics({
  cost,
  value,
  soldPrice,
  isSold
}: ProfitMetricsProps) {
  const { formatCurrency } = useRegionContext();
  
  // Calculate profit metrics
  const displayValue = isSold ? soldPrice || 0 : value;
  const profit = displayValue - cost;
  const profitMargin = cost > 0 ? (profit / cost) * 100 : 0;

  // Helper function to determine text color based on value
  const getProfitColorClass = (value: number) => {
    if (value > 0) return "text-green-500";
    if (value < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  return (
    <Card className="border dark:border-border shadow-sm mb-4">
      <CardHeader className="pb-1 md:pb-2">
        <CardTitle className="text-base md:text-lg">Profit Metrics</CardTitle>
      </CardHeader>
      <CardContent className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center">
            <BarChart4 className="h-4 w-4 mr-1.5" />
            Total Profit
          </h4>
          <p className={`text-lg font-bold ${getProfitColorClass(profit)}`}>
            {formatCurrency(profit)}
          </p>
        </div>
        <div className="space-y-1.5">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center">
            <Percent className="h-4 w-4 mr-1.5" />
            Profit Margin
          </h4>
          <p className={`text-lg font-bold ${getProfitColorClass(profitMargin)}`}>
            {profitMargin.toFixed(1)}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 