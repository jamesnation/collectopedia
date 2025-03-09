'use client';

import React from 'react';
import Image from 'next/image';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, GripHorizontal, X } from "lucide-react";
import { SelectImage } from "@/db/schema/images-schema";

interface SortableImageItemProps {
  image: SelectImage;
  index: number;
  onImageDelete: (id: string) => void;
  direction?: 'vertical' | 'horizontal';
  size?: 'sm' | 'md' | 'lg';
}

export default function SortableImageItem({ 
  image, 
  index, 
  onImageDelete, 
  direction = 'vertical',
  size = 'md'
}: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  // Handle image deletion
  const handleDelete = (e: React.MouseEvent) => {
    // Stop propagation to prevent drag event
    e.stopPropagation();
    e.preventDefault();
    // Call the delete function with image id
    onImageDelete(image.id);
  };

  // Size mappings
  const sizeMap = {
    sm: {
      width: 80,
      height: 80,
      container: "w-20 h-20",
    },
    md: {
      width: 100,
      height: 100,
      container: "w-24 h-24",
    },
    lg: {
      width: 120, 
      height: 120,
      container: "w-32 h-32",
    }
  };

  const dimensions = sizeMap[size];

  // Handle position differs based on direction
  const handlePosition = direction === 'vertical' 
    ? "absolute top-0 left-0 h-full flex items-center justify-center p-1"
    : "absolute top-0 left-0 w-full flex justify-center items-start p-1";

  // Container padding differs based on direction  
  const containerPadding = direction === 'vertical'
    ? "pl-7" // Padding left for vertical
    : "pt-7"; // Padding top for horizontal

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`relative bg-card border rounded-md ${dimensions.container} ${isDragging ? 'ring-2 ring-primary' : ''}`}
    >
      {/* Drag handle with clearer visual feedback */}
      <div 
        className={`${handlePosition} cursor-grab active:cursor-grabbing z-10 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm`}
        {...attributes} 
        {...listeners}
      >
        {direction === 'vertical' 
          ? <GripVertical className="h-4 w-4 text-muted-foreground" />
          : <GripHorizontal className="h-4 w-4 text-muted-foreground" />
        }
      </div>
      
      <div className={containerPadding}>
        {/* The image itself is not draggable directly */}
        <div className="pointer-events-none">
          <Image 
            src={image.url} 
            alt={`Image ${index + 1}`} 
            width={dimensions.width} 
            height={dimensions.height}
            className="h-auto aspect-square object-cover rounded-md" 
          />
        </div>
        
        {/* Delete button with pointer-events-auto to ensure clicks work */}
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-1 right-1 h-5 w-5 z-20 pointer-events-auto"
          onClick={handleDelete}
        >
          <X className="h-3 w-3" />
        </Button>
        
        {index === 0 && (
          <Badge 
            className={`absolute text-xs ${direction === 'vertical' ? 'bottom-1 left-7' : 'bottom-1 left-1'} z-20`} 
            variant="secondary"
          >
            Primary
          </Badge>
        )}
      </div>
    </div>
  );
} 