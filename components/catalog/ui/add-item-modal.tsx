"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { PlusCircle, X, Save } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { AddItemForm } from './add-item-form'
import { CatalogItem } from '../utils/schema-adapter'

interface AddItemModalProps {
  onAddItem: (item: Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean | undefined>
  customTypes: { id: string; name: string }[]
  customFranchises: { id: string; name: string }[]
  customBrands: { id: string; name: string }[]
  onLoadCustomTypes: () => void
  onLoadCustomFranchises: () => void
  onLoadCustomBrands: () => void
  isLoading: boolean
}

export function AddItemModal({
  onAddItem,
  customTypes,
  customFranchises,
  customBrands,
  onLoadCustomTypes,
  onLoadCustomFranchises,
  onLoadCustomBrands,
  isLoading
}: AddItemModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState<Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'> | null>(null)
  const [localIsLoading, setLocalIsLoading] = useState(false)
  
  // Reset form data when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setFormData(null)
    }
  }, [isOpen])
  
  const handleSubmit = async (item: Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log("Form submitted with data:", item)
    setFormData(item)
    return true // Just store the data, don't submit yet
  }
  
  const handleSave = async () => {
    if (!formData) {
      console.error("Cannot save: formData is null")
      return
    }
    
    console.log("Saving item:", formData)
    setLocalIsLoading(true)
    
    try {
      const success = await onAddItem(formData)
      if (success) {
        setIsOpen(false)
        setFormData(null)
      }
    } catch (error) {
      console.error("Error saving item:", error)
    } finally {
      setLocalIsLoading(false)
    }
  }
  
  // For debugging purposes
  console.log("Current state:", { formData, isLoading, localIsLoading, isButtonDisabled: isLoading || localIsLoading || !formData })
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="dark:bg-purple-600 dark:text-white dark:hover:bg-purple-700">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </SheetTrigger>
      <SheetContent 
        className="w-full sm:max-w-xl overflow-y-auto dark:bg-[#0A0118] dark:border-gray-800 dark:border-l-purple-500/20 flex flex-col"
        side="right"
      >
        <SheetHeader className="pb-4 text-left">
          <SheetTitle className="text-2xl dark:text-white">Add New Item</SheetTitle>
          <SheetDescription className="dark:text-gray-300">
            Add the details for your new collection item. Fill out the form and click "Submit" first, then "Save Item".
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto pb-20">
          <AddItemForm
            onSubmit={handleSubmit}
            customTypes={customTypes}
            customFranchises={customFranchises}
            customBrands={customBrands}
            onLoadCustomTypes={onLoadCustomTypes}
            onLoadCustomFranchises={onLoadCustomFranchises}
            onLoadCustomBrands={onLoadCustomBrands}
            isLoading={isLoading || localIsLoading}
            hideSubmitButton={false}
          />
        </div>
        
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background dark:bg-[#0A0118] border-t dark:border-gray-800 mt-auto">
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="dark:bg-transparent dark:border-purple-500/20 dark:text-white dark:hover:bg-gray-800"
            >
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isLoading || localIsLoading || !formData}
              className="dark:bg-purple-600 dark:text-white dark:hover:bg-purple-700"
            >
              <Save className="mr-2 h-4 w-4" /> {(isLoading || localIsLoading) ? 'Saving...' : 'Save Item'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 