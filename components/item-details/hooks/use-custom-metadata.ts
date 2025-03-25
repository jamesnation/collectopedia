/**
 * Hook for loading and managing custom metadata
 * 
 * This hook manages:
 * - Loading custom brands
 * - Loading custom franchises
 * - Providing default options
 * - Generating year options
 */

import { useState, useEffect } from 'react'
import { getCustomBrandsAction } from '@/actions/custom-brands-actions'
import { getCustomFranchisesAction } from '@/actions/custom-franchises-actions'
import { generateYearOptions } from '@/lib/utils'

// Define the ItemCondition type locally since it's not exported from the schema
export type ItemCondition = "New" | "Used";

export function useCustomMetadata() {
  const [customBrands, setCustomBrands] = useState<{ id: string; name: string }[]>([])
  const [customFranchises, setCustomFranchises] = useState<{ id: string; name: string }[]>([])
  const yearOptions = generateYearOptions()
  
  // Default brands list
  const defaultBrands = [
    'DC',
    'Filmation',
    'Funko',
    'Games Workshop',
    'Hasbro',
    'Kenner',
    'Marvel',
    'Matchbox',
    'Mattel',
    'Medium',
    'Playmates',
    'Senate',
    'Sunbow',
    'Super7',
    'Takara',
    'Tomy'
  ]

  // Condition options
  const conditionOptions: ItemCondition[] = [
    "New",
    "Used"
  ]
  
  // Load custom brands and franchises on mount
  useEffect(() => {
    loadCustomBrands()
    loadCustomFranchises()
  }, [])
  
  // Load custom brands from the database
  const loadCustomBrands = async () => {
    const result = await getCustomBrandsAction()
    if (result.isSuccess && result.data) {
      setCustomBrands(result.data)
    }
  }

  // Load custom franchises from the database
  const loadCustomFranchises = async () => {
    const result = await getCustomFranchisesAction()
    if (result.isSuccess && result.data) {
      setCustomFranchises(result.data)
    }
  }
  
  return {
    customBrands,
    customFranchises,
    defaultBrands,
    conditionOptions,
    yearOptions,
    refreshBrands: loadCustomBrands,
    refreshFranchises: loadCustomFranchises
  }
} 