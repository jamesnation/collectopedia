/**
 * Price Section Component
 * 
 * Displays financial information about an item:
 * - Cost
 * - Value or Sold Price
 * - AI Price Estimate
 * - Profit metrics
 */

import React from 'react'
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Edit, Loader2, RefreshCw } from "lucide-react"
import { SelectItem } from '@/db/schema/items-schema'

interface PriceSectionProps {
  item: SelectItem
  editingField: string | null
  formatCurrency: (value: number) => string
  loadingAiPrice: boolean
  soldPrice: string
  isSold: boolean
  onEditStart: (field: string) => void
  onEditCancel: () => void
  onEditSave: () => void
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSoldPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAiPriceRefresh: () => void
  onSoldPriceFormSubmit: (e: React.FormEvent) => void
}

export default function PriceSection({
  item,
  editingField,
  formatCurrency,
  loadingAiPrice,
  soldPrice,
  isSold,
  onEditStart,
  onEditCancel,
  onEditSave,
  onInputChange,
  onSoldPriceChange,
  onAiPriceRefresh,
  onSoldPriceFormSubmit
}: PriceSectionProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Cost Card */}
        <Card className="border dark:border-border shadow-sm h-full overflow-hidden text-left">
          <CardHeader className="pb-1 md:pb-2 text-left">
            <CardTitle className="text-base md:text-lg text-left">Cost</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <Popover open={editingField === 'cost'} onOpenChange={(open) => !open && onEditCancel()}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="p-0 h-auto font-normal text-left justify-start hover:bg-transparent group"
                  onClick={() => onEditStart('cost')}
                >
                  <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-blue-400 break-words text-left">
                    {formatCurrency(item?.cost || 0)}
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
                      value={item?.cost || 0}
                      onChange={onInputChange}
                      className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={onEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                    <Button onClick={onEditSave} className="bg-primary/70 text-primary-foreground hover:bg-primary/60">Save</Button>
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
            {isSold ? (
              // Sold Price Display for sold items
              <Popover open={editingField === 'soldPrice-main'} onOpenChange={(open) => !open && onEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start hover:bg-transparent group"
                    onClick={() => onEditStart('soldPrice-main')}
                  >
                    <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-green-500 break-words text-left">
                      {formatCurrency(item?.soldPrice || 0)}
                    </span>
                    <Edit className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity inline-flex" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                  <form onSubmit={onSoldPriceFormSubmit}>
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm text-foreground">Edit Sold Price</h4>
                      <div className="space-y-2">
                        <Label htmlFor="soldPrice-main" className="text-sm font-medium text-foreground">Sold Price</Label>
                        <Input
                          id="soldPrice-main"
                          name="soldPrice-main"
                          type="number"
                          value={soldPrice}
                          onChange={onSoldPriceChange}
                          className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={onEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                        <Button type="submit" className="bg-primary/70 text-primary-foreground hover:bg-primary/60">Save</Button>
                      </div>
                    </div>
                  </form>
                </PopoverContent>
              </Popover>
            ) : (
              // Value display for non-sold items
              <Popover open={editingField === 'value'} onOpenChange={(open) => !open && onEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start hover:bg-transparent group"
                    onClick={() => onEditStart('value')}
                  >
                    <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-purple-400 break-words text-left">
                      {formatCurrency(item?.value || 0)}
                    </span>
                    <Edit className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity inline-flex" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-foreground">Edit Item Value</h4>
                    <div className="space-y-2">
                      <Label htmlFor="value" className="text-sm font-medium text-foreground">Value</Label>
                      <Input
                        id="value"
                        name="value"
                        type="number"
                        value={item?.value || 0}
                        onChange={onInputChange}
                        className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={onEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                      <Button onClick={onEditSave} className="bg-primary/70 text-primary-foreground hover:bg-primary/60">Save</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
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
                {item?.ebayListed ? formatCurrency(item.ebayListed) : 'Not available'}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onAiPriceRefresh}
                disabled={loadingAiPrice}
                title="Refresh AI Price Estimate"
                className="h-8 w-8 ml-2 flex-shrink-0"
              >
                {loadingAiPrice ?
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                  <RefreshCw className="h-3.5 w-3.5" />
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Profit Metrics Card */}
      <Card className="border dark:border-border shadow-sm mb-4">
        <CardHeader className="pb-1 md:pb-2">
          {/* CardTitle removed */}
        </CardHeader>
        <CardContent className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium text-muted-foreground">Total Profit</h4>
            <p className={`text-lg font-bold ${
              isSold 
                ? (item.soldPrice && item.cost && (item.soldPrice - item.cost) > 0 
                    ? 'text-green-500' 
                    : item.soldPrice && item.cost && (item.soldPrice - item.cost) < 0
                      ? 'text-red-500'
                      : 'text-muted-foreground')
                : (item.value && item.cost && (item.value - item.cost) > 0 
                    ? 'text-green-500' 
                    : item.value && item.cost && (item.value - item.cost) < 0
                      ? 'text-red-500'
                      : 'text-muted-foreground')
            }`}>
              {isSold
                ? (item.soldPrice && item.cost 
                    ? formatCurrency(item.soldPrice - item.cost)
                    : 'N/A')
                : (item.value && item.cost 
                    ? formatCurrency(item.value - item.cost)
                    : 'N/A')
              }
            </p>
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium text-muted-foreground">Profit Margin</h4>
            <p className={`text-lg font-bold ${
              isSold
                ? (item.soldPrice && item.cost && item.cost > 0 && ((item.soldPrice - item.cost) / item.cost * 100) > 0 
                    ? 'text-green-500' 
                    : item.soldPrice && item.cost && item.cost > 0 && ((item.soldPrice - item.cost) / item.cost * 100) < 0
                      ? 'text-red-500'
                      : 'text-muted-foreground')
                : (item.value && item.cost && item.cost > 0 && ((item.value - item.cost) / item.cost * 100) > 0 
                    ? 'text-green-500' 
                    : item.value && item.cost && item.cost > 0 && ((item.value - item.cost) / item.cost * 100) < 0
                      ? 'text-red-500'
                      : 'text-muted-foreground')
            }`}>
              {isSold
                ? (item.soldPrice && item.cost && item.cost > 0
                    ? `${((item.soldPrice - item.cost) / item.cost * 100).toFixed(1)}%`
                    : 'N/A')
                : (item.value && item.cost && item.cost > 0
                    ? `${((item.value - item.cost) / item.cost * 100).toFixed(1)}%`
                    : 'N/A')
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  )
} 