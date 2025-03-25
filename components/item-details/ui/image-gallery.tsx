/**
 * Image Gallery Component
 * 
 * Displays the primary image of an item with thumbnail navigation
 * and provides controls for image management.
 */

import React from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, Edit, Info } from "lucide-react"
import { SelectImage } from '@/db/schema/images-schema'
import { PlaceholderImage, PLACEHOLDER_IMAGE_PATH } from '@/components/ui/placeholder-image'
import DynamicImageUpload from "@/components/image-upload"
import dynamic from 'next/dynamic'

// Dynamic imports for DnD components
const DndWrapper = dynamic(() => import('../../dnd-wrapper'), { 
  ssr: false,
  loading: () => <div className="p-4 text-center">Loading drag and drop functionality...</div>
})

const SortableImageItem = dynamic(() => import('../../sortable-image-item'), { 
  ssr: false 
})

interface ImageGalleryProps {
  images: SelectImage[]
  currentImageIndex: number
  itemName: string
  userId: string | undefined
  itemId: string | undefined
  onUpload: (url: string) => Promise<void>
  onDelete: (imageId: string) => Promise<void>
  onPrevious: () => void
  onNext: () => void
  onSelect: (index: number) => void
  onReorder: (event: any) => void
}

export default function ImageGallery({
  images,
  currentImageIndex,
  itemName,
  userId,
  itemId,
  onUpload,
  onDelete,
  onPrevious,
  onNext,
  onSelect,
  onReorder
}: ImageGalleryProps) {
  const placeholderImage = PLACEHOLDER_IMAGE_PATH
  
  return (
    <div className="space-y-2 sm:space-y-4 w-full overflow-hidden">
      {/* Main image display */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src={images[currentImageIndex]?.url || placeholderImage}
            alt={`${itemName} - Image ${currentImageIndex + 1}`}
            fill
            className="object-contain rounded-lg"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={true}
          />
        </div>
        
        {/* Navigation arrows - only show when there are multiple images */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 sm:left-1 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 p-0 sm:p-1"
              onClick={onPrevious}
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 sm:right-1 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 p-0 sm:p-1"
              onClick={onNext}
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6" />
            </Button>
          </>
        )}
        
        {/* Edit images button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-background/80 hover:bg-background/90 text-xs sm:text-sm p-1 sm:p-2 h-auto"
            >
              <Edit className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              Edit Images
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full max-w-[90vw] sm:max-w-[600px] dark:bg-black/90 dark:border-border">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-foreground">Edit Item Images</h4>
              
              {/* Image upload section */}
              <div className="p-3 bg-muted/50 rounded-md">
                <DynamicImageUpload onUpload={onUpload} bucketName="item-images" />
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
                      onReorder={onReorder}
                      direction="horizontal"
                      className="pb-4 pt-1"
                      renderItem={({ image, index }: { image: SelectImage; index: number }) => (
                        <SortableImageItem
                          key={image.id}
                          image={image}
                          index={index}
                          direction="horizontal"
                          size="md"
                          onImageDelete={onDelete}
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
      </div>
      
      {/* Thumbnail navigation */}
      {images.length > 1 && (
        <ScrollArea className="w-full overflow-x-auto overflow-y-hidden rounded-md border">
          <div className="flex w-max space-x-1 sm:space-x-2 p-1 sm:p-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => onSelect(index)}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-md overflow-hidden flex-shrink-0 ${
                  index === currentImageIndex ? 'ring-2 ring-primary' : ''
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
      )}
    </div>
  )
} 