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
    position: 'relative' as const,
    zIndex: isDragging ? 50 : 'auto',
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

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`relative bg-card border rounded-md overflow-hidden ${dimensions.container} ${isDragging ? 'ring-2 ring-primary shadow-lg' : ''}`}
    >
      {/* Image container with padding to make room for controls */}
      <div className="w-full h-full pt-6 relative">
        {/* Drag handle at the top */}
        <div 
          className="absolute top-0 left-0 right-0 h-6 flex items-center justify-center bg-muted/30 cursor-grab active:cursor-grabbing z-10 hover:bg-muted/50"
          {...attributes} 
          {...listeners}
        >
          {direction === 'vertical' 
            ? <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            : <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          }
        </div>
        
        {/* The image itself */}
        <div className="pointer-events-none h-full w-full">
          <Image 
            src={image.url} 
            alt={`Image ${index + 1}`} 
            width={dimensions.width} 
            height={dimensions.height}
            className="h-full w-full aspect-square object-cover" 
          />
        </div>
        
        {/* Controls overlay */}
        <div className="absolute top-0 right-0 p-1 z-20">
          {/* Delete button */}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="h-5 w-5 pointer-events-auto shadow-sm"
            onClick={handleDelete}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        {/* Primary badge */}
        {index === 0 && (
          <Badge 
            className="absolute bottom-1 left-1 z-20 text-xs" 
            variant="secondary"
          >
            Primary
          </Badge>
        )}
      </div>
    </div>
  );
} 