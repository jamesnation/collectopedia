"use client"

import React, { useEffect, useState } from 'react'
import { SelectItem as SelectItemType } from "@/db/schema/items-schema"
import Catalog from './catalog'
import { useBackgroundUpdates } from '@/hooks/use-background-updates'

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
  const [mounted, setMounted] = useState(false);

  // Trigger background eBay price updates once per day
  useBackgroundUpdates();

  // After mounting, we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Avoid rendering until mounted
  }

  return (
    <div className="min-h-screen transition-colors duration-200 dark:bg-card">
      <div className="dark:bg-card">
        <Catalog
          initialItems={initialItems}
          initialTypes={initialTypes}
          initialFranchises={initialFranchises}
          initialBrands={initialBrands}
        />
      </div>
    </div>
  );
} 