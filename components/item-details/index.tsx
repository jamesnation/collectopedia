/**
 * Item Details Page Component
 * 
 * This component is the main entry point for the item details page.
 * It orchestrates the various subcomponents that make up the item details view.
 */

"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from "lucide-react"
import { useRegionContext } from "@/contexts/region-context"
import { Button } from "@/components/ui/button"

// Import hooks
import { useItemData } from './hooks/use-item-data'
import { useImageManagement } from './hooks/use-image-management'
import { useEbayPricing } from './hooks/use-ebay-pricing'
import { useSoldStatus } from './hooks/use-sold-status'
import { useFieldEditing } from './hooks/use-field-editing'
import { useItemDeletion } from './hooks/use-item-deletion'
import { useCustomMetadata } from './hooks/use-custom-metadata'

// Import UI components
import ImageGallery from './ui/image-gallery'
import PriceSection from './ui/price-section'
import DebugPanel from './ui/debug-panel'
import ItemMetadata from './ui/item-metadata'
import SoldDetails from './ui/sold-details'
import DeleteDialog from './ui/delete-dialog'

interface ItemDetailsPageProps {
  id: string
}

export default function ItemDetailsPage({ id }: ItemDetailsPageProps) {
  const router = useRouter()
  const { formatCurrency } = useRegionContext()
  
  // Use the hooks to manage state and functions
  const { item, isLoading, updateItem } = useItemData(id)
  const { 
    images, 
    currentImageIndex,
    handleImageUpload,
    handleImageDelete,
    handlePreviousImage,
    handleNextImage,
    setActiveImage,
    handleImageReorder,
    navigateBackToCatalog,
    hasImageChanges
  } = useImageManagement(id, item?.userId)
  
  const {
    loadingAiPrice,
    debugData,
    isDebugMode,
    isInitialized,
    handleAiPriceRefresh
  } = useEbayPricing(item, images, updateItem)
  
  const {
    isSold,
    soldPrice,
    soldDate,
    handleSoldPriceChange,
    handleSoldDateChange,
    handleSoldToggle,
    handleSaveSoldDetails,
    handleSoldPriceForm
  } = useSoldStatus(item, updateItem)
  
  const {
    editingField,
    handleEditStart,
    handleEditCancel,
    handleEditSave,
    handleInputChange,
    handleSelectChange
  } = useFieldEditing(item, updateItem)
  
  const { handleDelete } = useItemDeletion(id)
  
  const {
    customBrands,
    customFranchises,
    defaultBrands,
    conditionOptions,
    yearOptions
  } = useCustomMetadata()
  
  // Scroll to top when navigating to the item
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto" />
          <p className="mt-4 text-lg text-foreground">Loading item details...</p>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-lg text-destructive">Error: Item not found</p>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black/30">
      <main className="container mx-auto px-2 sm:px-4 py-8 sm:py-12 max-w-7xl overflow-x-hidden">
        <Button 
          onClick={navigateBackToCatalog} 
          variant="ghost" 
          className="inline-flex items-center text-purple-400 hover:text-primary/50 mb-4 sm:mb-8 p-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collection
          {hasImageChanges && (
            <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full">
              Updated
            </span>
          )}
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
          {/* Image gallery section */}
          <div className="w-full">
            <ImageGallery
              images={images}
              currentImageIndex={currentImageIndex}
              itemName={item.name}
              userId={item.userId}
              itemId={item.id}
              onUpload={handleImageUpload}
              onDelete={handleImageDelete}
              onPrevious={handlePreviousImage}
              onNext={handleNextImage}
              onSelect={setActiveImage}
              onReorder={handleImageReorder}
            />
            
            {/* Debug panel (only visible in debug mode) - moved under the image */}
            {isDebugMode && (
              <DebugPanel
                debugData={debugData}
                item={item}
                isDebugMode={isDebugMode}
                isInitialized={isInitialized}
                images={images}
              />
            )}
          </div>

          {/* Item details section */}
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{item.name}</h1>
              
              <div className="flex flex-wrap gap-2 items-center">
                {item.brand && (
                  <span className="text-sm text-muted-foreground">{item.brand}</span>
                )}
                {item.franchise && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{item.franchise}</span>
                  </>
                )}
                {item.year && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{item.year}</span>
                  </>
                )}
                {item.type && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{item.type}</span>
                  </>
                )}
              </div>
            </div>

            {/* Price section */}
            <PriceSection
              item={item}
              formatCurrency={formatCurrency}
              loadingAiPrice={loadingAiPrice}
              onAiPriceRefresh={handleAiPriceRefresh}
              editingField={editingField}
              onEditStart={handleEditStart}
              onEditCancel={handleEditCancel}
              onEditSave={handleEditSave}
              onInputChange={handleInputChange}
              soldPrice={soldPrice}
              isSold={isSold}
              onSoldPriceChange={handleSoldPriceChange}
              onSoldPriceFormSubmit={handleSoldPriceForm}
            />

            {/* Sold details section */}
            <SoldDetails
              item={item}
              isSold={isSold}
              soldPrice={soldPrice}
              soldDate={soldDate}
              formatCurrency={formatCurrency}
              editingField={editingField}
              onSoldToggle={handleSoldToggle}
              onSoldPriceChange={handleSoldPriceChange}
              onSoldDateChange={handleSoldDateChange}
              onSaveSoldDetails={handleSaveSoldDetails}
              onEditStart={handleEditStart}
              onEditCancel={handleEditCancel}
              onEditSave={handleEditSave}
            />

            {/* Item metadata section */}
            <ItemMetadata
              item={item}
              editingField={editingField}
              customBrands={customBrands}
              customFranchises={customFranchises}
              defaultBrands={defaultBrands}
              conditionOptions={conditionOptions}
              yearOptions={yearOptions}
              onEditStart={handleEditStart}
              onEditCancel={handleEditCancel}
              onEditSave={handleEditSave}
              onInputChange={handleInputChange}
              onSelectChange={handleSelectChange}
            />
            
            {/* Delete button */}
            <div className="pt-4 mt-8 border-t border-border">
              <DeleteDialog
                onDelete={handleDelete}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 