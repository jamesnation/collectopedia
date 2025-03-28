/**
 * Hook for managing item images
 * 
 * This hook manages:
 * - Loading images for an item
 * - Image gallery navigation
 * - Image uploads
 * - Image deletion
 * - Image reordering
 * - Image cache invalidation
 * 
 * Updated: Added debugging logs to track invalidation and session storage operations
 */

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { useImageCache } from '../../catalog/context/image-cache-context'
import { 
  getImagesByItemIdAction, 
  createImageAction, 
  deleteImageAction, 
  reorderImagesAction 
} from '@/actions/images-actions'
import { SelectImage } from '@/db/schema/images-schema'
import { arrayMove } from '@dnd-kit/sortable'
import { useRouter } from 'next/navigation'

export function useImageManagement(itemId: string | undefined, userId: string | undefined) {
  const [images, setImages] = useState<SelectImage[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { toast } = useToast()
  const { invalidateCache, loadImages } = useImageCache()
  const router = useRouter()
  
  // Track if we've made changes that need to be reflected in the catalog
  const [hasImageChanges, setHasImageChanges] = useState(false)
  
  // Enhanced invalidation helper function that also forces reload
  const forceInvalidateAndReload = useCallback((id: string) => {
    console.log(`[ITEM-DETAILS-DEBUG] Force invalidating and reloading images for item ${id}`)
    
    // First invalidate the cache
    invalidateCache(id)
    
    // Set flag to track that changes have been made
    setHasImageChanges(true)
    
    // Log session storage operations for debugging
    if (typeof window !== 'undefined') {
      console.log('[ITEM-DETAILS-DEBUG] Setting session storage for invalidation')
      try {
        sessionStorage.setItem('invalidated_item', id)
        sessionStorage.setItem('invalidated_timestamp', Date.now().toString())
        sessionStorage.setItem('force_reload_images', 'true')
        
        // Verify the session storage was correctly set
        const storedId = sessionStorage.getItem('invalidated_item')
        const storedTimestamp = sessionStorage.getItem('invalidated_timestamp')
        const storedForceReload = sessionStorage.getItem('force_reload_images')
        
        console.log(`[ITEM-DETAILS-DEBUG] Verified session storage: 
          - invalidated_item: ${storedId === id ? 'correct' : `wrong - expected ${id}, got ${storedId}`}
          - invalidated_timestamp: ${storedTimestamp ? 'set' : 'not set'}
          - force_reload_images: ${storedForceReload === 'true' ? 'correct' : `wrong - expected true, got ${storedForceReload}`}
        `)
      } catch (error) {
        console.error('[ITEM-DETAILS-DEBUG] Error setting session storage:', error)
      }
    }
    
    // Attempt to immediately reload the images into the cache
    // This makes them available faster when returning to catalog
    setTimeout(() => {
      console.log(`[ITEM-DETAILS-DEBUG] Attempting to load images for item ${id} after invalidation`)
      loadImages([id], true)
    }, 100)
  }, [invalidateCache, loadImages])
  
  // Define fetchImages with useCallback before using it in useEffect
  const fetchImages = useCallback(async (id: string) => {
    console.log(`[ITEM-DETAILS-DEBUG] Fetching images for item ${id}`)
    const result = await getImagesByItemIdAction(id)
    if (result.isSuccess && result.data) {
      setImages(result.data)
      
      // Set session storage to help catalog recognize the changes immediately
      if (typeof window !== 'undefined') {
        console.log(`[ITEM-DETAILS-DEBUG] Setting session storage after fetching images`)
        sessionStorage.setItem('invalidated_item', id)
        sessionStorage.setItem('invalidated_timestamp', Date.now().toString())
        sessionStorage.setItem('force_reload_images', 'true')
      }
      
      // Only invalidate cache on first load if we have new data
      if (result.data.length > 0) {
        console.log(`[ITEM-DETAILS] Loaded ${result.data.length} images for item ${id}`)
        invalidateCache(id)
      }
    } else {
      console.error("Failed to fetch images:", result.error)
    }
  }, [invalidateCache])
  
  // Fetch images when item ID changes
  useEffect(() => {
    if (itemId) {
      fetchImages(itemId)
    }
  }, [itemId, fetchImages])
  
  // Function to navigate back to catalog, ensuring images will be refreshed
  const navigateBackToCatalog = useCallback(() => {
    console.log(`[ITEM-DETAILS-DEBUG] Navigating back to catalog. hasImageChanges: ${hasImageChanges}`)
    
    if (itemId && hasImageChanges) {
      // Set flags in localStorage for more reliable persistence
      if (typeof window !== 'undefined') {
        console.log(`[ITEM-DETAILS-CACHE-FIX] Setting both sessionStorage and localStorage before navigation`)
        
        // Set sessionStorage first (for backward compatibility)
        sessionStorage.setItem('invalidated_item', itemId)
        sessionStorage.setItem('invalidated_timestamp', Date.now().toString())
        sessionStorage.setItem('force_reload_images', 'true')
        
        // Set localStorage flags as well (more reliable)
        try {
          // Get current cache
          const cacheData = localStorage.getItem('collectopedia-image-cache')
          if (cacheData) {
            const cache = JSON.parse(cacheData)
            
            // If this item exists in cache, mark it for forced refresh
            if (cache[itemId]) {
              console.log(`[ITEM-DETAILS-CACHE-FIX] Found item ${itemId} in cache, marking for forced refresh on navigation`)
              cache[itemId].cachedAt = 0 // This will force a refresh
              localStorage.setItem('collectopedia-image-cache', JSON.stringify(cache))
            }
          }
          
          // Set additional direct flags that will be checked in the catalog component
          localStorage.setItem('collectopedia-force-refresh-item', itemId)
          localStorage.setItem('collectopedia-force-refresh-timestamp', Date.now().toString())
          
          // Verify the localStorage was correctly set
          const storedDirectItem = localStorage.getItem('collectopedia-force-refresh-item')
          console.log(`[ITEM-DETAILS-CACHE-FIX] localStorage verification: ${storedDirectItem === itemId ? 'correct' : 'wrong'}`)
        } catch (error) {
          console.error('[ITEM-DETAILS-CACHE-FIX] Error updating localStorage before navigation:', error)
        }
        
        // Force a quick reload before navigating
        console.log(`[ITEM-DETAILS-DEBUG] Forcing reload before navigation`)
        loadImages([itemId], true)
      }
    }
    
    // Increased navigation delay to allow more time for cache operations
    console.log(`[ITEM-DETAILS-DEBUG] Scheduling navigation with timeout`)
    setTimeout(() => {
      console.log(`[ITEM-DETAILS-DEBUG] Executing navigation to /my-collection`)
      router.push('/my-collection')
    }, 350) // Increased from 250ms to 350ms for more reliability
  }, [itemId, hasImageChanges, router, loadImages])
  
  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      // This runs when component unmounts
      if (itemId && hasImageChanges) {
        console.log(`[ITEM-DETAILS-DEBUG] Component unmounting with image changes for ${itemId}`)
        
        // Set flags in sessionStorage to force reload in catalog
        if (typeof window !== 'undefined') {
          console.log(`[ITEM-DETAILS-DEBUG] Setting session storage during unmount`)
          try {
            sessionStorage.setItem('invalidated_item', itemId)
            sessionStorage.setItem('invalidated_timestamp', Date.now().toString())
            sessionStorage.setItem('force_reload_images', 'true')
            
            // Verify the session storage was correctly set
            const storedId = sessionStorage.getItem('invalidated_item')
            console.log(`[ITEM-DETAILS-DEBUG] Unmount session storage verification: ${storedId === itemId ? 'correct' : 'wrong'}`)
          } catch (error) {
            console.error('[ITEM-DETAILS-DEBUG] Error setting session storage during unmount:', error)
          }
        }
      }
    }
  }, [itemId, hasImageChanges])
  
  // Handle upload of a new image
  const handleImageUpload = async (url: string) => {
    if (!itemId || !userId) {
      toast({
        title: "Error",
        description: "Item ID or User ID is missing. Cannot upload image.",
        variant: "destructive",
      })
      return
    }
    
    try {
      // Create a new image entry
      const imageResult = await createImageAction({
        itemId,
        userId,
        url,
      })

      if (imageResult.isSuccess && imageResult.data) {
        // Add the new image to the images array
        setImages(prevImages => {
          if (imageResult.data) {
            return [...prevImages, imageResult.data]
          }
          return prevImages
        })
        
        // Set the current image index to show the new image
        setCurrentImageIndex(images.length)
        
        // Enhanced invalidation with forced reload
        forceInvalidateAndReload(itemId)
        
        // IMPORTANT: Force direct localStorage cache update
        // This approach is more reliable than sessionStorage for persistence
        if (typeof window !== 'undefined') {
          console.log(`[ITEM-DETAILS-CACHE-FIX] Directly updating localStorage cache for item ${itemId}`)
          
          try {
            // Get current cache
            const cacheData = localStorage.getItem('collectopedia-image-cache')
            if (cacheData) {
              const cache = JSON.parse(cacheData)
              
              // If this item exists in cache, mark it for forced refresh
              // by setting cachedAt to 0, which will force a refresh on next load
              if (cache[itemId]) {
                console.log(`[ITEM-DETAILS-CACHE-FIX] Found item ${itemId} in cache, marking for forced refresh`)
                cache[itemId].cachedAt = 0 // This will force a refresh
                localStorage.setItem('collectopedia-image-cache', JSON.stringify(cache))
              }
            }
            
            // Set additional flags that will persist better than sessionStorage
            localStorage.setItem('collectopedia-force-refresh-item', itemId)
            localStorage.setItem('collectopedia-force-refresh-timestamp', Date.now().toString())
          } catch (error) {
            console.error('[ITEM-DETAILS-CACHE-FIX] Error updating localStorage:', error)
          }
        }
        
        toast({
          title: "Image uploaded",
          description: "Your new image has been added to the item.",
        })
      } else {
        throw new Error('Failed to create image entry')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  // Delete an image
  const handleImageDelete = async (imageId: string) => {
    try {
      if (!itemId) return
      
      const result = await deleteImageAction(imageId, itemId)
      if (result.isSuccess) {
        setImages(prevImages => prevImages.filter(img => img.id !== imageId))
        setCurrentImageIndex(prevIndex => Math.min(prevIndex, images.length - 2))
        
        // Enhanced invalidation with forced reload
        forceInvalidateAndReload(itemId)
        
        toast({
          title: "Image deleted",
          description: "The image has been removed from the item.",
        })
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      toast({
        title: "Error",
        description: "Failed to delete image. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  // Navigate to previous image
  const handlePreviousImage = () => {
    setCurrentImageIndex(prevIndex => 
      prevIndex > 0 ? prevIndex - 1 : images.length - 1
    )
  }
  
  // Navigate to next image
  const handleNextImage = () => {
    setCurrentImageIndex(prevIndex => 
      prevIndex < images.length - 1 ? prevIndex + 1 : 0
    )
  }
  
  // Set current image index directly
  const setActiveImage = (index: number) => {
    setCurrentImageIndex(index)
  }
  
  // Handle reordering of images (drag and drop)
  const handleImageReorder = async (event: any) => {
    const { active, over } = event
    
    if (active && over && active.id !== over.id && itemId) {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        
        return arrayMove(items, oldIndex, newIndex)
      })
      
      // Update the server with the new order
      const updatedOrders = images.map((item, index) => ({
        id: item.id,
        order: index
      }))
      
      try {
        await reorderImagesAction(itemId, updatedOrders)
        // Force invalidate to ensure catalog updates
        forceInvalidateAndReload(itemId)
        
        toast({
          title: "Success",
          description: "Image order updated successfully",
          variant: "default",
        })
      } catch (error) {
        console.error('Error reordering images:', error)
        toast({
          title: "Error",
          description: "Failed to update image order. Please try again.",
          variant: "destructive",
        })
      }
    }
  }
  
  return {
    images,
    currentImageIndex,
    handleImageUpload,
    handleImageDelete,
    handlePreviousImage,
    handleNextImage,
    setActiveImage,
    handleImageReorder,
    refetchImages: () => itemId && fetchImages(itemId),
    navigateBackToCatalog,
    hasImageChanges
  }
} 