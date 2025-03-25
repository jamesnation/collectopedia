/**
 * Hook for managing eBay AI price integration
 * 
 * This hook manages:
 * - Refreshing AI price estimates from eBay
 * - Handling loading state during price fetching
 * - Managing debug data for eBay results
 * - Updating the item with the new price
 */

import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { useEbayDebugMode } from '@/hooks/use-ebay-debug-mode'
import { useRegionContext } from '@/contexts/region-context'
import { updateItemAction } from '@/actions/items-actions'
import { getImagesByItemIdAction } from '@/actions/images-actions'
import { SelectItem } from '@/db/schema/items-schema'
import { SelectImage } from '@/db/schema/images-schema'

export function useEbayPricing(
  item: SelectItem | null, 
  images: SelectImage[],
  onItemUpdate: (item: SelectItem) => void
) {
  const [loadingAiPrice, setLoadingAiPrice] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  const { isDebugMode, isInitialized } = useEbayDebugMode()
  const { region } = useRegionContext()
  const { toast } = useToast()

  // Refresh AI price estimate from eBay
  const handleAiPriceRefresh = async () => {
    if (!item) return
    
    try {
      setLoadingAiPrice(true)
      setDebugData(null) // Clear previous debug data
      
      // Get the current primary image URL
      // We need to refetch the images to ensure we have the latest order
      let primaryImage: string | undefined
      
      try {
        // Fetch the latest images to get the correct primary image
        const imagesResult = await getImagesByItemIdAction(item.id)
        if (imagesResult.isSuccess && imagesResult.data && imagesResult.data.length > 0) {
          primaryImage = imagesResult.data[0].url
        } else {
          // Fallback to current images state if fetch fails
          primaryImage = images.length > 0 ? images[0].url : undefined
        }
      } catch (error) {
        console.error("Error fetching latest images:", error)
        // Fallback to current images state
        primaryImage = images.length > 0 ? images[0].url : undefined
      }
      
      // Log that we're refreshing with debug mode
      console.log('Refreshing AI price with debug mode:', { isDebugMode, isInitialized })
      
      // Import the action dynamically to avoid SSR issues
      const { getEnhancedEbayPrices } = await import('@/actions/ebay-actions')
      
      // Only proceed with debug mode if it's both enabled and initialized
      const shouldUseDebugMode = isDebugMode && isInitialized
      
      // Use the enhanced pricing function that combines text and image search
      // Pass isDebugMode to include debug data when enabled
      const result = await getEnhancedEbayPrices(
        {
          title: item.name,
          image: primaryImage,
          condition: item.condition,
          franchise: item.franchise,
          region: region
        }, 
        shouldUseDebugMode // Explicitly pass the debug mode
      )
      
      console.log('AI price refresh result:', { 
        hasTextBased: !!result.textBased,
        hasImageBased: !!result.imageBased,
        hasCombined: !!result.combined,
        hasDebugData: !!result.debugData,
        debugModeStatus: { isDebugMode, isInitialized, shouldUseDebugMode }
      })
      
      // Store debug data if available
      if (shouldUseDebugMode && result.debugData) {
        console.log('Setting debug data', result.debugData)
        setDebugData(result.debugData)
      }
      
      // Check if we got pricing results
      if (result.combined || result.textBased || result.imageBased) {
        // Prioritize combined results, then image-based, then text-based
        const bestPrice = result.combined?.median || 
                         result.imageBased?.median || 
                         result.textBased?.median
        
        if (bestPrice) {
          // Create the updated item with the new price
          const updatedItem = {
            ...item,
            ebayListed: bestPrice
          }
          
          // Update the local state with the new value
          onItemUpdate(updatedItem)
          
          // Also update in the database
          await updateItemAction(item.id, {
            ebayListed: bestPrice
          })
          
          const method = result.combined ? 'combined text+image search' : 
                       result.imageBased ? 'image search' : 'text search'
          
          toast({
            title: "AI Price updated",
            description: `Updated price for ${item.name} using ${method}.`,
          })
        } else {
          throw new Error('No valid price found')
        }
      } else {
        throw new Error('Failed to retrieve prices')
      }
    } catch (error) {
      console.error(`Error refreshing AI price for ${item?.name}:`, error)
      toast({
        title: "Error",
        description: "Failed to update AI price. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingAiPrice(false)
    }
  }
  
  return {
    loadingAiPrice,
    debugData,
    isDebugMode,
    isInitialized,
    handleAiPriceRefresh
  }
} 