/**
 * Hook for managing item sold status and sold details
 * 
 * This hook manages:
 * - Toggling an item's sold status
 * - Managing sold price and date fields
 * - Saving sold details to the database
 */

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { updateItemAction } from '@/actions/items-actions'
import { SelectItem } from '@/db/schema/items-schema'

export function useSoldStatus(item: SelectItem | null, onItemUpdate: (item: SelectItem) => void) {
  const [isSold, setIsSold] = useState(false)
  const [soldPrice, setSoldPrice] = useState("")
  const [soldDate, setSoldDate] = useState("")
  const { toast } = useToast()
  
  // Initialize sold states when item changes
  useEffect(() => {
    if (item) {
      setIsSold(item.isSold)
      
      if (item.isSold && item.soldPrice !== undefined && item.soldPrice !== null) {
        setSoldPrice(item.soldPrice.toString())
      }
      
      if (item.isSold && item.soldDate) {
        setSoldDate(new Date(item.soldDate).toISOString().split('T')[0])
      }
    }
  }, [item])
  
  // Handle sold price change
  const handleSoldPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    console.log('Updating soldPrice state:', newValue)
    setSoldPrice(newValue)
  }

  // Handle sold date change
  const handleSoldDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSoldDate(e.target.value)
  }
  
  // Handle sold status toggle
  const handleSoldToggle = async (checked: boolean) => {
    if (!item) return
    
    setIsSold(checked)
    
    try {
      const updatedItem = { ...item, isSold: checked }
      const result = await updateItemAction(item.id, updatedItem)
      
      if (result.isSuccess) {
        if (result.data && result.data[0]) {
          onItemUpdate(result.data[0])
        }
        
        toast({
          title: checked ? "Item marked as sold" : "Item unmarked as sold",
          description: checked ? "The item has been marked as sold." : "The item has been unmarked as sold.",
        })
      } else {
        throw new Error('Failed to update item sold status')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item sold status. Please try again.",
        variant: "destructive",
      })
      setIsSold(!checked) // Revert the toggle if update fails
    }
    
    if (!checked) {
      setSoldPrice("")
      setSoldDate("")
    }
  }
  
  // Save sold details
  const handleSaveSoldDetails = async () => {
    if (!item || !isSold) return
    
    try {
      const updatedItem = {
        ...item,
        isSold: true,
        soldPrice: parseInt(soldPrice),
        soldDate: new Date(soldDate),
      }
      
      const result = await updateItemAction(item.id, updatedItem)

      if (result.isSuccess && result.data) {
        onItemUpdate(result.data[0])
        
        toast({
          title: "Sold details saved",
          description: "The item has been marked as sold and details saved.",
        })
      } else {
        throw new Error(result.error || 'Action failed')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save sold details. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  // Handle form submission for sold price
  const handleSoldPriceForm = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Sold price form submitted with value:', soldPrice)
    
    if (!item) return
    
    try {
      const parsedSoldPrice = soldPrice ? parseInt(soldPrice) : 0
      const updatedItem = { ...item, soldPrice: parsedSoldPrice }
      
      updateItemAction(item.id, updatedItem)
        .then(result => {
          if (result.isSuccess && result.data && result.data[0]) {
            onItemUpdate(result.data[0])
            
            toast({
              title: "Sold price updated",
              description: "The sold price has been updated successfully.",
            })
          } else {
            throw new Error(result.error || 'Action failed')
          }
        })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update sold price. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  return {
    isSold,
    soldPrice,
    soldDate,
    handleSoldPriceChange,
    handleSoldDateChange,
    handleSoldToggle,
    handleSaveSoldDetails,
    handleSoldPriceForm
  }
} 