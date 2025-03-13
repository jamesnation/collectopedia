"use client";

/**
 * components/item-details/item-tabs/notes-tab.tsx
 * 
 * This component displays and manages the notes tab content.
 */

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { Label } from "@/components/ui/label";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";

interface NotesTabProps {
  notes: string | null;
  isEditing: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditSave: (notes: string) => Promise<void>;
}

export function NotesTab({
  notes,
  isEditing,
  onEditStart,
  onEditCancel,
  onEditSave
}: NotesTabProps) {
  const [editedNotes, setEditedNotes] = useState(notes || "");

  const handleSaveNotes = async () => {
    await onEditSave(editedNotes);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Item Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <Popover open={isEditing} onOpenChange={(open) => !open && onEditCancel()}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start text-left font-normal p-4 bg-muted/30 hover:bg-muted/50 rounded-md group"
              onClick={onEditStart}
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
                  onClick={handleSaveNotes} 
                  className="bg-primary/70 text-primary-foreground hover:bg-primary/60"
                >
                  Save
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
} 