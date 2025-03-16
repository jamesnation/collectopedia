"use client";

/**
 * components/item-details/image-gallery/image-gallery-section.tsx
 * 
 * This component combines the image carousel and thumbnails into a complete
 * image gallery section.
 */

import { useState } from "react";
import { SelectImage } from "@/db/schema/images-schema";
import { ImageCarousel } from "./image-carousel";
import { ImageThumbnails } from "./image-thumbnails";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import dynamic from "next/dynamic";
import { PLACEHOLDER_IMAGE_PATH } from '@/components/ui/placeholder-image';
import DynamicImageUpload from "@/components/image-upload";

// Create dynamic imports for our DnD components
const DndWrapper = dynamic(() => import('../../dnd-wrapper'), { 
  ssr: false,
  loading: () => <div className="p-4 text-center">Loading drag and drop functionality...</div>
});

const SortableImageItem = dynamic(() => import('../../sortable-image-item'), { 
  ssr: false 
});

interface ImageGallerySectionProps {
  images: SelectImage[];
  currentIndex: number;
  onChangeIndex: (index: number) => void;
  onUploadImage: (url: string) => Promise<boolean>;
  onDeleteImage: (imageId: string) => Promise<boolean>;
  onReorderImages: (event: any) => Promise<boolean>;
  itemName?: string;
  userId?: string;
  placeholderImage?: string;
}

export function ImageGallerySection({
  images,
  currentIndex,
  onChangeIndex,
  onUploadImage,
  onDeleteImage,
  onReorderImages,
  itemName = "Item",
  userId = "",
  placeholderImage = PLACEHOLDER_IMAGE_PATH
}: ImageGallerySectionProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  const handleEditClick = () => {
    setIsPopoverOpen(true);
  };
  
  const handleImageUpload = async (url: string) => {
    await onUploadImage(url);
  };
  
  // Wrap the onReorderImages function to ensure the popover stays open
  const handleReorderImages = async (event: any) => {
    // Prevent event propagation to stop popover from closing
    if (event.originalEvent) {
      event.originalEvent.stopPropagation();
    }
    
    try {
      // Call the original reorder function
      await onReorderImages(event);
      
      // Make sure the popover stays open by forcing it after a short delay
      // This prevents the popover from closing after the reordering operation
      const wasOpen = isPopoverOpen;
      if (wasOpen) {
        // In case the popover closed during the operation
        setTimeout(() => {
          setIsPopoverOpen(true);
        }, 10);
      }
    } catch (error) {
      console.error("Error in reordering images:", error);
      // Even if there's an error, try to keep the popover open
      setTimeout(() => {
        setIsPopoverOpen(true);
      }, 10);
    }
  };

  return (
    <div className="space-y-2 sm:space-y-4 w-full overflow-hidden">
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <div className="hidden">Edit Images</div>
        </PopoverTrigger>
        
        <ImageCarousel
          images={images.map(img => ({
            id: img.id,
            url: img.url,
            alt: `${itemName} image ${images.indexOf(img) + 1}`
          }))}
          itemId={images.length > 0 ? images[0].itemId : "new-item"}
          onAddImages={() => handleEditClick()}
        />
        
        <PopoverContent className="w-full max-w-[90vw] sm:max-w-[600px] dark:bg-black/90 dark:border-border">
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-foreground">Edit Item Images</h4>
            
            {/* Image upload section with improved layout */}
            <div className="p-3 bg-muted/50 rounded-md">
              <DynamicImageUpload onUpload={handleImageUpload} bucketName="item-images" />
            </div>
            
            {images.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-100 dark:border-blue-900/50">
                  <Info className="h-3.5 w-3.5 mr-2 flex-shrink-0 text-blue-500" />
                  <span>Drag images to reorder. The first image will be used as the primary image.</span>
                </div>
                
                <ScrollArea className="w-full h-auto max-h-[40vh]">
                  <DndWrapper
                    items={images}
                    onReorder={handleReorderImages}
                    direction="horizontal"
                    className="pb-4 pt-1" // Add padding to provide more space
                    renderItem={({ image, index }: { image: SelectImage; index: number }) => (
                      <SortableImageItem
                        key={image.id}
                        image={image}
                        index={index}
                        direction="horizontal"
                        size="md"
                        onImageDelete={onDeleteImage}
                      />
                    )}
                  />
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}
            
            {images.length === 0 && (
              <div className="text-center p-8 border border-dashed rounded-md bg-muted/30">
                <p className="text-muted-foreground">No images uploaded yet. Upload images to showcase your item.</p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      
      <ImageThumbnails
        images={images}
        currentIndex={currentIndex}
        onSelect={onChangeIndex}
        itemName={itemName}
      />
    </div>
  );
} 