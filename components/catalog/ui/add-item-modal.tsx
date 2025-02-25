"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { AddItemForm } from './add-item-form'
import { CatalogItem } from '../utils/schema-adapter'

interface AddItemModalProps {
  onAddItem: (item: Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean | undefined>
  customTypes: { id: string; name: string }[]
  customBrands: { id: string; name: string }[]
  customManufacturers: { id: string; name: string }[]
  onLoadCustomTypes: () => void
  onLoadCustomBrands: () => void
  onLoadCustomManufacturers: () => void
  isLoading: boolean
}

export function AddItemModal({
  onAddItem,
  customTypes,
  customBrands,
  customManufacturers,
  onLoadCustomTypes,
  onLoadCustomBrands,
  onLoadCustomManufacturers,
  isLoading
}: AddItemModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleSubmit = async (item: Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const success = await onAddItem(item)
    if (success) {
      setIsOpen(false)
    }
    return !!success
  }
  
  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
      </Button>
      
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add New Item</SheetTitle>
            <SheetDescription>
              Fill in the details below to add a new item to your collection.
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6">
            <AddItemForm
              onSubmit={handleSubmit}
              customTypes={customTypes}
              customBrands={customBrands}
              customManufacturers={customManufacturers}
              onLoadCustomTypes={onLoadCustomTypes}
              onLoadCustomBrands={onLoadCustomBrands}
              onLoadCustomManufacturers={onLoadCustomManufacturers}
              isLoading={isLoading}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
} 