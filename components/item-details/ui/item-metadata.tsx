/**
 * Item Metadata Component
 * 
 * Displays and allows editing of an item's metadata including:
 * - Type
 * - Brand
 * - Franchise
 * - Year
 * - Condition
 * - Acquisition date
 * - Notes
 */

import React from 'react'
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Edit } from "lucide-react"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { ItemCondition } from '../hooks/use-custom-metadata'
import { SelectItem as SelectItemType } from '@/db/schema/items-schema'
import { franchiseEnum, itemTypeEnum } from '@/db/schema/items-schema'

interface ItemMetadataProps {
  item: SelectItemType
  editingField: string | null
  customBrands: { id: string; name: string }[]
  customFranchises: { id: string; name: string }[]
  defaultBrands: string[]
  conditionOptions: ItemCondition[]
  yearOptions: { value: string; label: string }[]
  onEditStart: (field: string) => void
  onEditCancel: () => void
  onEditSave: () => void
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onSelectChange: (field: keyof SelectItemType, value: string | number | null) => void
}

export default function ItemMetadata({
  item,
  editingField,
  customBrands,
  customFranchises,
  defaultBrands,
  conditionOptions,
  yearOptions,
  onEditStart,
  onEditCancel,
  onEditSave,
  onInputChange,
  onSelectChange
}: ItemMetadataProps) {
  return (
    <Card className="border dark:border-border shadow-sm dark:bg-card/60">
      <CardHeader>
        {/* CardTitle removed */}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date Acquired</Label>
              <Popover open={editingField === 'acquired'} onOpenChange={(open) => !open && onEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start w-full group"
                    onClick={() => onEditStart('acquired')}
                  >
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                        {item && new Date(item.acquired).toLocaleDateString()}
                      </Badge>
                      <Edit className="ml-2 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-purple-400">Edit Date Acquired</h4>
                    <div className="space-y-2">
                      <Label htmlFor="acquired" className="text-sm font-medium text-purple-400">Date Acquired</Label>
                      <Input
                        id="acquired"
                        type="date"
                        name="acquired"
                        value={item.acquired ? new Date(item.acquired).toISOString().split('T')[0] : ''}
                        onChange={onInputChange}
                        className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={onEditCancel} className="border-input text-primary/70 hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                      <Button onClick={onEditSave} className="bg-primary/70 text-primary-foreground hover:bg-primary/60">Save</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Popover open={editingField === 'type'} onOpenChange={(open) => !open && onEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start w-full group"
                    onClick={() => onEditStart('type')}
                  >
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">{item.type}</Badge>
                      <Edit className="ml-2 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                  <h4 className="font-semibold text-sm text-purple-400">Edit Type</h4>
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="type" className="text-sm font-medium text-purple-400">Type</Label>
                    <Select
                      value={item.type || ""}
                      onValueChange={(value) => onSelectChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-black/90">
                        <SelectGroup>
                          <SelectLabel>Item Types</SelectLabel>
                          {itemTypeEnum.enumValues.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={onEditCancel}>Cancel</Button>
                    <Button onClick={onEditSave}>Save</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Franchise</Label>
              <Popover open={editingField === 'franchise'} onOpenChange={(open) => !open && onEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start w-full group"
                    onClick={() => onEditStart('franchise')}
                  >
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">{item.franchise || 'Not specified'}</Badge>
                      <Edit className="ml-2 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                  <h4 className="font-semibold text-sm text-purple-400">Edit Franchise</h4>
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="franchise" className="text-sm font-medium text-purple-400">Franchise</Label>
                    <Select
                      value={item.franchise || ""}
                      onValueChange={(value) => onSelectChange('franchise', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select franchise" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-black/90">
                        <SelectGroup>
                          <SelectLabel>Default Franchises</SelectLabel>
                          {franchiseEnum.enumValues.map((franchise) => (
                            <SelectItem key={franchise} value={franchise}>
                              {franchise}
                            </SelectItem>
                          ))}
                          {customFranchises.length > 0 && (
                            <>
                              <SelectLabel>Custom Franchises</SelectLabel>
                              {customFranchises.map((franchise) => (
                                <SelectItem key={franchise.id} value={franchise.name}>
                                  {franchise.name}
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={onEditCancel}>Cancel</Button>
                    <Button onClick={onEditSave}>Save</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Brand</Label>
              <Popover open={editingField === 'brand'} onOpenChange={(open) => !open && onEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start w-full group"
                    onClick={() => onEditStart('brand')}
                  >
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">{item.brand || 'Not specified'}</Badge>
                      <Edit className="ml-2 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                  <h4 className="font-semibold text-sm text-purple-400">Edit Brand</h4>
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="brand" className="text-sm font-medium text-purple-400">Brand</Label>
                    <Select
                      value={item.brand || ""}
                      onValueChange={(value) => onSelectChange('brand', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-black/90">
                        <SelectGroup>
                          <SelectLabel>Default Brands</SelectLabel>
                          {defaultBrands.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                          {customBrands.length > 0 && (
                            <>
                              <SelectLabel>Custom Brands</SelectLabel>
                              {customBrands.map((brand) => (
                                <SelectItem key={brand.id} value={brand.name}>
                                  {brand.name}
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={onEditCancel}>Cancel</Button>
                    <Button onClick={onEditSave}>Save</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Year</Label>
              <Popover open={editingField === 'year'} onOpenChange={(open) => !open && onEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start w-full group"
                    onClick={() => onEditStart('year')}
                  >
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">{item.year || 'Not specified'}</Badge>
                      <Edit className="ml-2 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-purple-400">Edit Year</h4>
                    <div className="space-y-2">
                      <Label htmlFor="year" className="text-sm font-medium text-purple-400">Year</Label>
                      <Select
                        value={item.year?.toString() || ""}
                        onValueChange={(value) => {
                          const yearValue = value ? parseInt(value) : null;
                          onSelectChange('year', yearValue);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-black/90">
                          <SelectGroup>
                            <SelectLabel>Year</SelectLabel>
                            {yearOptions.map((year) => (
                              <SelectItem key={year.value} value={year.value}>
                                {year.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={onEditCancel} className="border-input text-primary/70 hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                      <Button onClick={onEditSave} className="bg-primary/70 text-primary-foreground hover:bg-primary/60">Save</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Condition</Label>
              <Popover open={editingField === 'condition'} onOpenChange={(open) => !open && onEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start w-full group"
                    onClick={() => onEditStart('condition')}
                  >
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">{item.condition || 'Not specified'}</Badge>
                      <Edit className="ml-2 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-purple-400">Edit Condition</h4>
                    <div className="space-y-2">
                      <Label htmlFor="condition" className="text-sm font-medium text-purple-400">Condition</Label>
                      <Select
                        value={item.condition || ""}
                        onValueChange={(value) => onSelectChange('condition', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-black/90">
                          <SelectGroup>
                            <SelectLabel>Condition</SelectLabel>
                            {conditionOptions.map((condition) => (
                              <SelectItem key={condition} value={condition}>
                                {condition}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={onEditCancel} className="border-input text-primary/70 hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                      <Button onClick={onEditSave} className="bg-primary/70 text-primary-foreground hover:bg-primary/60">Save</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        {/* Item Notes */}
        <div className="pt-4 border-t border-border">
          <Label className="text-xs text-muted-foreground">Item Notes</Label>
          <Popover open={editingField === 'notes'} onOpenChange={(open) => !open && onEditCancel()}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-left font-normal p-4 bg-muted/30 hover:bg-muted/50 rounded-md group"
                onClick={() => onEditStart('notes')}
              >
                <div className="flex items-start">
                  <div className="max-h-40 overflow-y-auto pr-2 flex-grow">
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {item.notes || 'No notes available. Click to add notes about this item.'}
                    </p>
                  </div>
                  <Edit className="ml-2 h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-foreground">Edit Notes</h4>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-foreground">Notes</Label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={item ? (item.notes || '') : ''}
                    onChange={onInputChange}
                    className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                    rows={4}
                    placeholder="Add notes about this item..."
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
      </CardContent>
    </Card>
  )
} 