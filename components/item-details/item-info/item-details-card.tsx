"use client";

/**
 * components/item-details/item-info/item-details-card.tsx
 * 
 * This component displays the item details card with editable fields
 * for item information like type, brand, year, condition, etc.
 */

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Edit, Trash2 } from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { ItemCondition } from "@/types";

interface ItemDetailsCardProps {
  id: string;
  type: string;
  franchise: string;
  brand: string;
  year: number | null;
  condition: ItemCondition;
  acquired: Date;
  notes: string | null;
  typeOptions: string[];
  franchiseOptions: { value: string; label?: string }[];
  brandOptions: { value: string; label?: string }[];
  yearOptions: { value: string; label: string }[];
  conditionOptions: ItemCondition[];
  isEditingField: (field: string) => boolean;
  onEditStart: (field: string) => void;
  onEditCancel: () => void;
  onUpdateField: (field: string, value: any) => Promise<void>;
  onDeleteItem: () => Promise<void>;
}

export function ItemDetailsCard({
  id,
  type,
  franchise,
  brand,
  year,
  condition,
  acquired,
  notes,
  typeOptions,
  franchiseOptions,
  brandOptions,
  yearOptions,
  conditionOptions,
  isEditingField,
  onEditStart,
  onEditCancel,
  onUpdateField,
  onDeleteItem
}: ItemDetailsCardProps) {
  // Local state for editable fields
  const [editedType, setEditedType] = useState(type);
  const [editedFranchise, setEditedFranchise] = useState(franchise);
  const [editedBrand, setEditedBrand] = useState(brand);
  const [editedYear, setEditedYear] = useState(year?.toString() || "");
  const [editedCondition, setEditedCondition] = useState<ItemCondition>(condition);
  const [editedAcquired, setEditedAcquired] = useState(
    acquired ? new Date(acquired).toISOString().split('T')[0] : ""
  );
  const [editedNotes, setEditedNotes] = useState(notes || "");

  // Update local state when props change
  useEffect(() => {
    if (!isEditingField("type")) setEditedType(type);
    if (!isEditingField("franchise")) setEditedFranchise(franchise);
    if (!isEditingField("brand")) setEditedBrand(brand);
    if (!isEditingField("year")) setEditedYear(year?.toString() || "");
    if (!isEditingField("condition")) setEditedCondition(condition);
    if (!isEditingField("acquired")) {
      setEditedAcquired(acquired ? new Date(acquired).toISOString().split('T')[0] : "");
    }
    if (!isEditingField("notes")) setEditedNotes(notes || "");
  }, [
    type, franchise, brand, year, condition, acquired, notes, 
    isEditingField
  ]);

  // Handlers for each field type
  const handleTypeChange = (value: string) => {
    setEditedType(value);
  };

  const handleFranchiseChange = (value: string) => {
    setEditedFranchise(value);
  };

  const handleBrandChange = (value: string) => {
    setEditedBrand(value);
  };

  const handleYearChange = (value: string) => {
    setEditedYear(value);
  };

  const handleConditionChange = (value: ItemCondition) => {
    setEditedCondition(value);
  };

  const handleSaveChanges = async (field: string) => {
    switch (field) {
      case "type":
        await onUpdateField("type", editedType);
        break;
      case "franchise":
        await onUpdateField("franchise", editedFranchise);
        break;
      case "brand":
        await onUpdateField("brand", editedBrand);
        break;
      case "year":
        await onUpdateField("year", editedYear ? parseInt(editedYear) : null);
        break;
      case "condition":
        await onUpdateField("condition", editedCondition);
        break;
      case "acquired":
        await onUpdateField("acquired", editedAcquired ? new Date(editedAcquired) : null);
        break;
      case "notes":
        await onUpdateField("notes", editedNotes);
        break;
    }
  };

  return (
    <Card className="border dark:border-border shadow-sm dark:bg-card/60">
      <CardHeader>
        <CardTitle>Item Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Status & Acquisition</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date Acquired</Label>
              <Popover open={isEditingField("acquired")} onOpenChange={(open) => !open && onEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start w-full group"
                    onClick={() => onEditStart("acquired")}
                  >
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                        {acquired ? new Date(acquired).toLocaleDateString() : "Not specified"}
                      </Badge>
                      <Edit className="ml-2 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-purple-400">Edit Date Acquired</h4>
                    <div className="space-y-2">
                      <Label htmlFor="acquired" className="text-sm font-medium text-purple-400">
                        Date Acquired
                      </Label>
                      <Input
                        id="acquired"
                        type="date"
                        name="acquired"
                        value={editedAcquired}
                        onChange={(e) => setEditedAcquired(e.target.value)}
                        className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={onEditCancel} 
                        className="border-input text-primary/70 hover:bg-accent hover:text-accent-foreground"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => handleSaveChanges("acquired")} 
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

        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-muted-foreground">Item Information</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Popover open={isEditingField("type")} onOpenChange={(open) => !open && onEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start w-full group"
                    onClick={() => onEditStart("type")}
                  >
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                        {type || "Not specified"}
                      </Badge>
                      <Edit className="ml-2 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                  <h4 className="font-semibold text-sm text-purple-400">Edit Type</h4>
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="type" className="text-sm font-medium text-purple-400">Type</Label>
                    <Select
                      value={editedType}
                      onValueChange={handleTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-black/90">
                        <SelectGroup>
                          <SelectLabel>Item Types</SelectLabel>
                          {typeOptions.map((type) => (
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
                    <Button onClick={() => handleSaveChanges("type")}>Save</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Franchise</Label>
              <Popover open={isEditingField("franchise")} onOpenChange={(open) => !open && onEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start w-full group"
                    onClick={() => onEditStart("franchise")}
                  >
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                        {franchise || "Not specified"}
                      </Badge>
                      <Edit className="ml-2 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                  <h4 className="font-semibold text-sm text-purple-400">Edit Franchise</h4>
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="franchise" className="text-sm font-medium text-purple-400">Franchise</Label>
                    <Select
                      value={editedFranchise}
                      onValueChange={handleFranchiseChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select franchise" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-black/90">
                        <SelectGroup>
                          <SelectLabel>Franchises</SelectLabel>
                          {franchiseOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label || option.value}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={onEditCancel}>Cancel</Button>
                    <Button onClick={() => handleSaveChanges("franchise")}>Save</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Brand</Label>
              <Popover open={isEditingField("brand")} onOpenChange={(open) => !open && onEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start w-full group"
                    onClick={() => onEditStart("brand")}
                  >
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                        {brand || "Not specified"}
                      </Badge>
                      <Edit className="ml-2 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                  <h4 className="font-semibold text-sm text-purple-400">Edit Brand</h4>
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="brand" className="text-sm font-medium text-purple-400">Brand</Label>
                    <Select
                      value={editedBrand}
                      onValueChange={handleBrandChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-black/90">
                        <SelectGroup>
                          <SelectLabel>Brands</SelectLabel>
                          {brandOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label || option.value}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={onEditCancel}>Cancel</Button>
                    <Button onClick={() => handleSaveChanges("brand")}>Save</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Year</Label>
              <Popover open={isEditingField("year")} onOpenChange={(open) => !open && onEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start w-full group"
                    onClick={() => onEditStart("year")}
                  >
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                        {year || "Not specified"}
                      </Badge>
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
                        value={editedYear}
                        onValueChange={handleYearChange}
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
                      <Button 
                        variant="outline" 
                        onClick={onEditCancel} 
                        className="border-input text-primary/70 hover:bg-accent hover:text-accent-foreground"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => handleSaveChanges("year")} 
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
              <Label className="text-xs text-muted-foreground">Condition</Label>
              <Popover open={isEditingField("condition")} onOpenChange={(open) => !open && onEditCancel()}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-normal text-left justify-start w-full group"
                    onClick={() => onEditStart("condition")}
                  >
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                        {condition || "Not specified"}
                      </Badge>
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
                        value={editedCondition}
                        onValueChange={(value) => handleConditionChange(value as ItemCondition)}
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
                      <Button 
                        variant="outline" 
                        onClick={onEditCancel} 
                        className="border-input text-primary/70 hover:bg-accent hover:text-accent-foreground"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => handleSaveChanges("condition")} 
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

        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-muted-foreground">Notes</h3>
          <Popover open={isEditingField("notes")} onOpenChange={(open) => !open && onEditCancel()}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-left font-normal p-4 bg-muted/30 hover:bg-muted/50 rounded-md group"
                onClick={() => onEditStart("notes")}
              >
                <div className="flex items-start">
                  <div className="max-h-40 overflow-y-auto pr-2 flex-grow">
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {notes || "No notes available. Click to add notes about this item."}
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
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                    rows={4}
                    placeholder="Add notes about this item..."
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
                    onClick={() => handleSaveChanges("notes")} 
                    className="bg-primary/70 text-primary-foreground hover:bg-primary/60"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-6 flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="text-muted-foreground hover:text-destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-1" />
              <span className="text-xs">Delete</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="dark:bg-card dark:border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this item?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the item from your collection.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="dark:bg-card dark:border-border dark:text-foreground dark:hover:bg-muted/40">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                onClick={onDeleteItem}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
} 