'use client';

import React from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import { SelectImage } from '@/db/schema/images-schema';

interface DndWrapperProps {
  items: SelectImage[];
  onReorder: (event: any) => void;
  renderItem: (props: { image: SelectImage; index: number }) => React.ReactNode;
  direction?: 'vertical' | 'horizontal';
  className?: string;
}

export default function DndWrapper({ 
  items, 
  onReorder, 
  renderItem, 
  direction = 'vertical',
  className = ''
}: DndWrapperProps) {
  // Set up sensors with better balanced activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Find a better balance for the activation constraints
      activationConstraint: {
        distance: 3, // Reduced from 8 to 3 to make dragging easier
        delay: 100, // Add small delay to help differentiate between click and drag
        tolerance: 3, // Reduced tolerance
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Choose sorting strategy based on direction
  const strategy = direction === 'vertical' 
    ? verticalListSortingStrategy 
    : horizontalListSortingStrategy;

  // Set container class based on direction
  const containerClass = direction === 'vertical'
    ? "grid grid-cols-1 gap-2 mt-2"
    : "flex flex-row flex-wrap gap-2 mt-2 overflow-x-auto";

  // Handle drag start event
  const handleDragStart = (event: DragStartEvent) => {
    // You can add logging or additional logic here if needed
    console.log('Drag started');
  };

  // Handle drag end event with the provided onReorder function
  const handleDragEnd = (event: DragEndEvent) => {
    console.log('Drag ended');
    onReorder(event);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(img => img.id)} strategy={strategy}>
        <div className={`${containerClass} ${className}`}>
          {items.map((image, index) => renderItem({ image, index }))}
        </div>
      </SortableContext>
    </DndContext>
  );
} 