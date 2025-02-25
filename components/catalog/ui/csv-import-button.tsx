"use client"

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Package, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Papa from 'papaparse'
import { CatalogItem } from '../utils/schema-adapter'

// Define the CSV item structure
type CSVItem = {
  name: string
  type: string
  franchise: string
  brand: string
  year: string
  acquired: string
  cost: string
  value: string
  notes: string
  isSold: string
  soldDate: string
  soldPrice: string
  ebayListed: string
  ebaySold: string
  condition: string
}

interface CSVImportButtonProps {
  onAddItem: (item: Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean | undefined>
  onCreateCustomType: (name: string) => Promise<boolean>
  onCreateCustomFranchise: (name: string) => Promise<boolean>
  onCreateCustomBrand: (name: string) => Promise<boolean>
  onLoadCustomTypes: () => Promise<any>
  onLoadCustomFranchises: () => Promise<any>
  onLoadCustomBrands: () => Promise<any>
  defaultTypeOptions: string[]
  defaultFranchiseOptions: string[]
  defaultBrandOptions: string[]
}

export function CSVImportButton({
  onAddItem,
  onCreateCustomType,
  onCreateCustomFranchise,
  onCreateCustomBrand,
  onLoadCustomTypes,
  onLoadCustomFranchises,
  onLoadCustomBrands,
  defaultTypeOptions,
  defaultFranchiseOptions,
  defaultBrandOptions
}: CSVImportButtonProps) {
  const [isImporting, setIsImporting] = useState(false)
  const csvInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setIsImporting(true)
    
    try {
      const text = await file.text()
      
      Papa.parse<CSVItem>(text, {
        header: true,
        complete: async (results) => {
          console.log('Parsed CSV data:', results.data)
          const csvData = results.data
          let importedCount = 0
          let errorCount = 0
          
          for (const item of csvData) {
            try {
              // Check if type exists in default options or create a new custom type
              const importedType = item.type || 'Other'
              let finalType = importedType
              
              if (importedType !== 'Other' && !defaultTypeOptions.includes(importedType)) {
                // Create new custom type
                const typeResult = await onCreateCustomType(importedType)
                if (!typeResult) {
                  console.error('Failed to create custom type:', importedType)
                  finalType = 'Other'
                } else {
                  // Refresh custom types list
                  await onLoadCustomTypes()
                }
              }
              
              // Check if franchise exists in default options or create a new custom franchise
              const importedFranchise = item.franchise || 'Other'
              let finalFranchise = importedFranchise
              
              if (importedFranchise !== 'Other' && !defaultFranchiseOptions.includes(importedFranchise)) {
                // Create new custom franchise
                const franchiseResult = await onCreateCustomFranchise(importedFranchise)
                if (!franchiseResult) {
                  console.error('Failed to create custom franchise:', importedFranchise)
                  finalFranchise = 'Other'
                } else {
                  // Refresh custom franchises list
                  await onLoadCustomFranchises()
                }
              }
              
              // Check if brand exists in default options or create a new custom brand
              const importedBrand = item.brand || null
              let finalBrand = importedBrand
              
              if (importedBrand && !defaultBrandOptions.includes(importedBrand)) {
                // Create new custom brand
                const brandResult = await onCreateCustomBrand(importedBrand)
                if (!brandResult) {
                  console.error('Failed to create custom brand:', importedBrand)
                  finalBrand = null
                } else {
                  // Refresh custom brands list
                  await onLoadCustomBrands()
                }
              }
              
              // Create the new item
              const newItem = {
                userId: '',
                name: item.name || 'Unnamed Item',
                type: finalType,
                franchise: finalFranchise,
                brand: finalBrand,
                year: item.year ? parseInt(item.year) : null,
                condition: (item.condition || 'Used - complete') as "New" | "Used - complete" | "Used - item only",
                acquired: item.acquired ? new Date(item.acquired) : new Date(),
                cost: item.cost ? parseFloat(item.cost) : 0,
                value: item.value ? parseFloat(item.value) : 0,
                notes: item.notes || '',
                isSold: item.isSold?.toLowerCase() === 'true',
                soldDate: item.soldDate ? new Date(item.soldDate) : null,
                soldPrice: item.soldPrice ? parseFloat(item.soldPrice) : null,
                ebayListed: item.ebayListed ? parseFloat(item.ebayListed) : null,
                ebaySold: item.ebaySold ? parseFloat(item.ebaySold) : null,
                image: null,
                images: []
              }
              
              console.log('Attempting to import item:', JSON.stringify(newItem, null, 2))
              const result = await onAddItem(newItem)
              
              if (result) {
                importedCount++
                console.log('Item imported successfully')
              } else {
                console.error('Failed to import item')
                errorCount++
              }
            } catch (error) {
              console.error('Error importing item:', error, 'Item data:', JSON.stringify(item, null, 2))
              errorCount++
            }
          }
          
          toast({
            title: "CSV Import Completed",
            description: `Successfully imported ${importedCount} items. ${errorCount} items failed to import.`,
          })
        },
        error: (error: Error) => {
          console.error('CSV Parse Error:', error)
          toast({
            title: "CSV Import Error",
            description: "There was an error parsing the CSV file. Please check the file format and try again.",
            variant: "destructive",
          })
        }
      })
    } catch (error) {
      console.error('File reading error:', error)
      toast({
        title: "File Reading Error",
        description: "There was an error reading the CSV file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
      // Reset the file input
      if (csvInputRef.current) {
        csvInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <Button
        onClick={() => csvInputRef.current?.click()}
        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full sm:w-auto"
        disabled={isImporting}
      >
        {isImporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <Package className="mr-2 h-4 w-4" /> Import CSV
          </>
        )}
      </Button>
      <input
        type="file"
        ref={csvInputRef}
        className="hidden"
        accept=".csv"
        onChange={handleCSVImport}
        disabled={isImporting}
      />
    </>
  )
} 