"use client";

/**
 * components/item-details/image-gallery/image-thumbnails.tsx
 * 
 * This component displays thumbnails for image navigation.
 */

import Image from "next/image";
import { SelectImage } from "@/db/schema/images-schema";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ImageThumbnailsProps {
  images: SelectImage[];
  currentIndex: number;
  onSelect: (index: number) => void;
  itemName?: string;
}

export function ImageThumbnails({
  images,
  currentIndex,
  onSelect,
  itemName = "Item"
}: ImageThumbnailsProps) {
  if (images.length <= 1) {
    return null;
  }

  return (
    <ScrollArea className="w-full overflow-x-auto overflow-y-hidden rounded-md border">
      <div className="flex w-max space-x-1 sm:space-x-2 p-1 sm:p-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-md overflow-hidden flex-shrink-0 ${
              index === currentIndex ? 'ring-2 ring-primary' : ''
            }`}
          >
            <Image
              src={image.url}
              alt={`${itemName} - Thumbnail ${index + 1}`}
              fill
              className="object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
} 