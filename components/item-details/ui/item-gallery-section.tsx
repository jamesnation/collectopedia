"use client";

/**
 * components/item-details/ui/item-gallery-section.tsx
 * 
 * This component handles the image gallery section on the left side of the item details page.
 * It displays the image carousel or a placeholder for adding images, and the debug panel
 * when debug mode is enabled.
 */

import { useItemDetails } from "../context";
import { ImageCarousel } from "../image-gallery";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImagePlus } from "lucide-react";
import { PlaceholderImage } from '@/components/ui/placeholder-image';
import { useEbayDebugMode } from "@/hooks/use-ebay-debug-mode";
import { ItemDebugPanel } from "./item-debug-panel";

export function ItemGallerySection() {
  const {
    item,
    images,
    imageLoading,
    handleAddImages,
    handleDeleteImage,
    handleImageReorder,
    debugData
  } = useItemDetails();
  
  const { isDebugMode, isInitialized } = useEbayDebugMode();

  if (!item) return null;

  // Map DB images to the format expected by ImageCarousel with better error handling
  const carouselImages = images && images.length > 0 
    ? images.map(img => {
        // Ensure the image URL is valid and formatted correctly
        let imageUrl = img.url;
        
        // Check if URL is valid or needs to be adjusted
        if (imageUrl) {
          // If URL doesn't start with http/https and doesn't look like a data URL, assume it's a relative path
          if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
            // If it doesn't start with a slash, add one
            if (!imageUrl.startsWith('/')) {
              imageUrl = `/${imageUrl}`;
            }
          }
        } else {
          console.warn(`Invalid URL for image ${img.id}`);
          imageUrl = '/placeholder-image.jpg'; // Fallback to placeholder
        }
        
        return {
          id: img.id || `temp-${Math.random().toString(36).substr(2, 9)}`,
          url: imageUrl,
          alt: img.alt || `${item.name} image`
        };
      })
    : [];

  return (
    <div className="space-y-2 sm:space-y-4 w-full overflow-hidden">
      {imageLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <>
          {carouselImages.length > 0 ? (
            <ImageCarousel 
              images={carouselImages} 
              itemId={item.id} 
              onAddImages={handleAddImages}
              onDeleteImage={handleDeleteImage}
              onReorderImages={handleImageReorder}
            />
          ) : (
            <Card className="h-96 w-full flex flex-col items-center justify-center rounded-xl">
              <div className="text-center p-6">
                <div className="mb-4 flex justify-center">
                  <PlaceholderImage className="w-32 h-32" />
                </div>
                <p className="text-muted-foreground mb-4">No images available for this item</p>
                <Button onClick={handleAddImages}>
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Add Images
                </Button>
              </div>
            </Card>
          )}
          
          {/* Debug Panel - shown when debug mode is enabled */}
          {isDebugMode && isInitialized && (
            <ItemDebugPanel debugData={debugData} />
          )}
        </>
      )}
    </div>
  );
} 