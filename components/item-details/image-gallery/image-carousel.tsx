"use client";

/**
 * components/item-details/image-gallery/image-carousel.tsx
 * 
 * This component displays a carousel of item images with thumbnail navigation.
 * Enhanced with drag-and-drop reordering capabilities and improved UI for larger images.
 * Added support for deleting images and designating primary images.
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ImagePlus, Trash2, AlertCircle, Info, GripHorizontal } from "lucide-react";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { SelectImage } from "@/db/schema/images-schema";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import dynamic from "next/dynamic";

// Dynamically import the DnD components to prevent SSR issues
const DndWrapper = dynamic(() => import('@/components/dnd-wrapper'), { 
  ssr: false,
  loading: () => <div className="p-4 text-center">Loading drag and drop functionality...</div>
});

const SortableImageItem = dynamic(() => import('@/components/sortable-image-item'), { 
  ssr: false 
});

interface ImageType {
  id: string;
  url: string;
  alt?: string;
  itemId?: string;
  userId?: string;
  order?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface ImageCarouselProps {
  images: ImageType[];
  itemId: string;
  onAddImages?: () => void;
  onDeleteImage?: (imageId: string) => void;
  onReorderImages?: (event: any) => void;
}

export function ImageCarousel({ 
  images, 
  itemId, 
  onAddImages,
  onDeleteImage,
  onReorderImages
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Track images that fail to load
  const handleImageError = (id: string) => {
    console.error(`Error loading image with id ${id}`);
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };
  
  useEffect(() => {
    // Reset image errors when images change
    setImageErrors({});
    console.log(`ImageCarousel received ${images.length} images`);
  }, [images]);
  
  // Reset currentIndex if it's out of bounds after images change
  useEffect(() => {
    if (currentIndex >= images.length && images.length > 0) {
      setCurrentIndex(images.length - 1);
    }
  }, [currentIndex, images.length]);
  
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;
  
  const handlePrevious = () => {
    // Implement circular navigation - when at first image, go to last image
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      // Go to the last image
      setCurrentIndex(images.length - 1);
    }
  };
  
  const handleNext = () => {
    // Implement circular navigation - when at last image, go to first image
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Go back to the first image
      setCurrentIndex(0);
    }
  };
  
  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };
  
  const handleAddImages = () => {
    if (onAddImages) {
      onAddImages();
    }
  };
  
  const handleDeleteImage = (id: string) => {
    if (onDeleteImage) {
      onDeleteImage(id);
      
      // If we deleted the current image, adjust currentIndex
      if (images.findIndex(img => img.id === id) === currentIndex) {
        // Move to previous image if available, otherwise first image
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        } else if (images.length > 1) {
          setCurrentIndex(0);
        }
      }
    }
  };
  
  const handleReorderImages = (event: any) => {
    if (onReorderImages) {
      onReorderImages(event);
    }
  };
  
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };
  
  // Render a notification if all images have errors
  const allImagesHaveErrors = images.length > 0 && 
    images.every(img => imageErrors[img.id]);
  
  if (images.length === 0) {
    return (
      <div className="relative w-full h-[650px] flex items-center justify-center bg-muted/10 rounded-lg">
        <div className="text-center">
          <PlaceholderImage className="w-32 h-32 mx-auto" />
          <p className="mt-4 text-muted-foreground">No images available</p>
          {onAddImages && (
            <Button onClick={onAddImages} className="mt-4">
              <ImagePlus className="h-4 w-4 mr-2" />
              Add Images
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Handle cases where all images fail to load but array is not empty
  if (allImagesHaveErrors) {
    return (
      <div className="relative w-full h-[650px] flex items-center justify-center bg-muted/10 rounded-lg">
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="mb-2 font-medium text-destructive">Failed to load images</p>
          <p className="text-sm text-muted-foreground mb-4">There was a problem loading the images for this item.</p>
          {onAddImages && (
            <Button onClick={onAddImages} className="mt-2">Try Adding New Images</Button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Main image - Made larger with floating design and no card background */}
      <div className="relative w-full h-[650px] rounded-lg overflow-hidden">
        <div className="w-full h-full relative flex items-center justify-center bg-transparent">
          {!imageErrors[images[currentIndex]?.id] ? (
            <Image
              src={images[currentIndex]?.url}
              alt={images[currentIndex]?.alt || `Image ${currentIndex + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain"
              onError={() => handleImageError(images[currentIndex]?.id)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-sm text-muted-foreground">Failed to load image</p>
            </div>
          )}
        </div>
        
        {/* Navigation buttons */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-80 hover:opacity-100"
          onClick={handlePrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-80 hover:opacity-100"
          onClick={handleNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex items-center space-x-2 overflow-x-auto py-2 px-1">
          {images.map((image, index) => (
            <Button
              key={image.id}
              variant="ghost"
              className={`p-0 h-16 w-16 rounded overflow-hidden border-2 ${
                index === currentIndex
                  ? 'border-primary'
                  : 'border-transparent hover:border-muted-foreground/30'
              } relative`}
              onClick={() => handleThumbnailClick(index)}
            >
              <div className="relative h-full w-full">
                {!imageErrors[image.id] ? (
                  <Image
                    src={image.url}
                    alt={image.alt || `Thumbnail ${index + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                    onError={() => handleImageError(image.id)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                )}
              </div>
            </Button>
          ))}
          
          {/* Replace "Add" button with "Edit" button and add Popover functionality */}
          <Popover open={isEditMode} onOpenChange={setIsEditMode}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-16 w-16 rounded-md border border-dashed border-muted-foreground/30 flex flex-col items-center justify-center"
                onClick={toggleEditMode}
              >
                <ImagePlus className="h-5 w-5 mb-1" />
                <span className="text-xs">Edit</span>
              </Button>
            </PopoverTrigger>
            
            <PopoverContent className="w-full max-w-[90vw] sm:max-w-[600px] dark:bg-black/90 dark:border-border">
              <div className="space-y-4">
                <h4 className="font-semibold text-md text-foreground">Edit Gallery</h4>
                <Button 
                  onClick={handleAddImages}
                  className="w-full"
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Add New Images
                </Button>
                
                {images.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-100 dark:border-blue-900/50">
                      <Info className="h-3.5 w-3.5 mr-2 flex-shrink-0 text-blue-500" />
                      <span>Drag images to reorder. The first image will be used as the primary image.</span>
                    </div>
                    
                    <ScrollArea className="w-full h-auto max-h-[40vh]">
                      {onReorderImages ? (
                        <DndWrapper
                          items={images as unknown as SelectImage[]}
                          onReorder={handleReorderImages}
                          direction="horizontal"
                          className="pb-4 pt-1" // Add padding to provide more space
                          renderItem={({ image, index }: { image: SelectImage | ImageType; index: number }) => (
                            <SortableImageItem
                              key={image.id}
                              image={image as SelectImage}
                              index={index}
                              direction="horizontal"
                              size="md"
                              onImageDelete={handleDeleteImage}
                            />
                          )}
                        />
                      ) : (
                        <div className="grid grid-cols-3 gap-2 pb-4">
                          {images.map((image, index) => (
                            <div key={image.id} className="relative w-24 h-24 border rounded overflow-hidden">
                              <Image
                                src={image.url}
                                alt={image.alt || `Image ${index + 1}`}
                                width={100}
                                height={100}
                                className="object-cover w-full h-full"
                                onError={() => handleImageError(image.id)}
                              />
                              {index === 0 && (
                                <Badge variant="secondary" className="absolute bottom-1 left-1 text-xs">
                                  Primary
                                </Badge>
                              )}
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-5 w-5 absolute top-1 right-1"
                                onClick={() => handleDeleteImage(image.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
      
      {/* For case with a single image or no images, also need the Edit button */}
      {images.length <= 1 && (
        <div className="flex justify-start mt-2">
          <Popover open={isEditMode} onOpenChange={setIsEditMode}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={toggleEditMode}
              >
                <ImagePlus className="h-4 w-4" />
                <span>Edit Gallery</span>
              </Button>
            </PopoverTrigger>
            
            <PopoverContent className="w-full max-w-[90vw] sm:max-w-[600px] dark:bg-black/90 dark:border-border">
              <div className="space-y-4">
                <h4 className="font-semibold text-md text-foreground">Edit Gallery</h4>
                <Button 
                  onClick={handleAddImages}
                  className="w-full"
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Add New Images
                </Button>
                
                {images.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-100 dark:border-blue-900/50">
                      <Info className="h-3.5 w-3.5 mr-2 flex-shrink-0 text-blue-500" />
                      <span>Drag images to reorder. The first image will be used as the primary image.</span>
                    </div>
                    
                    <ScrollArea className="w-full h-auto max-h-[40vh]">
                      {onReorderImages ? (
                        <DndWrapper
                          items={images as unknown as SelectImage[]}
                          onReorder={handleReorderImages}
                          direction="horizontal"
                          className="pb-4 pt-1" // Add padding to provide more space
                          renderItem={({ image, index }: { image: SelectImage | ImageType; index: number }) => (
                            <SortableImageItem
                              key={image.id}
                              image={image as SelectImage}
                              index={index}
                              direction="horizontal"
                              size="md"
                              onImageDelete={handleDeleteImage}
                            />
                          )}
                        />
                      ) : (
                        <div className="grid grid-cols-3 gap-2 pb-4">
                          {images.map((image, index) => (
                            <div key={image.id} className="relative w-24 h-24 border rounded overflow-hidden">
                              <Image
                                src={image.url}
                                alt={image.alt || `Image ${index + 1}`}
                                width={100}
                                height={100}
                                className="object-cover w-full h-full"
                                onError={() => handleImageError(image.id)}
                              />
                              {index === 0 && (
                                <Badge variant="secondary" className="absolute bottom-1 left-1 text-xs">
                                  Primary
                                </Badge>
                              )}
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-5 w-5 absolute top-1 right-1"
                                onClick={() => handleDeleteImage(image.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
} 