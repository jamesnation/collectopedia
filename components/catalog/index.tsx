/*
 * Updated: Refactored to improve code organization, maintainability, and reusability.
 * This file now serves as the main entry point that composes the Catalog page from
 * smaller, more focused components.
 */

"use client"

import React from 'react'
import { SelectItem as SelectItemType } from "@/db/schema/items-schema"
import { ImageCacheProvider } from './context/image-cache-context';
import { useCatalogItems } from './hooks/use-catalog-items';
import { useCustomEntities } from './hooks/use-custom-entities';
import { CatalogContent } from './ui/catalog-content';

interface CatalogProps {
  initialItems: SelectItemType[];
  initialTypes: { id: string; name: string }[];
  initialFranchises: { id: string; name: string }[];
  initialBrands: { id: string; name: string }[];
}

export default function Catalog({
  initialItems = [],
  initialTypes = [],
  initialFranchises = [],
  initialBrands = [],
}: CatalogProps) {
  // Initialize hooks with initial data
  const { 
    items, 
    isLoading,
    loadingItemId,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    setItems
  } = useCatalogItems({ initialItems });

  const {
    customTypes,
    loadCustomTypes,
    customFranchises,
    loadCustomFranchises,
    customBrands,
    loadCustomBrands,
  } = useCustomEntities({
    initialTypes,
    initialFranchises,
    initialBrands
  });

  // Wrap everything in the ImageCacheProvider at the top level
  return (
    <ImageCacheProvider>
      <CatalogContent
        items={items}
        isLoading={isLoading}
        loadingItemId={loadingItemId}
        fetchItems={fetchItems}
        addItem={addItem}
        updateItem={updateItem}
        deleteItem={deleteItem}
        setItems={setItems}
        customTypes={customTypes}
        loadCustomTypes={loadCustomTypes}
        customFranchises={customFranchises}
        loadCustomFranchises={loadCustomFranchises}
        customBrands={customBrands}
        loadCustomBrands={loadCustomBrands}
      />
    </ImageCacheProvider>
  );
} 