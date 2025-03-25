/**
 * Hook for managing item data state and fetching
 * 
 * This hook manages:
 * - Loading the item by ID
 * - Loading sold item information
 * - Managing the loading state
 */

import { useState, useEffect } from 'react'
import { getItemByIdAction } from '@/actions/items-actions'
import { getSoldItemByItemIdAction } from '@/actions/sold-items-actions'
import { SelectItem } from '@/db/schema/items-schema'
import { SelectSoldItem } from '@/db/schema/sold-items-schema'

export function useItemData(itemId: string) {
  const [item, setItem] = useState<SelectItem | null>(null)
  const [soldItem, setSoldItem] = useState<SelectSoldItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Fetch item and sold item data on mount
  useEffect(() => {
    if (itemId) {
      fetchItem(itemId)
      fetchSoldItem(itemId)
    }
  }, [itemId])
  
  // Fetch item details from the database
  const fetchItem = async (id: string) => {
    setIsLoading(true)
    const result = await getItemByIdAction(id)
    if (result.isSuccess && result.data) {
      setItem(result.data)
    }
    setIsLoading(false)
  }

  // Fetch sold item details if item was sold
  const fetchSoldItem = async (id: string) => {
    const result = await getSoldItemByItemIdAction(id)
    if (result.isSuccess && result.data) {
      setSoldItem(result.data)
    }
  }
  
  // Update the item state
  const updateItem = (newItem: SelectItem) => {
    setItem(newItem)
  }
  
  return {
    item,
    soldItem,
    isLoading,
    updateItem,
    refetchItem: (id: string) => fetchItem(id),
    refetchSoldItem: (id: string) => fetchSoldItem(id)
  }
} 