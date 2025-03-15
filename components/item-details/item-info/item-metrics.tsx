"use client";

/**
 * components/item-details/item-info/item-metrics.tsx
 * 
 * This component displays the item's financial metrics like cost, value/sold price,
 * AI price estimate, profit, and profit margin.
 */

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Edit, 
  Loader2, 
  RefreshCcw 
} from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useRegionContext } from "@/contexts/region-context";

interface ItemMetricsProps {
  cost: number;
  value: number;
  soldPrice: number | null;
  isSold: boolean;
  ebayListed: number | null;
  isEditingCost: boolean;
  isEditingValue: boolean;
  isEditingSoldPrice: boolean;
  isLoadingAiPrice: boolean;
  onEditCostStart: () => void;
  onEditValueStart: () => void;
  onEditSoldPriceStart: () => void;
  onEditCancel: () => void;
  onEditCostSave: (cost: number) => Promise<void>;
  onEditValueSave: (value: number) => Promise<void>;
  onEditSoldPriceSave: (soldPrice: number) => Promise<void>;
  onRefreshAiPrice: () => Promise<void>;
}

export function ItemMetrics({
  cost,
  value,
  soldPrice,
  isSold,
  ebayListed,
  isEditingCost,
  isEditingValue,
  isEditingSoldPrice,
  isLoadingAiPrice,
  onEditCostStart,
  onEditValueStart,
  onEditSoldPriceStart,
  onEditCancel,
  onEditCostSave,
  onEditValueSave,
  onEditSoldPriceSave,
  onRefreshAiPrice
}: ItemMetricsProps) {
  const [editedCost, setEditedCost] = useState(cost.toString());
  const [editedValue, setEditedValue] = useState(value.toString());
  const [editedSoldPrice, setEditedSoldPrice] = useState(soldPrice?.toString() || "");
  const { formatCurrency, currencySymbol } = useRegionContext();

  // Calculate profit and profit margin
  const displayValue = isSold ? soldPrice || 0 : value;
  const profit = displayValue - cost;
  const profitMargin = cost > 0 ? (profit / cost) * 100 : 0;

  // Update local state when props change
  useEffect(() => {
    if (!isEditingCost) {
      setEditedCost(cost.toString());
    }
    if (!isEditingValue) {
      setEditedValue(value.toString());
    }
    if (!isEditingSoldPrice && soldPrice !== null) {
      setEditedSoldPrice(soldPrice.toString());
    }
  }, [cost, value, soldPrice, isEditingCost, isEditingValue, isEditingSoldPrice]);

  const handleCostSave = () => {
    const parsedCost = parseFloat(editedCost) || 0;
    onEditCostSave(parsedCost);
  };

  const handleValueSave = () => {
    const parsedValue = parseFloat(editedValue) || 0;
    onEditValueSave(parsedValue);
  };

  const handleSoldPriceSave = () => {
    const parsedSoldPrice = parseFloat(editedSoldPrice) || 0;
    onEditSoldPriceSave(parsedSoldPrice);
  };

  const getProfitColorClass = () => {
    if (profit > 0) return "text-green-500";
    if (profit < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  // Refresh AI price button with better feedback
  const refreshButton = (
    <div className="flex flex-col">
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={onRefreshAiPrice}
        disabled={isLoadingAiPrice}
      >
        {isLoadingAiPrice ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCcw className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      {/* Cost Card */}
      <Card className="border dark:border-border shadow-sm h-full overflow-hidden text-left">
        <CardHeader className="pb-1 md:pb-2 text-left">
          <CardTitle className="text-base md:text-lg text-left">Cost</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <Popover open={isEditingCost} onOpenChange={(open) => !open && onEditCancel()}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="p-0 h-auto font-normal text-left justify-start hover:bg-transparent group"
                onClick={onEditCostStart}
              >
                <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-blue-400 break-words text-left">
                  {formatCurrency(cost)}
                </span>
                <Edit className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity inline-flex" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-foreground">Edit Item Cost</h4>
                <div className="space-y-2">
                  <Label htmlFor="cost" className="text-sm font-medium text-foreground">Cost</Label>
                  <Input
                    id="cost"
                    name="cost"
                    type="number"
                    value={editedCost}
                    onChange={(e) => setEditedCost(e.target.value)}
                    className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={onEditCancel} 
                    className="border-input text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCostSave} 
                    className="bg-primary/70 text-primary-foreground hover:bg-primary/60"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>
      
      {/* Value or Sold Price Card */}
      <Card className="border dark:border-border shadow-sm h-full overflow-hidden text-left">
        <CardHeader className="pb-1 md:pb-2 text-left">
          <CardTitle className="text-base md:text-lg text-left">
            {isSold ? "Sold Price" : "Value"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <Popover 
            open={isSold ? isEditingSoldPrice : isEditingValue} 
            onOpenChange={(open) => !open && onEditCancel()}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="p-0 h-auto font-normal text-left justify-start hover:bg-transparent group"
                onClick={isSold ? onEditSoldPriceStart : onEditValueStart}
              >
                <span className={`text-base sm:text-lg md:text-xl lg:text-2xl font-bold break-words text-left ${isSold ? 'text-green-500' : 'text-purple-400'}`}>
                  {formatCurrency(isSold ? (soldPrice || 0) : value)}
                </span>
                <Edit className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity inline-flex" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-foreground">
                  {isSold ? "Edit Sold Price" : "Edit Item Value"}
                </h4>
                <div className="space-y-2">
                  <Label 
                    htmlFor={isSold ? "soldPrice" : "value"} 
                    className="text-sm font-medium text-foreground"
                  >
                    {isSold ? "Sold Price" : "Value"}
                  </Label>
                  <Input
                    id={isSold ? "soldPrice" : "value"}
                    name={isSold ? "soldPrice" : "value"}
                    type="number"
                    value={isSold ? editedSoldPrice : editedValue}
                    onChange={(e) => {
                      if (isSold) {
                        setEditedSoldPrice(e.target.value);
                      } else {
                        setEditedValue(e.target.value);
                      }
                    }}
                    className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={onEditCancel} 
                    className="border-input text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={isSold ? handleSoldPriceSave : handleValueSave} 
                    className="bg-primary/70 text-primary-foreground hover:bg-primary/60"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>
      
      {/* AI Price Estimate Card */}
      <Card className="border dark:border-border shadow-sm h-full overflow-hidden text-left">
        <CardHeader className="pb-1 md:pb-2 text-left">
          <CardTitle className="text-base md:text-lg text-left">AI Price Estimate</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center justify-between">
            <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">
              {ebayListed ? formatCurrency(ebayListed) : 'Not available'}
            </div>
            {refreshButton}
          </div>
        </CardContent>
      </Card>

      {/* Profit Metrics Card - We'll add this as a separate component */}
    </div>
  );
} 