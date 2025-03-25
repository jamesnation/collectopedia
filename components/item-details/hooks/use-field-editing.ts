/**
 * Hook for managing item field editing
 * 
 * This hook manages:
 * - Starting to edit a field
 * - Canceling edit
 * - Saving edits
 * - Handling input changes
 */

import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { updateItemAction } from '@/actions/items-actions'
import { SelectItem } from '@/db/schema/items-schema'

export function useFieldEditing(item: SelectItem | null, onItemUpdate: (item: SelectItem) => void) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const { toast } = useToast()
  
  // Start editing a field
  const handleEditStart = (field: string) => {
    console.log('Starting to edit field:', field)
    setEditingField(field)
  }
  
  // Cancel editing a field
  const handleEditCancel = () => {
    console.log('Canceling edit for field:', editingField)
    setEditingField(null)
  }
  
  // Save changes to edited fields
  const handleEditSave = async () => {
    if (!item) return
    
    try {
      let updatedItem = { ...item }
      
      // Handle specific fields differently if needed
      // Most editing is now handled directly in the individual fields via handleInputChange
      
      console.log('Sending API request to update item:', updatedItem)
      const result = await updateItemAction(item.id, updatedItem)
      console.log('Update result:', result)
      
      if (result.isSuccess) {
        if (result.data && result.data[0]) {
          console.log('Setting item to:', result.data[0])
          onItemUpdate(result.data[0])
        }
        setEditingField(null)
        toast({
          title: "Item updated",
          description: "Your changes have been saved successfully.",
        })
      } else {
        throw new Error(result.error || 'Action failed')
      }
    } catch (error) {
      console.error('Error saving edit:', error)
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  // Handle input changes for form fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!item) return
    
    const { name, value } = e.target
    
    // Handle numeric fields appropriately
    const newValue = name === 'value' || name === 'cost' ? 
      parseFloat(value) || 0 : 
      value
    
    // Update the item
    const updatedItem = {
      ...item,
      [name]: newValue
    }
    
    onItemUpdate(updatedItem)
  }
  
  // Handle select changes
  const handleSelectChange = (field: keyof SelectItem, value: string | number | null) => {
    if (!item) return
    
    const updatedItem = {
      ...item,
      [field]: value
    }
    
    onItemUpdate(updatedItem)
  }
  
  return {
    editingField,
    handleEditStart,
    handleEditCancel,
    handleEditSave,
    handleInputChange,
    handleSelectChange
  }
} 