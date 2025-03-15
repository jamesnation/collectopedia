import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ItemDetailsPage } from '@/components/item-details/item-details-page';
import { getItemDetailsAction } from '@/actions/item-details-actions';
import { updateItemAction, getItemByIdAction, deleteItemAction } from '@/actions/items-actions';
import { getImagesByItemIdAction } from '@/actions/images-actions';
import { recordItemHistoryAction } from '@/actions/item-history-actions';
import { refreshEbayPriceAction } from '@/actions/item-details-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { ItemCondition } from '@/types/item-types';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

// Define the types needed by our ItemDetailsPage component
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

export default function ItemPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<ItemSkeleton />}>
      <ItemDetailsPageWrapper itemId={params.id} />
    </Suspense>
  );
}

async function ItemDetailsPageWrapper({ itemId }: { itemId: string }) {
  // Define server functions with "use server" directive

  async function loadItem(id: string) {
    "use server"
    
    const result = await getItemDetailsAction(id);
    if (!result.isSuccess || !result.data) {
      throw new Error(result.error || "Failed to load item");
    }
    
    // Transform the API data into the expected Item format
    const item = result.data.item;
    
    // Since our API item doesn't have images in the same format,
    // we need to transform it for the component
    const images = item.image 
      ? [{ id: '1', url: item.image, alt: item.name }] 
      : [];
      
    return {
      ...item,
      images,
    } as Item;
  }

  async function updateItem(id: string, data: any) {
    "use server"
    
    // Import the updateItemWithHistoryAction function from item-details-actions.ts
    const { updateItemWithHistoryAction } = await import('@/actions/item-details-actions');
    
    const result = await updateItemWithHistoryAction(id, data);
    if (!result.isSuccess || !result.data) {
      throw new Error(result.error || "Failed to update item");
    }
    
    // Transform the API response into the expected Item format
    const updatedItem = result.data[0];
    const images = updatedItem.image 
      ? [{ id: '1', url: updatedItem.image, alt: updatedItem.name }] 
      : [];
      
    return {
      ...updatedItem,
      images,
    } as Item;
  }

  async function deleteItem(id: string) {
    "use server"
    
    const result = await deleteItemAction(id);
    if (!result.isSuccess) {
      throw new Error(result.error || "Failed to delete item");
    }
  }

  async function loadHistoryEvents(id: string) {
    "use server"
    
    const result = await getItemDetailsAction(id);
    if (!result.isSuccess || !result.data) {
      throw new Error(result.error || "Failed to load item history");
    }
    
    // Transform the history events to match the expected format
    return (result.data.history || []).map(event => {
      return {
        ...event,
        type: event.type as 'created' | 'updated' | 'priceChange' | 'sold' | 'purchased' | 'statusChange',
        timestamp: event.timestamp.toString(),
      } as HistoryEvent;
    });
  }

  async function refreshAiPrice(id: string) {
    "use server"
    
    try {
      // First get the current item to access before we modify it
      const itemResult = await getItemByIdAction(id);
      if (!itemResult.isSuccess || !itemResult.data) {
        throw new Error("Failed to load item");
      }
      
      // Get enhanced prices using both image and text search
      const { getEnhancedEbayPrices } = await import('@/actions/ebay-actions');
      
      // Get the primary image for the item
      const imagesResult = await getImagesByItemIdAction(id);
      const primaryImage = imagesResult.isSuccess && imagesResult.data && imagesResult.data.length > 0 
                          ? imagesResult.data[0].url 
                          : undefined;
      
      console.log(`Refreshing price for "${itemResult.data.name}" with image: ${primaryImage ? 'Yes' : 'No'}`);
      
      // Get the enhanced prices
      const result = await getEnhancedEbayPrices({
        title: itemResult.data.name,
        image: primaryImage,
        condition: itemResult.data.condition,
        franchise: itemResult.data.franchise,
        region: "UK" // Default to UK
      }, true); // Include debug data
      
      // Prioritize image-based results over text-based
      const bestPrice = result.imageBased?.median || 
                       result.textBased?.median || 
                       result.combined?.median;
      
      if (!bestPrice) {
        console.error("No valid price found in API response:", result);
        throw new Error("No valid price found");
      }
      
      // Round the price
      const roundedPrice = Math.round(bestPrice);
      
      console.log(`Price found: ${roundedPrice} (original: ${bestPrice})`);
      
      // Update only the ebayListed field, not the value field
      const updateResult = await updateItemAction(id, { 
        ebayListed: roundedPrice
      });
      
      if (!updateResult.isSuccess) {
        throw new Error("Failed to update item with new price");
      }
      
      // Record the price change in history
      await recordItemHistoryAction({
        itemId: id,
        userId: auth().userId as string,
        type: 'priceChange',
        details: {
          oldValue: itemResult.data.ebayListed,
          newValue: roundedPrice,
          note: "eBay price updated"
        }
      });
      
      // Revalidate the page
      revalidatePath(`/item/${id}`);
      
      // Return both the price and debug data
      return {
        price: roundedPrice,
        debugData: result.debugData
      };
    } catch (error) {
      console.error("Error getting eBay price:", error);
      return null;
    }
  }

  return (
    <ItemDetailsPage
      itemId={itemId}
      loadItem={loadItem}
      updateItem={updateItem}
      deleteItem={deleteItem}
      loadHistoryEvents={loadHistoryEvents}
      refreshAiPrice={refreshAiPrice}
    />
  );
}

function ItemSkeleton() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}