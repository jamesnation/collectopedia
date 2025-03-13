"use client";

/**
 * components/item-details/item-info/item-status.tsx
 * 
 * This component manages the sold status of an item,
 * allowing the user to mark an item as sold or unsold.
 */

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";
import { useRegionContext } from "@/contexts/region-context";

interface ItemStatusProps {
  isSold: boolean;
  soldPrice: string;
  soldDate: string;
  showSoldDetails: boolean;
  onToggleSold: (checked: boolean) => Promise<void>;
  onSoldPriceChange: (price: string) => void;
  onSoldDateChange: (date: string) => void;
  onSaveSoldDetails: () => Promise<void>;
}

export function ItemStatus({
  isSold,
  soldPrice,
  soldDate,
  showSoldDetails,
  onToggleSold,
  onSoldPriceChange,
  onSoldDateChange,
  onSaveSoldDetails
}: ItemStatusProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSoldDetails = async () => {
    setIsSaving(true);
    try {
      await onSaveSoldDetails();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <Switch
          id="item-status"
          checked={isSold}
          onCheckedChange={onToggleSold}
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

      {/* Show sold details form when the item is marked as sold but doesn't have sold details yet */}
      {isSold && showSoldDetails && (
        <div className="mt-4">
          <Card className="border border-red-100 dark:border-red-900/20 bg-red-50/30 dark:bg-red-950/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-700 dark:text-red-400">Sale Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sold-price" className="text-xs text-red-600 dark:text-red-400">Sold Price</Label>
                  <Input
                    id="sold-price"
                    name="soldPrice"
                    type="number"
                    placeholder="Enter sold price"
                    value={soldPrice}
                    onChange={(e) => onSoldPriceChange(e.target.value)}
                    className="border-red-200 dark:border-red-800/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sold-date" className="text-xs text-red-600 dark:text-red-400">Sold Date</Label>
                  <Input
                    id="sold-date"
                    type="date"
                    value={soldDate}
                    onChange={(e) => onSoldDateChange(e.target.value)}
                    className="border-red-200 dark:border-red-800/40"
                  />
                </div>
              </div>
              <Button 
                onClick={handleSaveSoldDetails} 
                className="w-full bg-primary/70 text-primary-foreground hover:bg-primary/60"
                disabled={isSaving || !soldPrice || !soldDate}
              >
                {isSaving ? 
                  <span className="flex items-center">Saving...</span> : 
                  <span className="flex items-center"><Save className="w-4 h-4 mr-2" /> Save Sold Details</span>
                }
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
} 