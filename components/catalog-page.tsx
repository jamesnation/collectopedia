"use client"

import React from 'react'
import { SelectItem as SelectItemType } from "@/db/schema/items-schema"
import Catalog from './catalog'

interface CatalogPageProps {
  initialBrands: { id: string; name: string }[];
  initialTypes: { id: string; name: string }[];
  initialFranchises: { id: string; name: string }[];
  initialItems: SelectItemType[];
}

export default function CatalogPage({
  initialBrands,
  initialTypes,
  initialFranchises,
  initialItems
}: CatalogPageProps) {
  return (
    <Catalog
      initialItems={initialItems}
      initialTypes={initialTypes}
      initialFranchises={initialFranchises}
      initialBrands={initialBrands}
    />
  );
} 