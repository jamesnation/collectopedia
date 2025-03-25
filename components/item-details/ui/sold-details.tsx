/**
 * Sold Details Component
 * 
 * Displays and manages the sold status of an item:
 * - Toggle between sold and in-collection state
 * - Input for sold price
 * - Input for sold date
 * - Form for updating sold details
 */

import React from 'react'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { Edit, Save } from "lucide-react"
import { SelectItem } from '@/db/schema/items-schema'

interface SoldDetailsProps {
  item: SelectItem
  isSold: boolean
  soldPrice: string
  soldDate: string
  editingField: string | null
  onSoldToggle: (checked: boolean) => Promise<void>
  onSoldPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSoldDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void 
  onSaveSoldDetails: () => Promise<void>
  onEditStart: (field: string) => void
  onEditCancel: () => void
  onEditSave: () => void
  formatCurrency: (value: number) => string
}

export default function SoldDetails({
  item,
  isSold,
  soldPrice,
  soldDate,
  editingField,
  onSoldToggle,
  onSoldPriceChange,
  onSoldDateChange,
  onSaveSoldDetails,
  onEditStart,
  onEditCancel,
  onEditSave,
  formatCurrency
}: SoldDetailsProps) {
  return (
    <>
      {/* Collection Status Toggle */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Collection Status</Label>
        <div className="flex items-center space-x-2">
          <Switch
            id="item-status"
            checked={isSold}
            onCheckedChange={onSoldToggle}
          />
          <Badge 
            variant="outline" 
            className={`ml-2 ${isSold ? "bg-red-50 dark:bg-red-950/20" : "bg-green-50 dark:bg-green-950/20"}`}
          >
            <span className={`${isSold ? "text-rose-500" : "text-emerald-600"} font-medium`}>
              {isSold ? 'Sold' : 'In Collection'}
            </span>
          </Badge>
        </div>
      </div>
      
      {/* Initial Sold Details Form */}
      {isSold && !item.soldPrice && !item.soldDate && (
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-muted-foreground">Sale Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sold-price" className="text-xs text-muted-foreground">Sold Price</Label>
              <Input
                id="sold-price"
                name="soldPrice-initial"
                type="number"
                placeholder="Enter sold price"
                value={soldPrice}
                onChange={onSoldPriceChange}
                className="mt-1"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sold-date" className="text-xs text-muted-foreground">Sold Date</Label>
              <Input
                id="sold-date"
                type="date"
                value={soldDate}
                onChange={onSoldDateChange}
                className="mt-1"
              />
            </div>
          </div>
          <Button onClick={onSaveSoldDetails} className="w-full bg-primary/70 text-primary-foreground hover:bg-primary/60">
            <Save className="w-4 h-4 mr-2" /> Save Sold Details
          </Button>
        </div>
      )}
      
      {/* Sold Details Display and Edit */}
      {item.isSold && (item.soldPrice || item.soldDate) && (
        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Sale Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Sold Price</Label>
              <Popover open={editingField === 'soldPrice-detail'} onOpenChange={(open) => !open && onEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal group w-full text-left justify-start !items-start"
                    onClick={() => onEditStart('soldPrice-detail')}
                  >
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10 text-purple-400 font-semibold">
                        {formatCurrency(item.soldPrice || 0)}
                      </Badge>
                      <Edit className="ml-2 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-foreground">Edit Sold Price</h4>
                    <div className="space-y-2">
                      <Label htmlFor="soldPrice-detail" className="text-sm font-medium text-foreground">Sold Price</Label>
                      <Input
                        id="soldPrice-detail"
                        name="soldPrice-detail"
                        type="number"
                        value={soldPrice || item.soldPrice || ''}
                        onChange={onSoldPriceChange}
                        className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={onEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                      <Button onClick={onEditSave} className="bg-primary/70 text-primary-foreground hover:bg-primary/60">Save</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Sold Date</Label>
              <Popover open={editingField === 'soldDate'} onOpenChange={(open) => !open && onEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal group w-full text-left justify-start !items-start"
                    onClick={() => onEditStart('soldDate')}
                  >
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10 text-purple-400 font-semibold">
                        {item.soldDate ? new Date(item.soldDate).toLocaleDateString() : 'Not specified'}
                      </Badge>
                      <Edit className="ml-2 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-foreground">Edit Sold Date</h4>
                    <div className="space-y-2">
                      <Label htmlFor="soldDate" className="text-sm font-medium text-foreground">Sold Date</Label>
                      <Input
                        id="soldDate"
                        type="date"
                        value={soldDate || (item.soldDate ? new Date(item.soldDate).toISOString().split('T')[0] : '')}
                        onChange={onSoldDateChange}
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
            </div>
          </div>
        </div>
      )}
    </>
  )
} 