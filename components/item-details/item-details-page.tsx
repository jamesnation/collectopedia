"use client";

/**
 * components/item-details/item-details-page.tsx
 * 
 * This component is the main container for the item details page.
 * Refactored to use the ItemDetailsContext provider with React Query
 * for improved data fetching, caching, and optimistic updates.
 */

import { useRouter } from "next/navigation";
import { ItemDetailsProvider } from "./context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { ItemCondition } from "@/types/item-types";
import { ItemGallerySection } from "./ui/item-gallery-section";
import { ItemDetailsSection } from "./ui/item-details-section";
import { ItemImageUploadDialog } from "./ui/item-image-upload-dialog";
import { useItemDetails } from "./context";

// Item type definition
interface Item {
  id: string;
  name: string;
  type: string;
  franchise: string;
  brand: string;
  year: number | null;
  condition: ItemCondition;
  acquired: Date | null;
  notes: string | null;
  cost: number;
  value: number;
  soldPrice: number | null;
  soldDate: Date | null;
  isSold: boolean;
  ebayListed: number | null;
  images: { id: string; url: string; alt?: string }[];
}

// History event type
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

interface ItemDetailsPageProps {
  itemId: string;
  loadItem: (id: string) => Promise<Item>;
  updateItem: (id: string, data: Partial<Item>) => Promise<Item>;
  deleteItem: (id: string) => Promise<void>;
  loadHistoryEvents: (id: string) => Promise<HistoryEvent[]>;
  refreshAiPrice: (id: string) => Promise<number | null | { price: number; debugData: any }>;
}

export function ItemDetailsPage({
  itemId,
  loadItem,
  updateItem,
  deleteItem,
  loadHistoryEvents,
  refreshAiPrice
}: ItemDetailsPageProps) {
  return (
    <ItemDetailsProvider
      itemId={itemId}
      loadItem={loadItem}
      updateItem={updateItem}
      deleteItem={deleteItem}
      loadHistoryEvents={loadHistoryEvents}
      refreshAiPrice={refreshAiPrice}
    >
      <ItemDetailsContent />
    </ItemDetailsProvider>
  );
}

// The content component uses the context
function ItemDetailsContent() {
  const router = useRouter();
  const { item, isLoading, error } = useItemDetails();

  // Render loading state
  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full rounded-xl" />
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }
  
  // Render an error state
  if (error || !item) {
    return (
      <div className="container py-6">
        <Card className="p-6 flex flex-col items-center justify-center space-y-4">
          <h2 className="text-xl font-bold text-destructive">Error Loading Item</h2>
          <p className="text-center text-muted-foreground">{error || "Item not found."}</p>
          <Button onClick={() => router.push("/my-collection")}>
            Return to Collection
          </Button>
        </Card>
      </div>
    );
  }
  
  // Render the actual component with the original layout structure
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black/30">
      <main className="container mx-auto px-2 sm:px-4 py-8 sm:py-12 max-w-7xl overflow-x-hidden">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="inline-flex items-center text-purple-400 hover:text-primary/50 mb-4 sm:mb-8"
          onClick={() => router.push("/my-collection")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collection
        </Button>
        
        {/* Main content - two column layout with gallery on left, details on right */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-8 w-full overflow-hidden">
          {/* Image gallery column */}
          <ItemGallerySection />
          
          {/* Details column */}
          <ItemDetailsSection />
        </div>
      </main>
      
      {/* Image Upload Dialog */}
      <ItemImageUploadDialog />
    </div>
  );
} 