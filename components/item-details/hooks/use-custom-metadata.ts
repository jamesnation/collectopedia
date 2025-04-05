/**
 * Hook for loading and managing custom metadata
 * 
 * This hook manages:
 * - Loading custom brands
 * - Loading custom franchises
 * - Providing default options
 * - Generating year options
 */

import { useState, useEffect, useCallback } from 'react'
// Remove old imports
// import { getCustomBrandsAction } from '@/actions/custom-brands-actions'
// import { getCustomFranchisesAction } from '@/actions/custom-franchises-actions'

// Import new generic action
import { getCustomAttributesAction } from '@/actions/custom-attribute-actions';
import { generateYearOptions } from '@/lib/utils'
import { SelectCustomAttribute } from "@/db/schema"; // Import new schema type

// Define the ItemCondition type locally since it's not exported from the schema
export type ItemCondition = "New" | "Used";

// Define the attribute type literal
type AttributeType = 'brand' | 'franchise' | 'type';

export function useCustomMetadata() {
  // Update state types
  const [customBrands, setCustomBrands] = useState<SelectCustomAttribute[]>([])
  const [customFranchises, setCustomFranchises] = useState<SelectCustomAttribute[]>([])
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

  // Generic fetch function for this hook
  const loadAttributes = useCallback(async (type: AttributeType) => {
    try {
      const result = await getCustomAttributesAction(type)
      if (result.isSuccess && result.data) {
        if (type === 'brand') {
          setCustomBrands(result.data)
        } else if (type === 'franchise') {
          setCustomFranchises(result.data)
        }
      } else {
         console.error(`Failed to load custom ${type}s:`, result.error);
         // Optionally set state to empty array or handle error differently
         if (type === 'brand') setCustomBrands([]);
         else if (type === 'franchise') setCustomFranchises([]);
      }
    } catch (error) {
       console.error(`Error fetching custom ${type}s:`, error);
       // Optionally set state to empty array or handle error differently
       if (type === 'brand') setCustomBrands([]);
       else if (type === 'franchise') setCustomFranchises([]);
    }
  }, []);
  
  // Load custom brands and franchises on mount
  useEffect(() => {
    loadAttributes('brand');
    loadAttributes('franchise');
  }, [loadAttributes]) // Depend on the memoized function
  
  // // Load custom brands from the database - Replaced by loadAttributes
  // const loadCustomBrands = async () => {
  //   const result = await getCustomBrandsAction()
  //   if (result.isSuccess && result.data) {
  //     setCustomBrands(result.data)
  //   }
  // }

  // // Load custom franchises from the database - Replaced by loadAttributes
  // const loadCustomFranchises = async () => {
  //   const result = await getCustomFranchisesAction()
  //   if (result.isSuccess && result.data) {
  //     setCustomFranchises(result.data)
  //   }
  // }
  
  return {
    customBrands,
    customFranchises,
    defaultBrands,
    conditionOptions,
    yearOptions,
    // Update refresh functions to use the generic loader
    refreshBrands: () => loadAttributes('brand'), 
    refreshFranchises: () => loadAttributes('franchise')
  }
} 