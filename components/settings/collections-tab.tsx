"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CSVImport } from "@/components/settings/csv-import"
import { DeleteUserData } from "@/components/settings/delete-user-data"
import { itemTypeEnum, franchiseEnum } from "@/db/schema/items-schema"
import { useCatalogItems } from "@/components/catalog/hooks/use-catalog-items"
import { CatalogItem } from "@/components/catalog/utils/schema-adapter"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

// Define default brands (assuming this is what was in constants)
const DEFAULT_BRANDS = [
  "Funko",
  "LEGO",
  "Hasbro",
  "Mattel",
  "Bandai",
  "Hot Toys",
  "McFarlane Toys",
  "Mezco",
  "NECA",
  "Good Smile Company",
  "Sideshow Collectibles"
]

export function CollectionsTab() {
  // Initialize the catalog items hook to get access to addItem
  const { addItem } = useCatalogItems();
  const { toast } = useToast();
  
  // State for tracking refresh progress
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [refreshStats, setRefreshStats] = useState<{
    processed: number;
    successful: number;
    failed: number;
    total: number;
  }>({
    processed: 0,
    successful: 0,
    failed: 0,
    total: 0
  });

  const handleAddItem = async (item: Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log("Adding item from CSV", item.name);
    try {
      // Actually call the hook method to save to database
      const result = await addItem(item);
      console.log("Database save result:", result);
      return result;
    } catch (error) {
      console.error("Error saving item to database:", error);
      return false;
    }
  }

  const handleCreateCustomType = async () => {
    console.log("Creating custom type from CSV")
    return true
  }

  const handleCreateCustomFranchise = async () => {
    console.log("Creating custom franchise from CSV")
    return true
  }

  const handleCreateCustomBrand = async () => {
    console.log("Creating custom brand from CSV")
    return true
  }

  const loadCustomTypes = async () => {
    console.log("Loading custom types")
    return []
  }

  const loadCustomFranchises = async () => {
    console.log("Loading custom franchises")
    return []
  }

  const loadCustomBrands = async () => {
    console.log("Loading custom brands")
    return []
  }

  // Function to trigger eBay value refresh for all items
  const refreshAllEbayValues = async () => {
    setIsRefreshing(true);
    setRefreshProgress(0);
    setRefreshStats({
      processed: 0,
      successful: 0,
      failed: 0,
      total: 0
    });
    
    try {
      // Show a toast to indicate the refresh has started
      toast({
        title: "Refreshing eBay Values",
        description: "Starting refresh of all eBay values. This may take a while...",
        duration: 3000,
      });
      
      // Process items in batches
      const batchSize = 10; // Process 10 items at a time
      let currentOffset = 0; // Start with offset 0
      let remainingItems = 1; // Start with 1 to enter the loop
      let totalProcessedSoFar = 0;
      let totalSuccessfulSoFar = 0;
      let totalFailedSoFar = 0;
      let maxIterations = 50; // Safety limit for iterations
      let currentIteration = 0;
      
      console.log("[Refresh] Starting refresh process with batch size:", batchSize);
      
      // Keep processing batches until there are no more items
      while (remainingItems > 0 && currentIteration < maxIterations) {
        currentIteration++;
        console.log(`[Refresh] Starting iteration ${currentIteration}, processed so far: ${totalProcessedSoFar}, offset: ${currentOffset}`);
        
        // Set a timeout for the fetch operation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
        
        try {
          console.log(`[Refresh] Sending batch request #${currentIteration} with offset ${currentOffset}`);
          const response = await fetch('/api/ebay-updates/bulk-refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              batchSize,
              offset: currentOffset 
            }),
            signal: controller.signal
          });
          
          // Clear timeout since request completed
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Error refreshing eBay values: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log(`[Refresh] Batch response:`, {
            totalProcessed: data.results.totalProcessed,
            successfulUpdates: data.results.successfulUpdates,
            failedUpdates: data.results.failedUpdates,
            remainingItems: data.results.remainingItems,
            totalItems: data.results.totalItems,
            nextOffset: data.results.nextOffset
          });
          
          // Update progress based on the batch result
          remainingItems = data.results.remainingItems;
          const totalItems = data.results.totalItems;
          
          // Get the next offset for the next batch
          currentOffset = data.results.nextOffset;
          
          // Add the current batch to our running totals
          totalProcessedSoFar += data.results.totalProcessed;
          totalSuccessfulSoFar += data.results.successfulUpdates;
          totalFailedSoFar += data.results.failedUpdates;
          
          console.log(`[Refresh] Running totals: processed=${totalProcessedSoFar}, successful=${totalSuccessfulSoFar}, failed=${totalFailedSoFar}`);
          
          // Validate that we're not exceeding total items
          if (totalProcessedSoFar > totalItems) {
            console.error(`[Refresh] ERROR: Total processed (${totalProcessedSoFar}) would exceed total items (${totalItems})`);
            console.error(`[Refresh] This suggests a counting error in either the frontend or API`);
            
            // Cap the total processed at the total items
            totalProcessedSoFar = Math.min(totalItems, totalProcessedSoFar);
            console.log(`[Refresh] Capping totalProcessed at ${totalProcessedSoFar}`);
          }
          
          // Update progress state
          setRefreshStats(prev => {
            const newStats = {
              processed: totalProcessedSoFar,
              successful: totalSuccessfulSoFar,
              failed: totalFailedSoFar,
              total: totalItems
            };
            console.log(`[Refresh] New stats:`, newStats);
            return newStats;
          });
          
          // Calculate progress percentage
          const progressPercentage = totalItems > 0 
            ? Math.min(100, (totalProcessedSoFar / totalItems) * 100) 
            : 100;
          
          console.log(`[Refresh] Progress percentage: ${progressPercentage}%`);
          setRefreshProgress(progressPercentage);
          
          // Show progress in a toast
          toast({
            title: "Refresh in Progress",
            description: `Processed ${totalProcessedSoFar} of ${totalItems} items`,
            duration: 2000,
          });
        } catch (error) {
          clearTimeout(timeoutId);
          console.error(`[Refresh] Error during batch #${currentIteration}:`, error);
          
          if (error instanceof DOMException && error.name === 'AbortError') {
            toast({
              title: "Operation Timeout",
              description: "A request took too long to complete. The refresh operation has been stopped.",
              variant: "destructive",
              duration: 5000,
            });
            break;
          } else {
            // Re-throw for the outer catch block
            throw error;
          }
        }
      }
      
      // Show a success toast
      toast({
        title: "Refresh Complete",
        description: `Successfully updated ${totalSuccessfulSoFar} items. Failed to update ${totalFailedSoFar} items.`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Error refreshing eBay values:', error);
      toast({
        title: "Error Refreshing Values",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Estimate Refresh Card */}
      <Card className="border shadow-sm dark:bg-card/60 dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-purple-500" />
            AI Estimate Refresh
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Manually refresh all eBay values for your collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              AI Estimates (eBay values) are normally updated automatically when you browse your collection. 
              Use this button to refresh all values immediately.
            </p>
            
            {isRefreshing ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Refreshing items...</span>
                  <span>{Math.round(refreshProgress)}%</span>
                </div>
                <Progress value={refreshProgress} className="h-2" />
                <div className="text-xs text-muted-foreground mt-2">
                  Processed {refreshStats.processed} of {refreshStats.total} items
                  ({refreshStats.successful} successful, {refreshStats.failed} failed)
                </div>
              </div>
            ) : (
              <Button 
                onClick={refreshAllEbayValues}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh All AI Estimates
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <CSVImport
        onAddItem={handleAddItem}
        onCreateCustomType={handleCreateCustomType}
        onCreateCustomFranchise={handleCreateCustomFranchise}
        onCreateCustomBrand={handleCreateCustomBrand}
        onLoadCustomTypes={loadCustomTypes}
        onLoadCustomFranchises={loadCustomFranchises}
        onLoadCustomBrands={loadCustomBrands}
        defaultTypeOptions={itemTypeEnum.enumValues}
        defaultFranchiseOptions={franchiseEnum.enumValues}
        defaultBrandOptions={DEFAULT_BRANDS}
      />
      
      <Card className="border shadow-sm dark:bg-card/60 dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Actions that will permanently affect your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteUserData />
        </CardContent>
      </Card>
    </div>
  )
} 