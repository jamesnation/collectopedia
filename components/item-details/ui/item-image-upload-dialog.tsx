"use client";

/**
 * components/item-details/ui/item-image-upload-dialog.tsx
 * 
 * This component provides a dialog for uploading images to an item.
 * It uses a dynamically loaded ImageUpload component to prevent SSR issues.
 * Enhanced with smooth animations using Framer Motion.
 */

import { useItemDetails } from "../context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

// Dynamically import the ImageUpload component to prevent SSR issues
const DynamicImageUpload = dynamic(() => import("@/components/image-upload"), {
  ssr: false,
  loading: () => (
    <motion.div 
      className="flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        animate={{ 
          rotate: 360,
          transition: { 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "linear" 
          }
        }}
      >
        <Loader2 className="h-6 w-6 text-primary" />
      </motion.div>
    </motion.div>
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
        <AnimatePresence mode="wait">
          <motion.div 
            className="py-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <DynamicImageUpload 
              onUpload={handleImageUpload} 
              bucketName="item-images" 
            />
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
} 