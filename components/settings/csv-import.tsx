"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Package, Loader2, Download, FileWarning, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Papa from 'papaparse'
import { CatalogItem } from '@/components/catalog/utils/schema-adapter'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'

// Define the CSV item structure
type CSVItem = {
  name?: string
  Name?: string
  type?: string
  Type?: string
  franchise?: string
  Franchise?: string
  brand?: string
  Brand?: string
  year?: string
  Year?: string
  condition?: string
  Condition?: string
  acquired?: string
  Acquired?: string
  cost?: string
  Cost?: string
  value?: string
  Value?: string
  notes?: string
  Notes?: string
  isSold?: string
  IsSold?: string
  soldDate?: string
  SoldDate?: string
  soldPrice?: string
  SoldPrice?: string
  ebayListed?: string
  EbayListed?: string
  ebaySold?: string
  EbaySold?: string
}

// Define the import error type
type ImportError = {
  rowIndex: number
  rowData: CSVItem
  error: string
}

interface CSVImportProps {
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

// Create a debug utility function at the top of the file, before the component
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 PROGRESS DEBUG: ${message}`, data || '');
  }
};

export function CSVImport({
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
}: CSVImportProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStatus, setCurrentStatus] = useState<string>('')
  
  // Add a ref to track the last time we updated progress
  const lastProgressUpdate = useRef<number>(0);
  // Add a ref to the progress bar element
  const progressBarRef = useRef<HTMLDivElement>(null);
  // Track current progress value independently from React state
  const progressValueRef = useRef<number>(0);
  
  // Create a custom progress updater function that includes logging
  const updateProgress = (value: number) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastProgressUpdate.current;
    const previousValue = progressValueRef.current;
    
    debugLog(`Setting progress to ${value}. Previous: ${previousValue}. Time since last update: ${timeSinceLastUpdate}ms`);
    
    // Update the refs - use the value parameter, not the state variable
    progressValueRef.current = value; // Store the current value in our ref
    lastProgressUpdate.current = now;
    
    // Update the React state
    setProgress(value);
    
    // Direct DOM manipulation to ensure visual updates
    if (progressBarRef.current) {
      // Find the progress bar element (direct child div)
      const progressElement = progressBarRef.current.firstElementChild;
      
      // Update width directly for immediate feedback
      if (progressElement && progressElement instanceof HTMLElement) {
        progressElement.style.width = `${value}%`;
        debugLog(`Directly updated progress bar width: ${value}%`);
      }
    }
  };
  
  // Add an effect to force DOM updates when visible
  useEffect(() => {
    // Setup a periodic check to force redraw of progress if needed
    let interval: NodeJS.Timeout | null = null;
    
    if (isImporting) {
      interval = setInterval(() => {
        const currentValue = progressValueRef.current;
        if (currentValue > 0 && currentValue < 100) {
          debugLog(`Force redraw check - current progress: ${currentValue}`);
          
          // Force a minimal state change to trigger a re-render
          setProgress(prev => {
            // If the displayed value doesn't match our internal tracker, update it
            if (prev !== currentValue) {
              debugLog(`Syncing displayed progress from ${prev} to ${currentValue}`);
              return currentValue;
            }
            return prev;
          });
          
          // Also do direct DOM update as a more reliable fallback
          if (progressBarRef.current) {
            const progressElement = progressBarRef.current.firstElementChild;
            if (progressElement && progressElement instanceof HTMLElement) {
              progressElement.style.width = `${currentValue}%`;
              debugLog(`Force update progress width: ${currentValue}%`);
            }
          }
        }
      }, 250); // Check more frequently (250ms)
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isImporting]);

  const [importErrors, setImportErrors] = useState<ImportError[]>([])
  const [importSummary, setImportSummary] = useState<{
    totalRecords: number
    successCount: number
    errorCount: number
    completed: boolean
  }>({
    totalRecords: 0,
    successCount: 0,
    errorCount: 0,
    completed: false
  })
  const [showErrors, setShowErrors] = useState(false)
  
  const csvInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { userId } = useAuth()

  const resetImportState = () => {
    updateProgress(0);
    setCurrentStatus('')
    setImportErrors([])
    setImportSummary({
      totalRecords: 0,
      successCount: 0,
      errorCount: 0,
      completed: false
    })
    setShowErrors(false)
    debugLog('Import state reset');
  }

  const downloadTemplate = () => {
    const templateUrl = '/api/template'
    const link = document.createElement('a')
    link.href = templateUrl
    link.setAttribute('download', 'collection-template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    resetImportState()
    // Important: Set isImporting to true BEFORE setting any progress
    setIsImporting(true)
    
    // Allow time for the component to render with isImporting=true
    await new Promise(resolve => setTimeout(resolve, 0));
    
    setCurrentStatus('Validating CSV file...')
    // Make sure to set initial progress to show the bar
    debugLog('Starting CSV import process');
    updateProgress(5);
    
    // Check if the progress bar is visible
    setTimeout(() => {
      if (progressBarRef.current) {
        const isVisible = progressBarRef.current.offsetParent !== null;
        const rect = progressBarRef.current.getBoundingClientRect();
        debugLog(`Progress bar visibility check: ${isVisible ? 'VISIBLE' : 'HIDDEN'}`, {
          width: rect.width,
          height: rect.height,
          display: window.getComputedStyle(progressBarRef.current).display
        });
        
        // Force browser to repaint by accessing offsetHeight
        const forceRepaint = progressBarRef.current.offsetHeight;
      } else {
        debugLog('Progress bar element not found in the DOM');
      }
    }, 10);
    
    try {
      // First check if it's a valid CSV file
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        throw new Error('Invalid file format. Please upload a CSV file.')
      }

      const text = await file.text()
      setCurrentStatus('Parsing CSV data...')
      // Update progress after file is read
      debugLog('File read complete, updating progress');
      updateProgress(10);
      
      Papa.parse<CSVItem>(text, {
        header: true,
        complete: async (results) => {
          debugLog('CSV parsing complete');
          const csvData = results.data.filter(item => Object.keys(item).length > 0 && (item.name || item.Name)) // Filter out empty rows
          
          // Update progress after parsing
          debugLog(`Found ${csvData.length} valid rows in CSV`);
          updateProgress(15);
          
          // Normalize field names to lowercase for comparison
          const normalizedFields = results.meta.fields 
            ? results.meta.fields.map(field => field.toLowerCase().trim())
            : [];
          
          // Check for required headers (case-insensitive)
          const requiredHeaders = ['name', 'type']
          const missingHeaders = requiredHeaders.filter(header => 
            !normalizedFields.includes(header.toLowerCase().trim())
          )
          
          if (missingHeaders.length > 0) {
            setCurrentStatus('Error: Missing required headers')
            setImportErrors([{ 
              rowIndex: -1, 
              rowData: {} as CSVItem,
              error: `Missing required headers: ${missingHeaders.join(', ')}`
            }])
            setImportSummary({
              totalRecords: 0,
              successCount: 0,
              errorCount: 1,
              completed: true
            })
            return
          }

          setImportSummary(prev => ({
            ...prev,
            totalRecords: csvData.length
          }))
          
          // Set progress to 20% before starting to process rows
          updateProgress(20)
          
          const errors: ImportError[] = []
          let successCount = 0
          
          // Process items in chunks to allow rendering between chunks
          const processInChunks = async (startIndex: number, chunkSize: number = 3) => {
            // Process a small chunk of items
            const endIndex = Math.min(startIndex + chunkSize, csvData.length);
            
            debugLog(`Processing chunk ${startIndex} to ${endIndex-1} of ${csvData.length} items`);
            
            for (let i = startIndex; i < endIndex; i++) {
              const item = csvData[i];
              const rowIndex = i + 2; // +2 because of header row and 1-indexing
              
              // Calculate progress: 20% base progress + up to 80% based on completion
              const rowProgress = 20 + Math.floor((i / csvData.length) * 80);
              updateProgress(rowProgress);
              
              // Handle both capitalizations of field names
              const itemName = item.name || item.Name || '';
              setCurrentStatus(`Processing item ${i + 1} of ${csvData.length}: ${itemName || 'Unnamed Item'}`);
              
              try {
                // Validate required fields
                if (!itemName) {
                  throw new Error('Item name is required');
                }
                
                // Handle both capitalizations for type
                const importedType = item.type || item.Type || 'Other';
                let finalType = importedType;
                
                if (importedType !== 'Other' && !defaultTypeOptions.includes(importedType)) {
                  // Create new custom type
                  setCurrentStatus(`Creating custom type: ${importedType}...`);
                  const typeResult = await onCreateCustomType(importedType);
                  if (!typeResult) {
                    console.error('Failed to create custom type:', importedType);
                    finalType = 'Other';
                  } else {
                    // Refresh custom types list
                    await onLoadCustomTypes();
                  }
                }
                
                // Process franchise
                const importedFranchise = item.franchise || item.Franchise || 'Other';
                let finalFranchise = importedFranchise;
                
                if (importedFranchise !== 'Other' && !defaultFranchiseOptions.includes(importedFranchise)) {
                  // Create new custom franchise
                  setCurrentStatus(`Creating custom franchise: ${importedFranchise}...`);
                  const franchiseResult = await onCreateCustomFranchise(importedFranchise);
                  if (!franchiseResult) {
                    console.error('Failed to create custom franchise:', importedFranchise);
                    finalFranchise = 'Other';
                  } else {
                    // Refresh custom franchises list
                    await onLoadCustomFranchises();
                  }
                }
                
                // Process brand
                const importedBrand = item.brand || item.Brand || null;
                let finalBrand = importedBrand;
                
                if (importedBrand && !defaultBrandOptions.includes(importedBrand)) {
                  // Create new custom brand
                  setCurrentStatus(`Creating custom brand: ${importedBrand}...`);
                  const brandResult = await onCreateCustomBrand(importedBrand);
                  if (!brandResult) {
                    console.error('Failed to create custom brand:', importedBrand);
                    finalBrand = null;
                  } else {
                    // Refresh custom brands list
                    await onLoadCustomBrands();
                  }
                }
                
                // Create the new item
                const newItem = {
                  userId: userId || '',
                  name: itemName || 'Unnamed Item',
                  type: finalType,
                  franchise: finalFranchise,
                  brand: finalBrand || null,
                  year: (item.year || item.Year) ? parseInt(String(item.year || item.Year)) : null,
                  condition: (item.condition || item.Condition || 'Used - complete') as "New" | "Used - complete" | "Used - item only",
                  acquired: (item.acquired || item.Acquired) ? new Date(String(item.acquired || item.Acquired)) : new Date(),
                  cost: (item.cost || item.Cost) ? parseFloat(String(item.cost || item.Cost)) : 0,
                  value: (item.value || item.Value) ? parseFloat(String(item.value || item.Value)) : 0,
                  notes: (item.notes || item.Notes) || '',
                  isSold: (item.isSold?.toLowerCase() === 'true' || item.IsSold?.toLowerCase() === 'true') ? true : false,
                  soldDate: (item.soldDate || item.SoldDate) ? new Date(String(item.soldDate || item.SoldDate)) : null,
                  soldPrice: (item.soldPrice || item.SoldPrice) ? parseFloat(String(item.soldPrice || item.SoldPrice)) : null,
                  ebayListed: (item.ebayListed || item.EbayListed) ? parseFloat(String(item.ebayListed || item.EbayListed)) : null,
                  ebaySold: (item.ebaySold || item.EbaySold) ? parseFloat(String(item.ebaySold || item.EbaySold)) : null,
                  image: null,
                  images: []
                };
                
                // Validate required fields before saving
                if (!newItem.userId) {
                  throw new Error('User ID is required - you must be logged in to import items');
                }

                if (!newItem.name) {
                  throw new Error('Item name is required');
                }

                if (!newItem.type) {
                  throw new Error('Item type is required');
                }

                if (!newItem.franchise) {
                  throw new Error('Item franchise is required');
                }
                
                // Debug logging for date fields
                console.log('CSV IMPORT DEBUG - Raw date values:', {
                  acquired: item.acquired || item.Acquired || 'not provided',
                  soldDate: item.soldDate || item.SoldDate || 'not provided',
                });
                
                // Debug logging for parsing
                console.log('CSV IMPORT DEBUG - Parsed date values:', {
                  acquired: newItem.acquired instanceof Date 
                    ? `Valid Date: ${newItem.acquired.toISOString()}` 
                    : `Invalid Date: ${String(newItem.acquired)}`,
                  soldDate: newItem.soldDate instanceof Date 
                    ? `Valid Date: ${newItem.soldDate.toISOString()}` 
                    : newItem.soldDate === null
                      ? 'null (not provided)' 
                      : `Invalid Date: ${String(newItem.soldDate)}`
                });
                
                // Debug logging for numeric values
                console.log('CSV IMPORT DEBUG - Numeric value parsing:', {
                  year: {
                    raw: item.year || item.Year || 'not provided',
                    parsed: newItem.year,
                    type: typeof newItem.year
                  },
                  cost: {
                    raw: item.cost || item.Cost || 'not provided',
                    parsed: newItem.cost,
                    type: typeof newItem.cost
                  },
                  value: {
                    raw: item.value || item.Value || 'not provided',
                    parsed: newItem.value,
                    type: typeof newItem.value
                  }
                });

                console.log('CSV IMPORT DEBUG - Full prepared item:', { 
                  ...newItem, 
                  userId: newItem.userId ? "present" : "missing",
                  acquired: newItem.acquired.toISOString(),
                  soldDate: newItem.soldDate ? newItem.soldDate.toISOString() : null
                });
                
                setCurrentStatus(`Saving item: ${newItem.name}...`);
                
                // Call the handler to add the item
                const addResult = await onAddItem(newItem);
                
                if (addResult) {
                  console.log(`CSV IMPORT DEBUG - Successfully imported row ${i+1}: ${newItem.name}`);
                  successCount++;
                } else {
                  console.error(`CSV IMPORT DEBUG - Failed to import row ${i+1}: ${newItem.name}`);
                  errors.push({
                    rowIndex,
                    rowData: item,
                    error: 'Failed to save item to database'
                  });
                  setImportSummary(prev => ({
                    ...prev,
                    errorCount: prev.errorCount + 1
                  }));
                }
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`Error importing item at row ${rowIndex}:`, errorMessage, 'Item data:', item);
                
                errors.push({
                  rowIndex,
                  rowData: item,
                  error: errorMessage
                });
                
                setImportSummary(prev => ({
                  ...prev,
                  errorCount: prev.errorCount + 1
                }));
              }
              
              // Update progress
              setImportSummary(prev => ({
                ...prev,
                successCount
              }));
            }
            
            // Process next chunk if we haven't completed all items
            if (endIndex < csvData.length) {
              debugLog(`Scheduling next chunk processing with ${endIndex} of ${csvData.length} items processed`);
              // Use a short timeout to allow DOM to update
              setTimeout(() => {
                processInChunks(endIndex);
              }, 10);
            } else {
              // All items processed
              debugLog(`All items processed, completing import`);
              // Set final progress
              updateProgress(100);
              
              setCurrentStatus('Import completed');
              // Only set isImporting to false AFTER we've completed everything
              setTimeout(() => {
                setIsImporting(false);
                setImportSummary(prev => ({
                  ...prev,
                  completed: true
                }));
                
                toast({
                  title: "CSV Import Completed",
                  description: `Successfully imported ${successCount} of ${csvData.length} items.`,
                  variant: errors.length > 0 ? "default" : "default",
                });
              }, 500); // Give the progress bar a moment to show 100%
            }
          };
          
          // Start processing in chunks
          debugLog('Starting chunk processing');
          processInChunks(0);
        },
        error: (error: Error) => {
          console.error('CSV Parse Error:', error)
          setCurrentStatus('Error parsing CSV')
          setImportErrors([{
            rowIndex: -1,
            rowData: {} as CSVItem,
            error: `CSV Parse Error: ${error.message}`
          }])
          setImportSummary({
            totalRecords: 0,
            successCount: 0,
            errorCount: 1,
            completed: true
          })
          
          toast({
            title: "CSV Import Error",
            description: "There was an error parsing the CSV file. Please check the file format and try again.",
            variant: "destructive",
          })
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('File reading error:', error)
      
      setCurrentStatus('Error reading file')
      setImportErrors([{
        rowIndex: -1,
        rowData: {} as CSVItem,
        error: errorMessage
      }])
      setImportSummary({
        totalRecords: 0,
        successCount: 0,
        errorCount: 1,
        completed: true
      })
      
      toast({
        title: "File Reading Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      // Don't set isImporting to false here - we'll do it when processing completes
      // Just reset the file input
      if (csvInputRef.current) {
        csvInputRef.current.value = ''
      }
    }
  }
  
  // Function to download error report as CSV
  const downloadErrorReport = useCallback(() => {
    if (importErrors.length === 0) return
    
    const errorRows = importErrors.map(err => ({
      Row: err.rowIndex,
      Name: err.rowData.name || '',
      Error: err.error
    }))
    
    const csv = Papa.unparse(errorRows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `import-errors-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [importErrors])

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Import Collection Items
        </CardTitle>
        <CardDescription>
          Import your collection items from a CSV file
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
            
            <Button
              onClick={() => csvInputRef.current?.click()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
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
          </div>
          
          {/* Progress indicator */}
          {isImporting && (
            <div className="space-y-2 border p-3 rounded-md bg-slate-50">
              <div className="flex justify-between text-sm font-medium">
                <span>{currentStatus}</span>
                {importSummary.totalRecords > 0 && (
                  <span>
                    {importSummary.successCount}/{importSummary.totalRecords} items
                  </span>
                )}
              </div>
              
              {/* Use a single, simpler progress bar with inline styles for maximum compatibility */}
              <div className="w-full h-4 bg-gray-200 rounded-md overflow-hidden relative" ref={progressBarRef}>
                <div 
                  className="h-full bg-blue-500 transition-all duration-100 ease-linear absolute left-0 top-0"
                  style={{ 
                    width: `${progress}%`,
                    transition: "width 100ms linear"
                  }}
                  data-testid="fallback-progress"
                />
                
                {/* Add a striped animation for visual feedback that it's working */}
                <div 
                  className="h-full absolute left-0 top-0 bg-stripes"
                  style={{ 
                    width: `${progress}%`,
                    backgroundSize: "20px 20px",
                    backgroundImage: "linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)",
                    animation: "stripe-animation 1s linear infinite",
                  }}
                />
              </div>
              
              <style jsx>{`
                @keyframes stripe-animation {
                  0% { background-position: 0 0; }
                  100% { background-position: 20px 0; }
                }
              `}</style>
              
              {/* Debug information */}
              <div className="text-xs text-slate-500 pt-1 flex justify-between">
                <span>Progress: {progress}%</span>
                <span>Items processed: {Math.floor((progress - 20) * importSummary.totalRecords / 80) || 0}</span>
              </div>
            </div>
          )}
          
          {/* Show a separate completion summary when done */}
          {importSummary.completed && !isImporting && (
            <div className="mt-4">
              {importSummary.errorCount > 0 ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Import completed with errors</AlertTitle>
                  <AlertDescription>
                    {importSummary.successCount} items were imported successfully. 
                    {importSummary.errorCount} items failed to import.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="default" className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertTitle>Import completed successfully</AlertTitle>
                  <AlertDescription>
                    All {importSummary.successCount} items were imported successfully.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          {/* Error details */}
          {importErrors.length > 0 && (
            <Collapsible
              open={showErrors}
              onOpenChange={setShowErrors}
              className="mt-4 border rounded-md overflow-hidden"
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="flex w-full justify-between p-4">
                  <div className="flex items-center">
                    <FileWarning className="h-4 w-4 mr-2 text-red-500" />
                    <span>Show {importErrors.length} error{importErrors.length > 1 ? 's' : ''}</span>
                  </div>
                  <span>{showErrors ? '▲' : '▼'}</span>
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <ScrollArea className="h-[200px] p-4 border-t">
                  <div className="space-y-2">
                    {importErrors.map((error, index) => (
                      <div key={index} className="p-2 border rounded-md bg-red-50">
                        <div className="flex justify-between">
                          <span className="font-medium">
                            {error.rowIndex > 0 ? `Row ${error.rowIndex}` : 'File Error'}
                          </span>
                          {error.rowData.name && (
                            <span className="text-sm text-gray-500">Item: {error.rowData.name}</span>
                          )}
                        </div>
                        <p className="text-sm text-red-600">{error.error}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="p-4 border-t bg-gray-50">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={downloadErrorReport}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Error Report
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 