"use client";

/**
 * components/item-details/item-info/sold-details.tsx
 * 
 * This component displays sold details for a sold item,
 * including sold price and date.
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { useRegionContext } from "@/contexts/region-context";

interface SoldDetailsProps {
  soldPrice: number | null;
  soldDate: Date | null;
  isEditingSoldPrice: boolean;
  isEditingSoldDate: boolean;
  onEditSoldPriceStart: () => void;
  onEditSoldDateStart: () => void;
  onEditCancel: () => void;
  onEditSoldPriceSave: (price: number) => Promise<void>;
  onEditSoldDateSave: (date: Date) => Promise<void>;
}

export function SoldDetails({
  soldPrice,
  soldDate,
  isEditingSoldPrice,
  isEditingSoldDate,
  onEditSoldPriceStart,
  onEditSoldDateStart,
  onEditCancel,
  onEditSoldPriceSave,
  onEditSoldDateSave
}: SoldDetailsProps) {
  const { formatCurrency } = useRegionContext();
  const [editedSoldPrice, setEditedSoldPrice] = useState(soldPrice?.toString() || "");
  const [editedSoldDate, setEditedSoldDate] = useState(
    soldDate ? new Date(soldDate).toISOString().split('T')[0] : ""
  );

  // Update local state when props change
  useEffect(() => {
    if (!isEditingSoldPrice && soldPrice !== null) {
      setEditedSoldPrice(soldPrice.toString());
    }
    if (!isEditingSoldDate && soldDate) {
      setEditedSoldDate(new Date(soldDate).toISOString().split('T')[0]);
    }
  }, [soldPrice, soldDate, isEditingSoldPrice, isEditingSoldDate]);

  const handleSoldPriceSave = () => {
    const parsedPrice = parseInt(editedSoldPrice);
    if (!isNaN(parsedPrice)) {
      onEditSoldPriceSave(parsedPrice);
    }
  };

  const handleSoldDateSave = () => {
    if (editedSoldDate) {
      onEditSoldDateSave(new Date(editedSoldDate));
    }
  };

  return (
    <div className="pt-4 border-t border-border">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Sale Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Sold Price</Label>
          <Popover open={isEditingSoldPrice} onOpenChange={(open) => !open && onEditCancel()}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="p-0 h-auto font-normal group w-full text-left justify-start !items-start"
                onClick={onEditSoldPriceStart}
              >
                <div className="flex items-center">
                  <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10 text-purple-400 font-semibold">
                    {formatCurrency(soldPrice || 0)}
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
                    value={editedSoldPrice}
                    onChange={(e) => setEditedSoldPrice(e.target.value)}
                    className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onEditCancel} 
                    className="border-input text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleSoldPriceSave} 
                    className="bg-primary/70 text-primary-foreground hover:bg-primary/60"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Sold Date</Label>
          <Popover open={isEditingSoldDate} onOpenChange={(open) => !open && onEditCancel()}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="p-0 h-auto font-normal group w-full text-left justify-start !items-start"
                onClick={onEditSoldDateStart}
              >
                <div className="flex items-center">
                  <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10 text-purple-400 font-semibold">
                    {soldDate ? new Date(soldDate).toLocaleDateString() : 'Not specified'}
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
                    value={editedSoldDate}
                    onChange={(e) => setEditedSoldDate(e.target.value)}
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
                    onClick={handleSoldDateSave} 
                    className="bg-primary/70 text-primary-foreground hover:bg-primary/60"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
} 