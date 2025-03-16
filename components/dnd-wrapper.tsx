'use client';

/**
 * components/dnd-wrapper.tsx
 * 
 * This component provides a drag-and-drop wrapper for sortable items.
 * It uses @dnd-kit libraries to provide a smooth drag and drop experience.
 */

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
import { arrayMove } from '@dnd-kit/sortable';

interface DndWrapperProps {
  items: any[];
  onReorder: (event: any) => void;
  renderItem: (props: { image: any; index: number }) => React.ReactNode;
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
      // Adjust activation constraints for better drag detection
      activationConstraint: {
        distance: 2, // Very short distance needed to activate drag
        delay: 50, // Very short delay for more responsive drag
        tolerance: 2, // Low tolerance to make activation easier
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
    // Capture current active element to maintain focus during drag
    const activeElement = document.activeElement;
    
    // Prevent any pending popover closures
    event.active.data.current = {
      ...event.active.data.current,
      preventPopoverClose: true
    };
    
    // Use setTimeout to ensure this runs after the drag start event
    setTimeout(() => {
      if (activeElement instanceof HTMLElement) {
        activeElement.focus();
      }
    }, 0);
    
    console.log('Drag started with item:', event.active.id);
  };

  // Handle drag end event with the provided onReorder function
  const handleDragEnd = (event: DragEndEvent) => {
    console.log('Drag ended with item:', event.active.id, 'over:', event.over?.id);
    
    // Only trigger the reordering if there's an actual change
    if (event.over && event.active.id !== event.over.id) {
      // Prevent any popover from closing right after drag
      // by using a wrapper function for our onReorder
      const safeReorder = () => {
        try {
          onReorder(event);
        } catch (error) {
          console.error('Error in reordering:', error);
        }
      };
      
      // Delay slightly to allow UI to settle
      setTimeout(safeReorder, 5);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(item => item.id)} strategy={strategy}>
        <div className={`${containerClass} ${className}`}>
          {items.map((image, index) => renderItem({ image, index }))}
        </div>
      </SortableContext>
    </DndContext>
  );
} 