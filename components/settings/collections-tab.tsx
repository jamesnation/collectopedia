"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CSVImport } from "@/components/settings/csv-import"
import { CSVExport } from "@/components/settings/csv-export"
import { DeleteUserData } from "@/components/settings/delete-user-data"
import { itemTypeEnum, franchiseEnum } from "@/db/schema/items-schema"
import { useCatalogItems } from "@/components/catalog/hooks/use-catalog-items"
import { CatalogItem } from "@/components/catalog/utils/schema-adapter"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@clerk/nextjs"

// Define default brands (assuming this is what was in constants)
const DEFAULT_BRANDS = [
  'Hasbro',
  'Toyworld',
  'Mattel',
  'Playmates',
  'Sunbrow',
  'Kenner',
  'Mirage Studios',
  'Filmation',
  'Neca',
  'Super7',
  'Takara',
  'Games Workshop',
  'Senate',
  'Other',
  'Medium',
  'Dead X',
  'WWF'
]

export function CollectionsTab() {
  // Initialize the catalog items hook to get access to addItem
  const { addItem } = useCatalogItems();
  const { toast } = useToast();
  const { userId } = useAuth();
  
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
        description: "Starting refresh using AI Vision. This may take a while...",
        duration: 3000,
      });
      
      // Use the enhanced function that includes image-based search
      const { refreshAllItemPricesEnhanced } = await import('@/actions/ebay-actions');
      
      if (!userId) {
        throw new Error("User ID is required to refresh prices");
      }
      
      const result = await refreshAllItemPricesEnhanced(userId);
      
      if (result.success) {
        // Set progress to 100% since it's complete
        setRefreshProgress(100);
        setRefreshStats({
          processed: result.totalUpdated,
          successful: result.totalUpdated,
          failed: 0,
          total: result.totalUpdated
        });
        
        // Show a success toast
        toast({
          title: "Refresh Complete",
          description: `Successfully updated ${result.totalUpdated} items using AI Vision.`,
          duration: 5000,
        });
      } else {
        throw new Error(result.error || "An unknown error occurred");
      }
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
      {/* AI Vision Price Refresh Card */}
      <Card className="border shadow-sm dark:bg-card/60 dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-purple-500" />
            AI Vision Price Refresh
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Refresh all eBay values using AI Vision technology
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              AI Vision analyzes both the images and titles of your items to find the most accurate prices on eBay.
              Use this button to refresh all values at once.
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
                Refresh All Prices with AI Vision
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Import/Export Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        
        <CSVExport />
      </div>
      
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