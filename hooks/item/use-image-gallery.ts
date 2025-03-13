/**
 * use-image-gallery.ts
 * 
 * A custom hook for managing image gallery operations including 
 * fetching, uploading, deleting, and reordering images.
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { 
  getImagesByItemIdAction, 
  createImageAction, 
  deleteImageAction, 
  reorderImagesAction 
} from "@/actions/images-actions";
import { SelectImage } from "@/db/schema/images-schema";
import { arrayMove } from '@dnd-kit/sortable';

interface UseImageGalleryResult {
  images: SelectImage[];
  currentImageIndex: number;
  isLoading: boolean;
  setCurrentImageIndex: (index: number) => void;
  uploadImage: (url: string, userId: string) => Promise<boolean>;
  deleteImage: (imageId: string) => Promise<boolean>;
  reorderImages: (event: any) => Promise<boolean>;
  fetchImages: () => Promise<void>;
  navigateNext: () => void;
  navigatePrevious: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

/**
 * Hook for managing image gallery operations
 * @param itemId - The ID of the item whose images to manage
 * @returns Object with image data and operations
 */
export function useImageGallery(itemId: string): UseImageGalleryResult {
  const [images, setImages] = useState<SelectImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Fetch images
  const fetchImages = useCallback(async () => {
    if (!itemId) return;
    
    setIsLoading(true);
    try {
      const result = await getImagesByItemIdAction(itemId);
      if (result.isSuccess && result.data) {
        setImages(result.data);
        
        // Reset current index if needed
        if (currentImageIndex >= result.data.length) {
          setCurrentImageIndex(result.data.length > 0 ? 0 : 0);
        }
      } else {
        console.error("Failed to fetch images:", result.error);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setIsLoading(false);
    }
  }, [itemId, currentImageIndex]);
  
  // Upload image
  const uploadImage = useCallback(async (url: string, userId: string): Promise<boolean> => {
    if (!itemId) return false;
    
    try {
      const imageResult = await createImageAction({
        itemId,
        userId,
        url,
      });

      if (imageResult.isSuccess && imageResult.data) {
        // Add the new image to the images array
        setImages(prevImages => {
          if (imageResult.data) {
            return [...prevImages, imageResult.data];
          }
          return prevImages;
        });
        
        // Set the current image index to show the new image
        setCurrentImageIndex(images.length);
        
        toast({
          title: "Image uploaded",
          description: "Your new image has been added to the item.",
        });
        return true;
      } else {
        throw new Error('Failed to create image entry');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [itemId, images.length, toast]);
  
  // Delete image
  const deleteImage = useCallback(async (imageId: string): Promise<boolean> => {
    if (!itemId) return false;
    
    try {
      const result = await deleteImageAction(imageId, itemId);
      if (result.isSuccess) {
        setImages(prevImages => prevImages.filter(img => img.id !== imageId));
        setCurrentImageIndex(prevIndex => Math.min(prevIndex, images.length - 2));
        toast({
          title: "Image deleted",
          description: "The image has been removed from the item.",
        });
        return true;
      } else {
        throw new Error(result.error || "Failed to delete image");
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [itemId, images.length, toast]);
  
  // Reorder images
  const reorderImages = useCallback(async (event: any): Promise<boolean> => {
    if (!itemId) return false;
    
    const { active, over } = event;
    
    if (active && over && active.id !== over.id) {
      try {
        setImages((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);
          
          const newItems = arrayMove(items, oldIndex, newIndex);
          
          // Update the server with the new order
          const updatedOrders = newItems.map((item, index) => ({
            id: item.id,
            order: index
          }));
          
          // Update the server with the new order
          reorderImagesAction(itemId, updatedOrders)
            .then(() => {
              // Refetch the images to ensure we have the latest order from the server
              fetchImages();
              
              toast({
                title: "Success",
                description: "Image order updated successfully",
                variant: "default",
              });
            })
            .catch(error => {
              console.error('Failed to update image order:', error);
              toast({
                title: "Error",
                description: "Failed to update image order",
                variant: "destructive",
              });
            });
          
          return newItems;
        });
        return true;
      } catch (error) {
        console.error('Error reordering images:', error);
        toast({
          title: "Error",
          description: "Failed to reorder images. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    }
    return false;
  }, [itemId, fetchImages, toast]);
  
  // Helper functions for navigation
  const navigateNext = useCallback(() => {
    if (images.length > 1) {
      setCurrentImageIndex(prevIndex => (prevIndex < images.length - 1 ? prevIndex + 1 : 0));
    }
  }, [images.length]);
  
  const navigatePrevious = useCallback(() => {
    if (images.length > 1) {
      setCurrentImageIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : images.length - 1));
    }
  }, [images.length]);
  
  // Derived state for navigation
  const hasPrevious = images.length > 1 && currentImageIndex > 0;
  const hasNext = images.length > 1 && currentImageIndex < images.length - 1;

  // Fetch images on mount and when itemId changes
  useEffect(() => {
    if (itemId) {
      fetchImages();
    }
  }, [itemId, fetchImages]);

  return {
    images,
    currentImageIndex,
    isLoading,
    setCurrentImageIndex,
    uploadImage,
    deleteImage,
    reorderImages,
    fetchImages,
    navigateNext,
    navigatePrevious,
    hasPrevious,
    hasNext
  };
} 