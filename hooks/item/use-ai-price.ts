/**
 * use-ai-price.ts
 * 
 * A custom hook for handling AI price estimation functionality.
 * This hook manages the state and operations related to fetching
 * current market prices from eBay.
 */

import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { SelectItem as SelectItemType } from "@/db/schema/items-schema";
import { SelectImage } from "@/db/schema/images-schema";
import { useRegionContext } from "@/contexts/region-context";
import { useEbayDebugMode } from "@/hooks/use-ebay-debug-mode";

interface UseAiPriceResult {
  isLoadingAiPrice: boolean;
  debugData: any;
  refreshAiPrice: () => Promise<boolean>;
}

/**
 * Hook for managing AI price operations
 * @param item - The item to estimate price for
 * @param images - Images associated with the item
 * @returns Object with AI price data and operations
 */
export function useAiPrice(
  item: SelectItemType | null,
  images: SelectImage[]
): UseAiPriceResult {
  const [isLoadingAiPrice, setIsLoadingAiPrice] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const { toast } = useToast();
  const { isDebugMode, isInitialized } = useEbayDebugMode();
  const { region } = useRegionContext();

  const refreshAiPrice = useCallback(async (): Promise<boolean> => {
    if (!item) return false;
    
    try {
      setIsLoadingAiPrice(true);
      setDebugData(null); // Clear previous debug data
      
      // Get the current primary image URL
      const primaryImage = images.length > 0 ? images[0].url : undefined;
      
      // Log that we're refreshing with debug mode
      console.log('Refreshing AI price with debug mode:', { isDebugMode, isInitialized });
      
      // Import the action dynamically to avoid SSR issues
      const { getEnhancedEbayPrices } = await import('@/actions/ebay-actions');
      
      // Only proceed with debug mode if it's both enabled and initialized
      const shouldUseDebugMode = isDebugMode && isInitialized;
      
      // Use the enhanced pricing function that combines text and image search
      const result = await getEnhancedEbayPrices(
        {
          title: item.name,
          image: primaryImage,
          condition: item.condition,
          franchise: item.franchise,
          region: region
        }, 
        shouldUseDebugMode
      );
      
      console.log('AI price refresh result:', { 
        hasTextBased: !!result.textBased,
        hasImageBased: !!result.imageBased,
        hasCombined: !!result.combined,
        hasDebugData: !!result.debugData,
        debugModeStatus: { isDebugMode, isInitialized, shouldUseDebugMode }
      });
      
      // Store debug data if available
      if (shouldUseDebugMode && result.debugData) {
        console.log('Setting debug data', result.debugData);
        setDebugData(result.debugData);
      }
      
      // Check if we got pricing results
      if (result.combined || result.textBased || result.imageBased) {
        // Prioritize image-based results over text-based and combined
        const bestPrice = result.imageBased?.median || 
                         result.textBased?.median || 
                         result.combined?.median;
        
        if (bestPrice) {
          // Update in the database
          const { updateItemAction } = await import('@/actions/items-actions');
          await updateItemAction(item.id, {
            ebayListed: bestPrice
          });
          
          const method = result.imageBased ? 'image search' : 
                       result.textBased ? 'text search' : 'combined text+image search';
          
          toast({
            title: "AI Price updated",
            description: `Updated price for ${item.name} using ${method}.`,
          });
          return true;
        } else {
          throw new Error('No valid price found');
        }
      } else {
        throw new Error('Failed to retrieve prices');
      }
    } catch (error) {
      console.error(`Error refreshing AI price for ${item?.name}:`, error);
      toast({
        title: "Error",
        description: "Failed to update AI price. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoadingAiPrice(false);
    }
  }, [item, images, isDebugMode, isInitialized, region, toast]);

  return {
    isLoadingAiPrice,
    debugData,
    refreshAiPrice
  };
} 