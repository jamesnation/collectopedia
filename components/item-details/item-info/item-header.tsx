"use client";

/**
 * components/item-details/item-info/item-header.tsx
 * 
 * This component displays the item title with an edit button.
 */

import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface ItemHeaderProps {
  name: string;
  isEditing: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditSave: (name: string) => Promise<void>;
}

export function ItemHeader({
  name,
  isEditing,
  onEditStart,
  onEditCancel,
  onEditSave
}: ItemHeaderProps) {
  const [editedName, setEditedName] = useState(name);

  const handleSave = async () => {
    await onEditSave(editedName);
  };

  // Update local state when prop changes
  if (name !== editedName && !isEditing) {
    setEditedName(name);
  }

  return (
    <Popover open={isEditing} onOpenChange={(open) => !open && onEditCancel()}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="p-0 h-auto font-normal text-2xl font-bold font-serif mb-4 dark:text-foreground group"
          onClick={onEditStart}
        >
          <span>{name}</span>
          <Edit className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-purple-400">Edit Item Name</h4>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-purple-400">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
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
              onClick={handleSave} 
              className="bg-primary/70 text-primary-foreground hover:bg-primary/60"
            >
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 