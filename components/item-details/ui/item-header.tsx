"use client";

/**
 * components/item-details/ui/item-header.tsx
 * 
 * This component displays the item name and provides editing functionality.
 * It uses the ItemDetailsContext for state management.
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useItemDetails } from "../context";
import { Input } from "@/components/ui/input";
import { Pencil, X, Check } from "lucide-react";

export function ItemHeader() {
  const { 
    item, 
    isEditingField, 
    handleEditStart, 
    handleEditCancel, 
    handleUpdateField 
  } = useItemDetails();
  
  const [tempName, setTempName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Set up the temp name when editing begins
  useEffect(() => {
    if (isEditingField === "name" && item) {
      setTempName(item.name);
      // Focus the input
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [isEditingField, item]);

  if (!item) return null;

  const isEditing = isEditingField === "name";

  // Handle save
  const handleSave = () => {
    if (tempName.trim() === "") return;
    handleUpdateField("name", tempName);
  };

  // Handle keydown for save on enter, cancel on escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleEditCancel();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {isEditing ? (
        <Card className="p-3 flex items-center gap-2">
          <Input
            ref={inputRef}
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-xl font-bold flex-1"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleEditCancel}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={handleSave}
            className="h-8 w-8"
          >
            <Check className="h-4 w-4" />
          </Button>
        </Card>
      ) : (
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 group">
          {item.name}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditStart("name")}
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </h1>
      )}
    </div>
  );
} 