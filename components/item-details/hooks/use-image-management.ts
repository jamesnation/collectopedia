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

export function useImageManagement(itemId: string | undefined, userId: string | undefined) {
  const [images, setImages] = useState<SelectImage[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { toast } = useToast()
  const { invalidateCache } = useImageCache()
  
  // Define fetchImages with useCallback before using it in useEffect
  const fetchImages = useCallback(async (id: string) => {
    const result = await getImagesByItemIdAction(id)
    if (result.isSuccess && result.data) {
      setImages(result.data)
      
      // Always invalidate the cache when fetching fresh images
      // This ensures the catalog will reload the latest images
      console.log(`[ITEM-DETAILS] Invalidating cache for item ${id} after fetching new images`)
      invalidateCache(id)
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
        
        // Invalidate the image cache for this item
        invalidateCache(itemId)
        
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
        
        // Invalidate the image cache for this item
        invalidateCache(itemId)
        
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
              
              // Invalidate the image cache for this item
              console.log(`[ITEM-DETAILS] Invalidating cache for item ${itemId} after reordering images`)
              invalidateCache(itemId)
              
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
    refetchImages: () => itemId && fetchImages(itemId)
  }
} 