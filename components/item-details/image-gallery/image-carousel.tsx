"use client";

/**
 * components/item-details/image-gallery/image-carousel.tsx
 * 
 * This component displays a carousel of item images with thumbnail navigation.
 * Added support for deleting images.
 */

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ImagePlus, Trash2 } from "lucide-react";

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
  
  // If there are no images, show a placeholder
  if (images.length === 0) {
    return (
      <Card className="overflow-hidden rounded-lg shadow-md border dark:border-border relative min-h-[300px] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <ImagePlus className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No Images Available</h3>
          <p className="text-sm text-muted-foreground mb-4">Add images to showcase this item</p>
          <Button onClick={handleAddImages} className="gap-2">
            <ImagePlus className="h-4 w-4" />
            Upload Images
          </Button>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Main image */}
      <Card className="overflow-hidden rounded-lg shadow-md border dark:border-border relative aspect-video">
        <div className="w-full h-full relative flex items-center justify-center">
          <Image
            src={images[currentIndex].url}
            alt={images[currentIndex].alt || `Image ${currentIndex + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain"
          />
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
                <Image
                  src={image.url}
                  alt={image.alt || `Thumbnail ${index + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
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