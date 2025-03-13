"use client";

/**
 * components/item-details/item-tabs/details-tab.tsx
 * 
 * This component displays and manages the item details tab content.
 */

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Edit, Save } from "lucide-react";
import { ItemCondition } from "@/types/item-types";

interface DetailField {
  key: string;
  label: string;
  value: string | number | null;
  type: 'text' | 'number' | 'select' | 'date';
  options?: { value: string; label: string }[];
  editable: boolean;
}

interface DetailsTabProps {
  itemId: string;
  details: DetailField[];
  isEditing: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditSave: (fields: Record<string, string | number | null>) => Promise<void>;
}

export function DetailsTab({
  itemId,
  details,
  isEditing,
  onEditStart,
  onEditCancel,
  onEditSave
}: DetailsTabProps) {
  const [editedFields, setEditedFields] = useState<Record<string, string | number | null>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Initialize edited fields with current values
    const initialFields = details.reduce((acc, field) => {
      acc[field.key] = field.value;
      return acc;
    }, {} as Record<string, string | number | null>);
    
    setEditedFields(initialFields);
  }, [details]);

  const handleFieldChange = (key: string, value: string | number | null) => {
    setEditedFields(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onEditSave(editedFields);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFieldValue = (field: DetailField) => {
    if (field.value === null || field.value === "") {
      return <span className="text-muted-foreground italic">Not specified</span>;
    }

    if (field.type === 'select' && field.options) {
      const option = field.options.find(opt => opt.value === field.value);
      return option ? option.label : field.value;
    }

    if (field.type === 'date' && field.value) {
      return new Date(field.value.toString()).toLocaleDateString();
    }

    return field.value;
  };

  const renderEditField = (field: DetailField) => {
    const currentValue = editedFields[field.key];
    
    if (field.type === 'select' && field.options) {
      return (
        <Select
          value={currentValue?.toString() || ""}
          onValueChange={(value) => handleFieldChange(field.key, value)}
          disabled={!field.editable}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`Select ${field.label}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field.type === 'date') {
      return (
        <Input
          type="date"
          value={currentValue?.toString() || ""}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          disabled={!field.editable}
        />
      );
    }

    if (field.type === 'number') {
      return (
        <Input
          type="number"
          value={currentValue?.toString() || ""}
          onChange={(e) => handleFieldChange(field.key, e.target.valueAsNumber || null)}
          disabled={!field.editable}
        />
      );
    }

    return (
      <Input
        type="text"
        value={currentValue?.toString() || ""}
        onChange={(e) => handleFieldChange(field.key, e.target.value)}
        disabled={!field.editable}
      />
    );
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Item Details</CardTitle>
        {!isEditing ? (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onEditStart}
            className="gap-1"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onEditCancel}
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
              className="gap-1"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {details.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key} className="text-sm font-medium">
                {field.label}
              </Label>
              {isEditing ? (
                renderEditField(field)
              ) : (
                <div
                  className="p-2 rounded-md bg-muted/30 text-sm"
                >
                  {renderFieldValue(field)}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 