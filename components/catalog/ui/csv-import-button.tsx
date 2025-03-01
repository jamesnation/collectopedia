"use client"

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Package, Loader2, FileUp, Upload } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Papa from 'papaparse'
import { CatalogItem } from '../utils/schema-adapter'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Debug utility function
const debugCSV = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📋 CSV IMPORT: ${message}`, data || '');
  }
};

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
  const [file, setFile] = useState<File | null>(null)
  const [hasHeaderRow, setHasHeaderRow] = useState(true)
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      debugCSV(`File selected:`, {
        name: selectedFile.name,
        type: selectedFile.type,
        size: `${(selectedFile.size / 1024).toFixed(1)} KB`
      });
      setFile(selectedFile)
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive"
      })
      return
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file format",
        description: "Please select a file with .csv extension",
        variant: "destructive"
      })
      return
    }

    debugCSV(`Starting import process for ${file.name}`);
    setIsImporting(true)

    try {
      debugCSV(`Reading file contents`);
      const text = await file.text()
      
      // Simple validation of CSV content
      if (!text.trim()) {
        throw new Error("The CSV file is empty")
      }
      
      // Check if file appears to be CSV format
      if (!text.includes(',')) {
        throw new Error("The file doesn't appear to be in CSV format (no commas found)")
      }
      
      Papa.parse<CSVItem>(text, {
        header: hasHeaderRow,
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
                condition: (item.condition || 'Used') as "New" | "Used",
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
          
          // Reset the file input
          setFile(null)
          setIsImporting(false)
          setIsDialogOpen(false)
        },
        error: (error: Error) => {
          console.error('CSV Parse Error:', error)
          toast({
            title: "CSV Import Error",
            description: "There was an error parsing the CSV file. Please check the file format and try again.",
            variant: "destructive",
          })
          setIsImporting(false)
        }
      })
    } catch (error) {
      console.error('File reading error:', error)
      toast({
        title: "File Reading Error",
        description: "There was an error reading the CSV file. Please try again.",
        variant: "destructive",
      })
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          className="flex items-center gap-2 dark:bg-card/50 dark:text-foreground dark:border-border dark:hover:bg-card/80"
          variant="outline"
          size="sm"
        >
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="dark:bg-card dark:text-foreground dark:border-border">
        <DialogHeader>
          <DialogTitle className="dark:text-foreground">Import Collection Items</DialogTitle>
          <DialogDescription className="dark:text-muted-foreground">
            Upload a CSV file to import your collection items
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="csv-file" className="dark:text-foreground">CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="dark:bg-card/50 dark:text-foreground dark:border-border"
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="header-row" 
                checked={hasHeaderRow} 
                onCheckedChange={(checked) => setHasHeaderRow(!!checked)} 
                className="dark:border-purple-500/20 dark:data-[state=checked]:bg-purple-600"
              />
              <label
                htmlFor="header-row"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300"
              >
                File has header row
              </label>
            </div>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Check this if your CSV file includes column headers in the first row.
            </p>
          </div>
          
          {file && (
            <div className="text-sm dark:text-white">
              Selected file: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(false)}
            className="dark:bg-card/50 dark:text-foreground dark:border-border"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || isImporting}
            className="dark:bg-primary dark:text-white dark:hover:bg-primary/80"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 