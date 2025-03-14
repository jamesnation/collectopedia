"use client";

/**
 * components/item-details/image-gallery/image-carousel.tsx
 * 
 * This component displays a carousel of item images with thumbnail navigation.
 * Added support for deleting images.
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ImagePlus, Trash2, AlertCircle } from "lucide-react";
import { PlaceholderImage } from "@/components/ui/placeholder-image";

interface ImageType {
  id: string;
  url: string;
  alt?: string;
}

interface ImageCarouselProps {
  images: ImageType[];
  itemId: string;
  onAddImages?: () => void;
  onDeleteImage?: (imageId: string) => void;
}

export function ImageCarousel({ 
  images, 
  itemId, 
  onAddImages,
  onDeleteImage 
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
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
  if (currentIndex >= images.length && images.length > 0) {
    setCurrentIndex(images.length - 1);
  }
  
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;
  
  const handlePrevious = () => {
    if (hasPrevious) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const handleNext = () => {
    if (hasNext) {
      setCurrentIndex(currentIndex + 1);
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
    }
  };
  
  // Render a notification if all images have errors
  const allImagesHaveErrors = images.length > 0 && 
    images.every(img => imageErrors[img.id]);
  
  if (images.length === 0) {
    return (
      <Card className="relative aspect-square w-full flex items-center justify-center">
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
      </Card>
    );
  }

  // Handle cases where all images fail to load but array is not empty
  if (allImagesHaveErrors) {
    return (
      <Card className="relative aspect-square w-full flex items-center justify-center bg-muted/20">
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="mb-2 font-medium text-destructive">Failed to load images</p>
          <p className="text-sm text-muted-foreground mb-4">There was a problem loading the images for this item.</p>
          {onAddImages && (
            <Button onClick={onAddImages} className="mt-2">Try Adding New Images</Button>
          )}
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Main image */}
      <Card className="overflow-hidden rounded-lg shadow-md border dark:border-border relative aspect-video">
        <div className="w-full h-full relative flex items-center justify-center">
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
          className={`absolute left-2 top-1/2 transform -translate-y-1/2 opacity-80 hover:opacity-100 ${
            !hasPrevious && 'opacity-40 pointer-events-none'
          }`}
          onClick={handlePrevious}
          disabled={!hasPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="secondary"
          size="icon"
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 opacity-80 hover:opacity-100 ${
            !hasNext && 'opacity-40 pointer-events-none'
          }`}
          onClick={handleNext}
          disabled={!hasNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        {/* Delete button */}
        {onDeleteImage && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-80 hover:opacity-100"
            onClick={() => handleDeleteImage(images[currentIndex].id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        
        {/* Image counter */}
        <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
          {currentIndex + 1} / {images.length}
        </div>
      </Card>
      
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
              }`}
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
                  <div className="flex flex-col items-center justify-center h-full">
                    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                    <p className="text-sm text-muted-foreground">Failed to load image</p>
                  </div>
                )}
              </div>
            </Button>
          ))}
          
          {/* Add more images button */}
          <Button
            variant="outline"
            className="h-16 w-16 rounded-md border border-dashed border-muted-foreground/30 flex flex-col items-center justify-center"
            onClick={handleAddImages}
          >
            <ImagePlus className="h-5 w-5 mb-1" />
            <span className="text-xs">Add</span>
          </Button>
        </div>
      )}
    </div>
  );
} 