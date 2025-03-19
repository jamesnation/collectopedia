/**
 * Summary Panel Component
 * 
 * Displays key collection statistics in a row of cards at the top of the catalog page.
 * Updated to use named exports per TypeScript standards.
 * Adjusted to display as a single column on mobile and tablet views for better responsiveness.
 */

import React from 'react';
import { 
  Banknote, 
  ShoppingCart, 
  BarChart2, 
  Percent, 
  Brain 
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/format-utils';

export interface SummaryValues {
  totalValue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  aiEstimate: number;
  totalSold?: number;
  totalSoldValue?: number;
  totalSpent?: number;
}

export interface SummaryPanelProps {
  summaryValues: SummaryValues;
  showSold?: boolean;
  view?: 'grid' | 'list';
  onViewChange?: (view: 'grid' | 'list') => void;
  className?: string;
}

export function SummaryPanel({
  summaryValues,
  showSold = false,
  view = 'grid',
  onViewChange,
  className = '',
}: SummaryPanelProps) {
  const {
    totalValue,
    totalCost,
    totalProfit,
    profitMargin,
    aiEstimate,
    totalSoldValue = 0,
    totalSpent = 0,
  } = summaryValues;

  // Determine values to display based on whether we're showing sold items
  const displayValues = {
    value: showSold ? totalSoldValue : totalValue,
    cost: totalCost,
    profit: totalProfit,
    margin: profitMargin,
    estimate: aiEstimate,
    spent: totalSpent,
  };

  const isProfitPositive = displayValues.profit > 0;

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6 ${className}`}>
      {/* Value Card */}
      <div className="bg-gray-900 rounded-lg p-4 shadow-md">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-gray-400 text-sm font-medium">
            {showSold ? "Total Sold Value" : "Total Collection Value"}
          </h3>
          <Banknote className="h-5 w-5 text-violet-400" />
        </div>
        <p className="text-white text-2xl font-bold">
          {formatCurrency(displayValues.value)}
        </p>
        {showSold && (
          <p className="text-gray-400 text-xs mt-1">
            Total Spent: {formatCurrency(displayValues.spent)}
          </p>
        )}
      </div>

      {/* Cost Card */}
      <div className="bg-gray-900 rounded-lg p-4 shadow-md">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-gray-400 text-sm font-medium">Total Cost</h3>
          <ShoppingCart className="h-5 w-5 text-violet-400" />
        </div>
        <p className="text-white text-2xl font-bold">
          {formatCurrency(displayValues.cost)}
        </p>
      </div>

      {/* Profit Card */}
      <div className="bg-gray-900 rounded-lg p-4 shadow-md">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-gray-400 text-sm font-medium">Total Profit</h3>
          <BarChart2 className="h-5 w-5 text-violet-400" />
        </div>
        <p className={`text-2xl font-bold ${isProfitPositive ? 'text-green-500' : 'text-red-500'}`}>
          {formatCurrency(displayValues.profit)}
        </p>
      </div>

      {/* Profit Margin Card */}
      <div className="bg-gray-900 rounded-lg p-4 shadow-md">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-gray-400 text-sm font-medium">Profit Margin</h3>
          <Percent className="h-5 w-5 text-violet-400" />
        </div>
        <p className={`text-2xl font-bold ${isProfitPositive ? 'text-green-500' : 'text-red-500'}`}>
          {formatPercentage(displayValues.margin / 100)}
        </p>
      </div>

      {/* AI Estimate Card */}
      <div className="bg-gray-900 rounded-lg p-4 shadow-md">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-gray-400 text-sm font-medium">AI Estimate</h3>
          <Brain className="h-5 w-5 text-violet-400" />
        </div>
        <p className="text-white text-2xl font-bold">
          {formatCurrency(displayValues.estimate)}
        </p>
      </div>
    </div>
  );
} 