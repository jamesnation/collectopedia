"use client";

/**
 * components/item-details/ui/item-details-card.tsx
 * 
 * This component displays detailed item information and allows editing of various fields.
 * It includes sections for item status, acquisition details, and item information fields.
 */

import { useItemDetails } from "../context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ItemStatus, SoldDetails } from "../item-info";
import { ItemCondition } from "@/types/item-types";
import { itemTypeEnum, franchiseEnum } from "@/db/schema/items-schema";
import { useState, useEffect } from "react";
import { getCustomBrandsAction } from "@/actions/custom-brands-actions";
import { getCustomFranchisesAction } from "@/actions/custom-franchises-actions";

// Constants for dropdown options
const TYPE_OPTIONS = itemTypeEnum.enumValues;

// Franchise options from schema
const FRANCHISE_OPTIONS = franchiseEnum.enumValues;

// Default brands from old file
const DEFAULT_BRANDS = [
  'DC',
  'Filmation',
  'Funko',
  'Games Workshop',
  'Hasbro',
  'Kenner',
  'Marvel',
  'Matchbox',
  'Mattel',
  'Medium',
  'Playmates',
  'Senate',
  'Sunbow',
  'Super7',
  'Takara',
  'Tomy'
];

const YEAR_OPTIONS = Array.from({ length: 50 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year.toString(), label: year.toString() };
});
const CONDITION_OPTIONS: ItemCondition[] = ["New", "Used"];

export function ItemDetailsCard() {
  const {
    item,
    isEditingField,
    handleEditStart,
    handleEditCancel,
    handleUpdateField,
    tempNotes,
    setTempNotes,
    handleToggleSold,
    showSoldDetails,
    tempSoldPrice,
    tempSoldDate,
    setTempSoldPrice,
    setTempSoldDate,
    handleSaveSoldDetails,
    handleDeleteItem
  } = useItemDetails();

  // Add state for custom brands and franchises
  const [customBrands, setCustomBrands] = useState<{ id: string; name: string }[]>([]);
  const [customFranchises, setCustomFranchises] = useState<{ id: string; name: string }[]>([]);

  // Load custom brands and franchises
  useEffect(() => {
    const loadCustomData = async () => {
      try {
        const brandsResult = await getCustomBrandsAction();
        if (brandsResult.isSuccess && brandsResult.data) {
          setCustomBrands(brandsResult.data);
        }

        const franchisesResult = await getCustomFranchisesAction();
        if (franchisesResult.isSuccess && franchisesResult.data) {
          setCustomFranchises(franchisesResult.data);
        }
      } catch (error) {
        console.error("Error loading custom data:", error);
      }
    };

    loadCustomData();
  }, []);

  if (!item) return null;

  return (
    <Card className="border dark:border-border shadow-sm dark:bg-card/60">
      <div className="p-6 space-y-6">
        <h3 className="text-lg font-medium">Item Details</h3>
        
        {/* Status & Acquisition Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Status & Acquisition</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1.5">Date Acquired</div>
              <Popover open={isEditingField === "acquired"} onOpenChange={(open) => !open && handleEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start w-full group"
                    onClick={() => handleEditStart("acquired")}
                  >
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                        {item.acquired ? new Date(item.acquired).toLocaleDateString() : 'Not specified'}
                      </Badge>
                      <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2">Edit</span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 dark:bg-black/90 dark:border-border">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-foreground">Edit Date Acquired</h4>
                    <div className="space-y-2">
                      <input 
                        type="date"
                        className="w-full p-2 rounded-md border border-input bg-background"
                        value={item.acquired ? new Date(item.acquired).toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          handleUpdateField("acquired", date);
                        }}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <div className="text-xs text-muted-foreground mb-1.5">Collection Status</div>
              <ItemStatus
                isSold={item.isSold}
                soldPrice={tempSoldPrice}
                soldDate={tempSoldDate}
                showSoldDetails={showSoldDetails}
                onToggleSold={handleToggleSold}
                onSoldPriceChange={setTempSoldPrice}
                onSoldDateChange={setTempSoldDate}
                onSaveSoldDetails={handleSaveSoldDetails}
              />
            </div>
          </div>
        </div>
        
        {/* Always show SoldDetails when the item is sold, regardless of showSoldDetails state */}
        {(() => {
          // Show the SoldDetails component when:
          // 1. Item is sold AND
          // 2. Either the initial form is not showing OR we have saved the details already
          const shouldShowSoldDetails = item.isSold && 
            (!showSoldDetails || (item.soldPrice !== null && item.soldDate !== null));
          
          console.log("SoldDetails conditional check:", {
            isSold: item.isSold,
            soldPrice: item.soldPrice,
            soldDate: item.soldDate,
            showSoldDetails,
            shouldShowSoldDetails
          });
          
          return shouldShowSoldDetails && (
            <SoldDetails
              soldPrice={item.soldPrice}
              soldDate={item.soldDate}
              isEditingSoldPrice={isEditingField === "soldPrice" || isEditingField === "soldPrice-main" || isEditingField === "soldPrice-detail"}
              isEditingSoldDate={isEditingField === "soldDate"}
              onEditSoldPriceStart={() => {
                console.log("onEditSoldPriceStart called from SoldDetails");
                handleEditStart("soldPrice");
              }}
              onEditSoldDateStart={() => handleEditStart("soldDate")}
              onEditCancel={handleEditCancel}
              onEditSoldPriceSave={(price) => handleUpdateField("soldPrice", price)}
              onEditSoldDateSave={(date) => handleUpdateField("soldDate", date)}
            />
          );
        })()}
        
        {/* Item Information Section */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-muted-foreground">Item Information</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {/* Type */}
            <div className="space-y-1.5">
              <div className="text-xs text-muted-foreground">Type</div>
              <Popover open={isEditingField === "type"} onOpenChange={(open) => !open && handleEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start w-full group"
                    onClick={() => handleEditStart("type")}
                  >
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                        {item.type || 'Not specified'}
                      </Badge>
                      <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2">Edit</span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 dark:bg-black/90 dark:border-border">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-foreground">Edit Type</h4>
                    <div className="space-y-2">
                      <select 
                        className="w-full p-2 rounded-md border border-input bg-background"
                        value={item.type}
                        onChange={(e) => handleUpdateField("type", e.target.value)}
                      >
                        {TYPE_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Franchise */}
            <div className="space-y-1.5">
              <div className="text-xs text-muted-foreground">Franchise</div>
              <Popover open={isEditingField === "franchise"} onOpenChange={(open) => !open && handleEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start w-full group"
                    onClick={() => handleEditStart("franchise")}
                  >
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                        {item.franchise || 'Not specified'}
                      </Badge>
                      <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2">Edit</span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 dark:bg-black/90 dark:border-border">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-foreground">Edit Franchise</h4>
                    <div className="space-y-2">
                      <select 
                        className="w-full p-2 rounded-md border border-input bg-background"
                        value={item.franchise}
                        onChange={(e) => handleUpdateField("franchise", e.target.value)}
                      >
                        <optgroup label="Default Franchises">
                          {FRANCHISE_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </optgroup>
                        {customFranchises.length > 0 && (
                          <optgroup label="Custom Franchises">
                            {customFranchises.map(franchise => (
                              <option key={franchise.id} value={franchise.name}>{franchise.name}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Brand */}
            <div className="space-y-1.5">
              <div className="text-xs text-muted-foreground">Brand</div>
              <Popover open={isEditingField === "brand"} onOpenChange={(open) => !open && handleEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start w-full group"
                    onClick={() => handleEditStart("brand")}
                  >
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                        {item.brand || 'Not specified'}
                      </Badge>
                      <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2">Edit</span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 dark:bg-black/90 dark:border-border">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-foreground">Edit Brand</h4>
                    <div className="space-y-2">
                      <select 
                        className="w-full p-2 rounded-md border border-input bg-background"
                        value={item.brand}
                        onChange={(e) => handleUpdateField("brand", e.target.value)}
                      >
                        <optgroup label="Default Brands">
                          {DEFAULT_BRANDS.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </optgroup>
                        {customBrands.length > 0 && (
                          <optgroup label="Custom Brands">
                            {customBrands.map(brand => (
                              <option key={brand.id} value={brand.name}>{brand.name}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Year */}
            <div className="space-y-1.5">
              <div className="text-xs text-muted-foreground">Year</div>
              <Popover open={isEditingField === "year"} onOpenChange={(open) => !open && handleEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start w-full group"
                    onClick={() => handleEditStart("year")}
                  >
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                        {item.year || 'Not specified'}
                      </Badge>
                      <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2">Edit</span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 dark:bg-black/90 dark:border-border">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-foreground">Edit Year</h4>
                    <div className="space-y-2">
                      <select 
                        className="w-full p-2 rounded-md border border-input bg-background"
                        value={item.year?.toString() || ""}
                        onChange={(e) => handleUpdateField("year", e.target.value ? parseInt(e.target.value) : null)}
                      >
                        <option value="">Not specified</option>
                        {YEAR_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Condition */}
            <div className="space-y-1.5">
              <div className="text-xs text-muted-foreground">Condition</div>
              <Popover open={isEditingField === "condition"} onOpenChange={(open) => !open && handleEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start w-full group"
                    onClick={() => handleEditStart("condition")}
                  >
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                        {item.condition || 'Not specified'}
                      </Badge>
                      <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2">Edit</span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 dark:bg-black/90 dark:border-border">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-foreground">Edit Condition</h4>
                    <div className="space-y-2">
                      <select 
                        className="w-full p-2 rounded-md border border-input bg-background"
                        value={item.condition}
                        onChange={(e) => handleUpdateField("condition", e.target.value as ItemCondition)}
                      >
                        {CONDITION_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Notes */}
            <div className="space-y-1.5 col-span-2">
              <div className="text-xs text-muted-foreground">Notes</div>
              <Popover open={isEditingField === "notes"} onOpenChange={(open) => !open && handleEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start w-full group"
                    onClick={() => handleEditStart("notes")}
                  >
                    <div className="w-full bg-primary/5 hover:bg-primary/10 p-2 rounded text-sm min-h-[60px] overflow-y-auto text-left relative">
                      <span className="block whitespace-pre-wrap">{item.notes || 'No notes added'}</span>
                      <span className="absolute top-1 right-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-foreground">Edit Notes</h4>
                    <div className="space-y-2">
                      <textarea 
                        className="w-full p-2 rounded-md border border-input bg-background min-h-[100px]"
                        value={tempNotes}
                        onChange={(e) => setTempNotes(e.target.value)}
                        placeholder="Add notes about this item..."
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                      <Button onClick={() => handleUpdateField("notes", tempNotes)}>Save</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        {/* Delete button at the bottom */}
        <div className="pt-4 mt-4 border-t border-border flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-destructive"
            onClick={handleDeleteItem}
          >
            Delete Item
          </Button>
        </div>
      </div>
    </Card>
  );
} 