'use client';

import React from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
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
  // Set up sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onReorder}
    >
      <SortableContext items={items.map(img => img.id)} strategy={strategy}>
        <div className={`${containerClass} ${className}`}>
          {items.map((image, index) => renderItem({ image, index }))}
        </div>
      </SortableContext>
    </DndContext>
  );
} 