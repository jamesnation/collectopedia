"use client";

/**
 * components/item-details/item-tabs/tabs-container.tsx
 * 
 * This component provides a tabbed interface for the item details page.
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotesTab, DetailsTab, HistoryTab } from "./index";
import { ItemCondition } from "@/types/item-types";

// Type for history events
interface HistoryEvent {
  id: string;
  type: 'created' | 'updated' | 'priceChange' | 'sold' | 'purchased' | 'statusChange';
  timestamp: string;
  details: {
    field?: string;
    oldValue?: string | number | null;
    newValue?: string | number | null;
    price?: number;
    note?: string;
  };
}

// Type for detail fields
interface DetailField {
  key: string;
  label: string;
  value: string | number | null;
  type: 'text' | 'number' | 'select' | 'date';
  options?: { value: string; label: string }[];
  editable: boolean;
}

interface TabsContainerProps {
  itemId: string;
  
  // Notes tab props
  notes: string | null;
  onNotesEdit: (notes: string) => Promise<void>;
  
  // Details tab props
  details: DetailField[];
  onDetailsEdit: (fields: Record<string, string | number | null>) => Promise<void>;
  
  // History tab props
  historyEvents: HistoryEvent[];
  historyIsLoading?: boolean;
}

export function TabsContainer({
  itemId,
  notes,
  onNotesEdit,
  details,
  onDetailsEdit,
  historyEvents,
  historyIsLoading = false
}: TabsContainerProps) {
  const [activeTab, setActiveTab] = useState("details");
  
  // State for editing modes
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  
  // Notes handlers
  const handleNotesEditStart = () => setIsEditingNotes(true);
  const handleNotesEditCancel = () => setIsEditingNotes(false);
  const handleNotesEditSave = async (updatedNotes: string) => {
    await onNotesEdit(updatedNotes);
    setIsEditingNotes(false);
  };
  
  // Details handlers
  const handleDetailsEditStart = () => setIsEditingDetails(true);
  const handleDetailsEditCancel = () => setIsEditingDetails(false);
  const handleDetailsEditSave = async (fields: Record<string, string | number | null>) => {
    await onDetailsEdit(fields);
    setIsEditingDetails(false);
  };
  
  return (
    <Tabs
      defaultValue="details"
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full space-y-4"
    >
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details" className="space-y-4">
        <DetailsTab
          itemId={itemId}
          details={details}
          isEditing={isEditingDetails}
          onEditStart={handleDetailsEditStart}
          onEditCancel={handleDetailsEditCancel}
          onEditSave={handleDetailsEditSave}
        />
      </TabsContent>
      
      <TabsContent value="notes" className="space-y-4">
        <NotesTab
          notes={notes}
          isEditing={isEditingNotes}
          onEditStart={handleNotesEditStart}
          onEditCancel={handleNotesEditCancel}
          onEditSave={handleNotesEditSave}
        />
      </TabsContent>
      
      <TabsContent value="history" className="space-y-4">
        <HistoryTab
          events={historyEvents}
          isLoading={historyIsLoading}
        />
      </TabsContent>
    </Tabs>
  );
} 