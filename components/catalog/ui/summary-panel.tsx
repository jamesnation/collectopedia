import { DollarSign, ShoppingCart, BarChart4, Percent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SummaryPanelProps {
  totalValue?: number;
  totalCost?: number;
  totalItems?: number;
  ebayListedValue?: number;
  ebaySoldValue?: number;
  showSold: boolean;
}

// Utility function for formatting currency values
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

export default function SummaryPanel({
  totalValue = 0,
  totalCost = 0,
  totalItems = 0,
  ebayListedValue = 0,
  ebaySoldValue = 0,
  showSold = false
}: SummaryPanelProps) {
  const profit = totalValue - totalCost;
  const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <Card className="dark:bg-gray-900/50 dark:border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Total {showSold ? "Sold" : "Collection"} Value</p>
              <p className="text-2xl font-bold dark:text-white">{formatCurrency(totalValue)}</p>
            </div>
            <DollarSign className="h-6 w-6 text-primary dark:text-purple-400" aria-label="Total Value" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="dark:bg-gray-900/50 dark:border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Total Cost</p>
              <p className="text-2xl font-bold dark:text-white">{formatCurrency(totalCost)}</p>
            </div>
            <ShoppingCart className="h-6 w-6 text-primary dark:text-purple-400" aria-label="Total Cost" />
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-900/50 dark:border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Total Profit</p>
              <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(profit)}
              </p>
            </div>
            <BarChart4 className="h-6 w-6 text-primary dark:text-purple-400" aria-label="Total Profit" />
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-900/50 dark:border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Profit Margin</p>
              <p className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {profitMargin.toFixed(2)}%
              </p>
            </div>
            <Percent className="h-6 w-6 text-primary dark:text-purple-400" aria-label="Profit Margin" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 