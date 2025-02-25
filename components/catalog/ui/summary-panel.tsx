import { DollarSign, ShoppingCart, TrendingUp, BarChart4, Percent, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SummaryPanelProps {
  totalValue?: number;
  totalCost?: number;
  totalItems?: number;
  ebayListedValue?: number;
  ebaySoldValue?: number;
  showSold: boolean;
}

export default function SummaryPanel({
  totalValue = 0,
  totalCost = 0,
  totalItems = 0,
  ebayListedValue = 0,
  ebaySoldValue = 0,
  showSold
}: SummaryPanelProps) {
  const profit = totalValue - totalCost;
  const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-GB', { 
      style: 'currency', 
      currency: 'GBP',
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US');
  };

  return (
    <Card className="mb-8 bg-card">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-primary">Total {showSold ? "Sold" : "Collection"} Value</h3>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-primary">Total Cost</h3>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalCost)}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-primary">Total Items</h3>
            </div>
            <p className="text-2xl font-bold text-primary">{formatNumber(totalItems)}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-primary">eBay Listed Value</h3>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(ebayListedValue)}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-primary">eBay Sold Value</h3>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(ebaySoldValue)}</p>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <BarChart4 className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-primary">Total Profit</h3>
            </div>
            <p className={`text-xl font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profit)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Percent className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-primary">Profit Margin</h3>
            </div>
            <p className={`text-xl font-semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitMargin.toFixed(2)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 