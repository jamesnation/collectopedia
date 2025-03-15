"use client";

/**
 * components/item-details/ui/item-image-upload-dialog.tsx
 * 
 * This component provides a dialog for uploading images to an item.
 * It uses a dynamically loaded ImageUpload component to prevent SSR issues.
 */

import { useItemDetails } from "../context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the ImageUpload component to prevent SSR issues
const DynamicImageUpload = dynamic(() => import("@/components/image-upload"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  ),
});

export function ItemImageUploadDialog() {
  const { isImageUploadOpen, setIsImageUploadOpen, handleImageUpload } = useItemDetails();

  return (
    <Dialog open={isImageUploadOpen} onOpenChange={setIsImageUploadOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Images</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <DynamicImageUpload 
            onUpload={handleImageUpload} 
            bucketName="item-images" 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 