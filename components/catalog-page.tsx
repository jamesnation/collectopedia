"use client"

import React, { useEffect, useState } from 'react'
import { SelectItem as SelectItemType } from "@/db/schema/items-schema"
import Catalog from './catalog'
import { useTheme } from 'next-themes'

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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can safely show the UI that depends on the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Avoid rendering theme-dependent UI until mounted
  }

  return (
    <div className="min-h-screen transition-colors duration-200 dark:bg-[#0A0118]">
      <div className="dark:bg-gradient-to-b dark:from-[#0A0118] dark:via-purple-900/20 dark:to-[#0A0118]">
        <Catalog
          initialItems={initialItems}
          initialTypes={initialTypes}
          initialFranchises={initialFranchises}
          initialBrands={initialBrands}
          theme={theme}
          setTheme={setTheme}
        />
      </div>
    </div>
  );
} 