"use client"

import React from 'react'
import { SelectItem as SelectItemType } from "@/db/schema/items-schema"
import Catalog from './catalog'

interface CatalogPageProps {
  initialManufacturers: { id: string; name: string }[];
  initialTypes: { id: string; name: string }[];
  initialFranchises: { id: string; name: string }[];
  initialItems: SelectItemType[];
}

export default function CatalogPage({
  initialManufacturers,
  initialTypes,
  initialFranchises,
  initialItems
}: CatalogPageProps) {
  return (
    <Catalog
      initialItems={initialItems}
      initialTypes={initialTypes}
      initialFranchises={initialFranchises}
      initialManufacturers={initialManufacturers}
    />
  );
} 