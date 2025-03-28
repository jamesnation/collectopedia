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
    console.log(`[ITEM-DETAILS] Force invalidating and reloading images for item ${id}`)
    
    // First invalidate the cache
    invalidateCache(id)
    
    // Set flag to track that changes have been made
    setHasImageChanges(true)
    
    // Attempt to immediately reload the images into the cache
    // This makes them available faster when returning to catalog
    setTimeout(() => {
      loadImages([id], true)
    }, 100)
  }, [invalidateCache, loadImages])
  
  // Define fetchImages with useCallback before using it in useEffect
  const fetchImages = useCallback(async (id: string) => {
    const result = await getImagesByItemIdAction(id)
    if (result.isSuccess && result.data) {
      setImages(result.data)
      
      // Set session storage to help catalog recognize the changes immediately
      if (typeof window !== 'undefined') {
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
    if (itemId && hasImageChanges) {
      // Set flags in sessionStorage to force reload in catalog
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('invalidated_item', itemId)
        sessionStorage.setItem('invalidated_timestamp', Date.now().toString())
        sessionStorage.setItem('force_reload_images', 'true')
        
        // Force a quick reload before navigating
        loadImages([itemId], true)
      }
    }
    
    // Navigate after a short delay to allow cache operations to complete
    setTimeout(() => {
      router.push('/my-collection')
    }, 150)
  }, [itemId, hasImageChanges, router, loadImages])
  
  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      // This runs when component unmounts
      if (itemId && hasImageChanges) {
        console.log(`[ITEM-DETAILS] Component unmounting with image changes for ${itemId}`)
        
        // Set flags in sessionStorage to force reload in catalog
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('invalidated_item', itemId)
          sessionStorage.setItem('invalidated_timestamp', Date.now().toString())
          sessionStorage.setItem('force_reload_images', 'true')
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
    
    if (active && over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        
        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // Update the server with the new order
        const updatedOrders = newItems.map((item, index) => ({
          id: item.id,
          order: index
        }))
        
        if (itemId) {
          // Update the server with the new order
          reorderImagesAction(itemId, updatedOrders)
            .then(() => {
              // Refetch the images to ensure we have the latest order from the server
              // This ensures the primary image is correctly identified for AI price estimation
              fetchImages(itemId)
              
              // Enhanced invalidation with forced reload
              forceInvalidateAndReload(itemId)
              
              toast({
                title: "Success",
                description: "Image order updated successfully",
                variant: "default",
              })
            })
            .catch((error: Error) => {
              console.error('Failed to update image order:', error)
              toast({
                title: "Error",
                description: "Failed to update image order",
                variant: "destructive",
              })
            })
        }
        
        return newItems
      })
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