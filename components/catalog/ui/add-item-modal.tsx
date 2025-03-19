/**
 * Add Item Modal Component
 * 
 * A modal dialog for adding new items to the collection.
 * This component has been updated to use React Query for mutations.
 * Updated to use named exports per TypeScript standards.
 */

"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddItemForm } from './add-item-form'
import { CatalogItem } from '../utils/item-types'
import { CustomEntity } from "../filter-controls/filter-types"
import { useAddItemMutation } from '../hooks/use-catalog-queries'

export interface AddItemModalProps {
  // Removed onAddItem prop as we'll use React Query mutation
  customTypes: CustomEntity[]
  customFranchises: CustomEntity[]
  customBrands: CustomEntity[]
  onLoadCustomTypes: () => Promise<void>
  onLoadCustomFranchises: () => Promise<void>
  onLoadCustomBrands: () => Promise<void>
  isLoading?: boolean
  trigger?: React.ReactNode
}

export function AddItemModal({
  // Removed onAddItem parameter 
  customTypes,
  customFranchises,
  customBrands,
  onLoadCustomTypes,
  onLoadCustomFranchises,
  onLoadCustomBrands,
  isLoading = false,
  trigger
}: AddItemModalProps) {
  const [open, setOpen] = useState(false)
  
  // Use the React Query mutation hook instead of local state
  const { mutate: addItem, isPending } = useAddItemMutation()

  const handleSubmit = async (formData: Omit<CatalogItem, 'id'>) => {
    addItem(formData, {
      onSuccess: () => {
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            className="bg-violet-600 hover:bg-violet-700 text-white"
            disabled={isLoading || isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add New Item</DialogTitle>
        </DialogHeader>
        <AddItemForm 
          onSubmit={handleSubmit} 
          onCancel={() => setOpen(false)}
          customTypes={customTypes}
          customFranchises={customFranchises}
          customBrands={customBrands}
          onLoadCustomTypes={onLoadCustomTypes}
          onLoadCustomFranchises={onLoadCustomFranchises}
          onLoadCustomBrands={onLoadCustomBrands}
          isSubmitting={isPending}
        />
      </DialogContent>
    </Dialog>
  )
} 