import { DollarSign, ShoppingCart, BarChart4, Percent, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useRegionContext } from "@/contexts/region-context";

interface SummaryPanelProps {
  totalValue?: number;
  totalCost?: number;
  totalItems?: number;
  ebayListedValue?: number;
  ebaySoldValue?: number;
  showSold: boolean;
}

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
  const { formatCurrency } = useRegionContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
      <Card className="dark:bg-card/60 dark:border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Total {showSold ? "Sold" : "Collection"} Value</p>
              <p className="text-2xl font-bold dark:text-foreground">{formatCurrency(totalValue)}</p>
            </div>
            <DollarSign className="h-6 w-6 text-purple-400 dark:text-purple-400" aria-label="Total Value" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="dark:bg-card/60 dark:border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Total Cost</p>
              <p className="text-2xl font-bold dark:text-foreground">{formatCurrency(totalCost)}</p>
            </div>
            <ShoppingCart className="h-6 w-6 text-purple-400 dark:text-purple-400" aria-label="Total Cost" />
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-card/60 dark:border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Total Profit</p>
              <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(profit)}
              </p>
            </div>
            <BarChart4 className="h-6 w-6 text-purple-400 dark:text-purple-400" aria-label="Total Profit" />
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-card/60 dark:border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Profit Margin</p>
              <p className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {profitMargin.toFixed(2)}%
              </p>
            </div>
            <Percent className="h-6 w-6 text-purple-400 dark:text-purple-400" aria-label="Profit Margin" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="dark:bg-card/60 dark:border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">AI Estimate</p>
              <p className="text-2xl font-bold dark:text-foreground">{formatCurrency(ebayListedValue)}</p>
            </div>
            <Brain className="h-6 w-6 text-purple-400 dark:text-purple-400" aria-label="AI Estimate" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 