"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"
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
  const [localIsLoading, setLocalIsLoading] = useState(false)
  
  const handleSubmit = async (item: Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    setLocalIsLoading(true)
    
    try {
      const success = await onAddItem(item)
      if (success) {
        setIsOpen(false)
        return true
      }
      return false
    } catch (error) {
      console.error("Error saving item:", error)
      return false
    } finally {
      setLocalIsLoading(false)
    }
  }
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </SheetTrigger>
      <SheetContent 
        className="w-full sm:max-w-xl overflow-y-auto dark:bg-black/95 dark:border-border dark:border-l-border flex flex-col [&_*:focus]:z-10"
        side="right"
      >
        <SheetHeader className="pb-4 text-left">
          <SheetTitle className="text-2xl dark:text-foreground">Add New Item</SheetTitle>
          <SheetDescription className="dark:text-muted-foreground">
            Add the details for your new collection item and click &quot;Add Item&quot; when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto">
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
      </SheetContent>
    </Sheet>
  )
} 