"use client";

/**
 * components/item-details/item-details-page.tsx
 * 
 * This component is the main container for the item details page.
 * It combines all the sub-components and manages shared state.
 * Updated to match the original layout with gallery on left, details on right.
 * Fixed notes editing to maintain popover open while typing.
 * Fixed image display and upload functionality.
 * Added eBay Image Search Debug Panel functionality.
 * Fixed infinite rendering loop by using useCallback for data fetching functions.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ItemHeader, 
  ItemMetrics, 
  ProfitMetrics, 
  ItemDetailsCard, 
  ItemStatus, 
  SoldDetails 
} from "./item-info";
import { ImageCarousel } from "./image-gallery";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { ItemCondition } from "@/types/item-types";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import { useAuth } from "@clerk/nextjs";
import { useEbayDebugMode } from "@/hooks/use-ebay-debug-mode";
import { useRegionContext } from "@/contexts/region-context";
import { PlaceholderImage } from '@/components/ui/placeholder-image';
import Image from "next/image";

// Dynamically import the ImageUpload component to prevent SSR issues
const DynamicImageUpload = dynamic(() => import("@/components/image-upload"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  ),
});

// Type for image data
interface ImageType {
  id: string;
  url: string;
  alt?: string;
  itemId: string;
  userId: string;
  order?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// This is a mock type for the item, you would replace this with your actual item type
interface Item {
  id: string;
  name: string;
  type: string;
  franchise: string;
  brand: string;
  year: number | null;
  condition: ItemCondition;
  acquired: Date | null;
  notes: string | null;
  cost: number;
  value: number;
  soldPrice: number | null;
  soldDate: Date | null;
  isSold: boolean;
  ebayListed: number | null;
  images: { id: string; url: string; alt?: string }[];
}

// Mock history event type
interface HistoryEvent {
  id: string;
  type: 'created' | 'updated' | 'priceChange' | 'sold' | 'purchased' | 'statusChange';
  timestamp: string;
  details: {
    field?: string;
    oldValue?: string | number | null;
    newValue?: string | number | null;
    price?: number;
    note?: string;
  };
}

// Mock options for dropdowns
const TYPE_OPTIONS = ["Action Figure", "Plush", "Building Set", "Vehicle", "Statue", "Other"];
const FRANCHISE_OPTIONS = [
  { value: "starWars", label: "Star Wars" },
  { value: "marvel", label: "Marvel" },
  { value: "dc", label: "DC Comics" },
  { value: "nintendo", label: "Nintendo" },
  { value: "pokemon", label: "Pokémon" },
  { value: "other", label: "Other" }
];
const BRAND_OPTIONS = [
  { value: "hasbro", label: "Hasbro" },
  { value: "mattel", label: "Mattel" },
  { value: "lego", label: "LEGO" },
  { value: "funko", label: "Funko" },
  { value: "hottoys", label: "Hot Toys" },
  { value: "bandai", label: "Bandai" },
  { value: "other", label: "Other" }
];
const YEAR_OPTIONS = Array.from({ length: 50 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year.toString(), label: year.toString() };
});
const CONDITION_OPTIONS: ItemCondition[] = ["New", "Used"];

interface ItemDetailsPageProps {
  itemId: string;
  loadItem: (id: string) => Promise<Item>;
  updateItem: (id: string, data: Partial<Item>) => Promise<Item>;
  deleteItem: (id: string) => Promise<void>;
  loadHistoryEvents: (id: string) => Promise<HistoryEvent[]>;
  refreshAiPrice: (id: string) => Promise<number | null>;
}

export function ItemDetailsPage({
  itemId,
  loadItem,
  updateItem,
  deleteItem,
  loadHistoryEvents,
  refreshAiPrice
}: ItemDetailsPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { userId } = useAuth();
  const { isDebugMode, isInitialized } = useEbayDebugMode();
  const { region, formatCurrency } = useRegionContext();
  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingField, setIsEditingField] = useState<string | null>(null);
  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>([]);
  const [historyIsLoading, setHistoryIsLoading] = useState(false);
  const [isLoadingAiPrice, setIsLoadingAiPrice] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  
  // Dialog state for image upload
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
  
  // Additional states for sold functionality
  const [showSoldDetails, setShowSoldDetails] = useState(false);
  const [tempSoldPrice, setTempSoldPrice] = useState<string>("");
  const [tempSoldDate, setTempSoldDate] = useState<string>("");
  
  // Temporary state for notes editing
  const [tempNotes, setTempNotes] = useState<string>("");
  
  // Separate state for images
  const [images, setImages] = useState<ImageType[]>([]);
  const [imageLoading, setImageLoading] = useState(true);
  
  // Fields for the details tab
  const detailFields = item ? {
    type: item.type,
    franchise: item.franchise,
    brand: item.brand,
    year: item.year,
    condition: item.condition,
    acquired: item.acquired
  } : {};
  
  // Define item fields that can be edited
  const editableFields = ['type', 'franchise', 'brand', 'year', 'condition', 'cost', 'acquired'];
  const initialSoldData = item ? {
    soldPrice: item.soldPrice,
    soldDate: item.soldDate,
    isSold: item.isSold,
    acquired: item.acquired
  } : {};
  
  // Fetch item data from the server
  const fetchItemData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await loadItem(itemId);
      setItem(data);
    } catch (error) {
      console.error("Error loading item:", error);
      setError("Failed to load item. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [itemId, loadItem]);
  
  // Fetch images for the item
  const fetchImages = useCallback(async () => {
    if (!item) return;
    
    setImageLoading(true);
    try {
      // Simulate fetching images - in a real app, this would be an API call
      // Here we're just using the images already on the item for demonstration
      if (item.images && item.images.length > 0) {
        // Convert to ImageType[] with required properties
        const convertedImages: ImageType[] = item.images.map(img => ({
          id: img.id,
          url: img.url,
          alt: img.alt || `${item.name} image`,
          itemId: item.id,
          userId: 'current-user' // Placeholder, would normally be the actual user ID
        }));
        setImages(convertedImages);
      } else {
        setImages([]);
      }
    } catch (error) {
      console.error("Error loading images:", error);
    } finally {
      setImageLoading(false);
    }
  }, [item]);
  
  // Fetch history events for the item
  const fetchHistoryEvents = useCallback(async () => {
    if (!item) return;
    
    setHistoryIsLoading(true);
    try {
      const events = await loadHistoryEvents(item.id);
      setHistoryEvents(events);
    } catch (error) {
      console.error("Error loading history events:", error);
    } finally {
      setHistoryIsLoading(false);
    }
  }, [item, loadHistoryEvents]);
  
  // Load item data on initial render
  useEffect(() => {
    fetchItemData();
  }, [fetchItemData]);
  
  // Load images separately when item changes
  useEffect(() => {
    if (item) {
      fetchImages();
    }
  }, [fetchImages, item]);
  
  // Load history events on item change
  useEffect(() => {
    if (item) {
      fetchHistoryEvents();
    }
  }, [fetchHistoryEvents, item]);
  
  // Initialize temporary sold data when item changes
  useEffect(() => {
    if (item) {
      setTempSoldPrice(item.soldPrice !== null ? item.soldPrice.toString() : "");
      setTempSoldDate(item.soldDate ? new Date(item.soldDate).toISOString().split('T')[0] : "");
    }
  }, [item]);
  
  // Handle starting edit mode for a field
  const handleEditStart = (field: string) => {
    setIsEditingField(field);
    
    // Initialize temporary states when editing starts
    if (field === "notes" && item) {
      setTempNotes(item.notes || "");
    }
  };
  
  // Handle canceling edit mode
  const handleEditCancel = () => {
    setIsEditingField(null);
  };
  
  // Handle updating a field
  const handleUpdateField = async (field: string, value: any) => {
    if (!item) return;
    
    try {
      const updatedItem = await updateItem(item.id, { [field]: value });
      setItem(updatedItem);
      setIsEditingField(null);
      
      // Refresh history events after update
      await fetchHistoryEvents();
      
      toast({
        title: "Success",
        description: `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully.`
      });
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      toast({
        title: "Error",
        description: `Failed to update ${field}. Please try again.`,
        variant: "destructive"
      });
    }
  };
  
  // Handle adding images
  const handleAddImages = async () => {
    if (!item) return;
    
    // Open the image upload dialog
    setIsImageUploadOpen(true);
  };
  
  // Handle image upload completion
  const handleImageUpload = async (url: string) => {
    if (!item || !userId) return;
    
    try {
      // Import the createImageAction dynamically to avoid server component issues
      const { createImageAction } = await import("@/actions/images-actions");
      
      // Create a new image entry
      const imageResult = await createImageAction({
        itemId: item.id,
        userId: userId,
        url,
      });
      
      if (imageResult.isSuccess && imageResult.data) {
        // Update both images state and item state
        const newImage = imageResult.data;
        
        setImages(prevImages => [...prevImages, newImage]);
        
        setItem(prevItem => {
          if (!prevItem) return null;
          
          return {
            ...prevItem,
            images: [...prevItem.images, {
              id: newImage.id,
              url: newImage.url,
              alt: `${prevItem.name} image ${prevItem.images.length + 1}`
            }]
          };
        });
        
        toast({
          title: "Success",
          description: "Image uploaded and added to the item successfully."
        });
      } else {
        throw new Error("Failed to create image entry");
      }
    } catch (err) {
      console.error("Error adding image:", err);
      toast({
        title: "Error",
        description: "Failed to add image. Please try again.",
        variant: "destructive"
      });
    } finally {
      // Close the upload dialog when done
      setIsImageUploadOpen(false);
    }
  };
  
  // Handle deleting an image
  const handleDeleteImage = async (imageId: string) => {
    if (!item) return;
    
    try {
      // Import the deleteImageAction dynamically to avoid server component issues
      const { deleteImageAction } = await import("@/actions/images-actions");
      
      const result = await deleteImageAction(imageId, item.id);
      
      if (result.isSuccess) {
        // Update both images state and item state
        setImages(prevImages => prevImages.filter(img => img.id !== imageId));
        
        setItem(prevItem => {
          if (!prevItem) return null;
          
          return {
            ...prevItem,
            images: prevItem.images.filter(img => img.id !== imageId)
          };
        });
        
        toast({
          title: "Success",
          description: "Image deleted successfully."
        });
      }
    } catch (err) {
      console.error("Error deleting image:", err);
      toast({
        title: "Error",
        description: "Failed to delete image. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle refreshing AI price
  const handleRefreshAiPrice = async () => {
    if (!item) return;
    
    setIsLoadingAiPrice(true);
    setDebugData(null); // Clear previous debug data
    
    try {
      // Get the current primary image URL
      let primaryImage: string | undefined;
      
      try {
        // Import the action dynamically to avoid server component issues
        const { getImagesByItemIdAction } = await import("@/actions/images-actions");
        const imagesResult = await getImagesByItemIdAction(itemId);
        
        if (imagesResult.isSuccess && imagesResult.data && imagesResult.data.length > 0) {
          primaryImage = imagesResult.data[0].url;
        } else {
          // Fallback to current images state if fetch fails
          primaryImage = images.length > 0 ? images[0].url : undefined;
        }
      } catch (error) {
        console.error("Error fetching latest images:", error);
        // Fallback to current images state
        primaryImage = images.length > 0 ? images[0].url : undefined;
      }
      
      // Log that we're refreshing with debug mode
      console.log('Refreshing AI price with debug mode:', { isDebugMode, isInitialized });
      
      // Check if debug mode should be used
      const shouldUseDebugMode = isDebugMode && isInitialized;
      
      // Use the enhanced pricing function that combines text and image search
      // Import the action dynamically to avoid server component issues
      const { getEnhancedEbayPrices } = await import('@/actions/ebay-actions');
      
      const result = await getEnhancedEbayPrices(
        {
          title: item.name,
          image: primaryImage,
          condition: item.condition,
          franchise: item.franchise,
          region: region
        }, 
        shouldUseDebugMode // Explicitly pass the debug mode
      );
      
      console.log('AI price refresh result:', { 
        hasTextBased: !!result.textBased,
        hasImageBased: !!result.imageBased,
        hasCombined: !!result.combined,
        hasDebugData: !!result.debugData,
        debugModeStatus: { isDebugMode, isInitialized, shouldUseDebugMode }
      });
      
      // Store debug data if available
      if (shouldUseDebugMode && result.debugData) {
        console.log('Setting debug data', result.debugData);
        setDebugData(result.debugData);
      }
      
      // Get the new price and update item
      const newPrice = await refreshAiPrice(item.id);
      
      if (newPrice !== null) {
        setItem({
          ...item,
          ebayListed: newPrice
        });
        
        toast({
          title: "Success",
          description: "AI price estimate updated successfully."
        });
      } else {
        throw new Error("Failed to get new price estimate");
      }
    } catch (err) {
      console.error("Error refreshing AI price:", err);
      toast({
        title: "Error",
        description: "Failed to update AI price estimate. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAiPrice(false);
    }
  };
  
  // Handle toggling sold status
  const handleToggleSold = async (checked: boolean) => {
    if (!item) return;
    
    if (checked && !item.soldPrice && !item.soldDate) {
      // If item is being marked as sold but doesn't have sold details
      setShowSoldDetails(true);
      try {
        await updateItem(item.id, { isSold: true });
        setItem({ ...item, isSold: true });
      } catch (err) {
        console.error("Failed to update sold status:", err);
        toast({
          title: "Error",
          description: "Failed to update sold status. Please try again.",
          variant: "destructive"
        });
        setShowSoldDetails(false);
      }
    } else {
      // Just toggle the sold status
      try {
        const updatedItem = await updateItem(item.id, { 
          isSold: checked
        });
        setItem(updatedItem);
        setShowSoldDetails(false);
        
        // Refresh history events
        const events = await loadHistoryEvents(itemId);
        setHistoryEvents(events);
        
        toast({
          title: "Success",
          description: `Item marked as ${checked ? "sold" : "unsold"}.`
        });
      } catch (err) {
        console.error("Failed to update sold status:", err);
        toast({
          title: "Error",
          description: "Failed to update sold status. Please try again.",
          variant: "destructive"
        });
      }
    }
  };
  
  // Handle saving sold details
  const handleSaveSoldDetails = async () => {
    if (!item) return;
    
    try {
      const updatedItem = await updateItem(item.id, {
        soldPrice: tempSoldPrice ? parseFloat(tempSoldPrice) : null,
        soldDate: tempSoldDate ? new Date(tempSoldDate) : null
      });
      
      setItem(updatedItem);
      setShowSoldDetails(false);
      
      // Refresh history events
      const events = await loadHistoryEvents(itemId);
      setHistoryEvents(events);
      
      toast({
        title: "Success",
        description: "Sold details saved successfully."
      });
    } catch (err) {
      console.error("Failed to save sold details:", err);
      toast({
        title: "Error",
        description: "Failed to save sold details. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle deleting the item
  const handleDeleteItem = async () => {
    if (!item) return;
    
    try {
      await deleteItem(item.id);
      
      toast({
        title: "Success",
        description: "Item deleted successfully."
      });
      
      // Redirect back to collection
      router.push("/my-collection");
    } catch (err) {
      console.error("Error deleting item:", err);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Render eBay Debug Panel
  const renderDebugInfo = () => {
    // Add console log to check debug status
    console.log('Debug Mode Status:', { 
      isDebugMode, 
      isInitialized,
      hasDebugData: !!debugData,
      shouldShowDebugPanel: isDebugMode && isInitialized 
    });
    
    // Only show debug panel if debug mode is enabled and initialized
    if (!isDebugMode || !isInitialized) return null;
    
    if (!debugData) {
      return (
        <Card className="mt-4 border border-dashed border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              eBay Image Search Debug Mode
            </CardTitle>
            <CardDescription className="text-xs text-yellow-600 dark:text-yellow-500">
              No debug data available. Try clicking Refresh on the AI Price card.
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }
    
    // Add detailed logging about the debug data structure
    console.log('Debug Data Structure:', {
      fullObject: debugData,
      textBased: debugData.textBased,
      imageBased: debugData.imageBased,
      combined: debugData.combined,
      hasTextBasedMedian: debugData.textBased?.median !== undefined,
      hasImageBasedMedian: debugData.imageBased?.median !== undefined,
      hasCombinedMedian: debugData.combined?.median !== undefined,
    });
    
    // Extract price data for easier access
    let textBasedPrice = debugData.textBased?.median;
    let imageBasedPrice = debugData.imageBased?.median;
    let combinedPrice = debugData.combined?.median;
    
    // Helper function to extract prices from matches array
    const extractPricesFromMatches = (matches: any[]) => {
      if (!matches || !Array.isArray(matches) || matches.length === 0) return null;
      
      const prices = matches
        .map((match: any) => {
          if (typeof match.price === 'object' && match.price?.value) {
            return parseFloat(match.price.value);
          } else if (typeof match.price === 'number') {
            return match.price;
          }
          return null;
        })
        .filter((price: any) => price !== null && !isNaN(price));
      
      if (prices.length === 0) return null;
      
      // Calculate median
      prices.sort((a: number, b: number) => a - b);
      const mid = Math.floor(prices.length / 2);
      return prices.length % 2 === 0 
        ? (prices[mid - 1] + prices[mid]) / 2 
        : prices[mid];
    };
    
    // If medians aren't available, try to calculate them from the matches
    if (textBasedPrice === undefined && debugData.textMatches) {
      textBasedPrice = extractPricesFromMatches(debugData.textMatches);
      console.log('Calculated text median from matches:', textBasedPrice);
    }
    
    if (imageBasedPrice === undefined && debugData.imageMatches) {
      imageBasedPrice = extractPricesFromMatches(debugData.imageMatches);
      console.log('Calculated image median from matches:', imageBasedPrice);
    }
    
    // Get the finalPrice directly from debugData if available
    const finalPrice = debugData.finalPrice || debugData.price;
    
    // Fix: Update priority order to correctly prioritize image-based over text-based results
    // Determine which price was chosen and why
    const selectedPrice = imageBasedPrice || textBasedPrice || combinedPrice || finalPrice;
    let selectedMethod = imageBasedPrice 
      ? 'image search' 
      : textBasedPrice
        ? 'text search'
        : combinedPrice
          ? 'combined text+image search'
          : 'direct price calculation';
    
    const roundedPrice = selectedPrice ? Math.round(selectedPrice) : null;
    
    return (
      <Card className="mt-4 border border-dashed border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
            eBay Image Search Debug Mode
          </CardTitle>
          <CardDescription className="text-xs text-yellow-600 dark:text-yellow-500">
            Showing matches used for AI price estimation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Display the actual AI price that was applied */}
            {item?.ebayListed && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
                <h4 className="text-sm font-semibold mb-2 text-green-800 dark:text-green-300">
                  Applied AI Price Estimate
                </h4>
                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-green-200 dark:border-green-700">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Current Value</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(item.ebayListed)}
                  </div>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  This is the final AI price estimate that was saved to your item.
                </p>
              </div>
            )}
            
            {/* Price Calculation Summary - New section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <h4 className="text-sm font-semibold mb-2 text-blue-800 dark:text-blue-300">
                Price Calculation Summary
              </h4>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Image-Based Median</div>
                  <div className="text-sm font-bold">
                    {imageBasedPrice !== undefined && imageBasedPrice !== null 
                      ? formatCurrency(imageBasedPrice)
                      : 'Not available'}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Text-Based Median</div>
                  <div className="text-sm font-bold">
                    {textBasedPrice !== undefined && textBasedPrice !== null 
                      ? formatCurrency(textBasedPrice)
                      : 'Not available'}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Combined Median</div>
                  <div className="text-sm font-bold">
                    {combinedPrice !== undefined && combinedPrice !== null 
                      ? formatCurrency(combinedPrice)
                      : 'Not available'}
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 mb-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Final Calculation</div>
                <div className="mt-1 text-xs">
                  <p><span className="font-medium">1. Priority Order:</span> Image-Based {'->'} Text-Based {'->'} Combined</p>
                  <p>
                    <span className="font-medium">2. Selected Price:</span> {selectedPrice !== null && selectedPrice !== undefined 
                      ? `${formatCurrency(selectedPrice)} (${selectedMethod})`
                      : 'No valid price found'}
                  </p>
                  {selectedPrice !== null && selectedPrice !== undefined && (
                    <p>
                      <span className="font-medium">3. Rounded Final Price:</span> {roundedPrice !== null 
                        ? formatCurrency(roundedPrice)
                        : 'N/A'} {roundedPrice !== selectedPrice ? `(rounded from ${formatCurrency(selectedPrice)})` : ''}
                    </p>
                  )}
                  
                  {/* Add a special note when individual medians aren't available but final price is */}
                  {(!textBasedPrice && !imageBasedPrice && !combinedPrice) && selectedPrice && (
                    <p className="mt-2 text-amber-600 dark:text-amber-400 font-medium">
                      Note: Individual price medians aren&apos;t available, but a final price was calculated.
                      This likely means the pricing algorithm used a direct method or alternative data source.
                    </p>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <p>
                  <span className="font-medium">Search Query:</span> {debugData.searchParams 
                    ? `"${debugData.searchParams.title}${debugData.searchParams.franchise 
                        ? ` (${debugData.searchParams.franchise})` : ''}" with condition "${debugData.searchParams.condition || 'Any'}"`
                    : 'N/A'}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Results Count:</span> {debugData.textMatches?.length || 0} text-based, {debugData.imageMatches?.length || 0} image-based
                </p>
                {debugData.imageSearchDetails?.titleFilterWords && (
                  <p className="mt-1">
                    <span className="font-medium">Title Filter Words:</span> {debugData.imageSearchDetails.titleFilterWords.join(', ')}
                  </p>
                )}
                
                {/* Add collapsible raw data structure for debugging */}
                <div className="mt-3 border-t pt-2 border-gray-200 dark:border-gray-700">
                  <details className="text-xs">
                    <summary className="cursor-pointer text-blue-600 dark:text-blue-400 font-medium">
                      Show Raw Debug Data Structure (for diagnostics)
                    </summary>
                    <div className="mt-2 p-2 bg-black text-white rounded overflow-auto max-h-60">
                      <pre className="text-xs">
                        {JSON.stringify({
                          dataKeys: Object.keys(debugData),
                          hasTextBased: !!debugData.textBased,
                          textBasedKeys: debugData.textBased ? Object.keys(debugData.textBased) : [],
                          hasImageBased: !!debugData.imageBased,
                          imageBasedKeys: debugData.imageBased ? Object.keys(debugData.imageBased) : [],
                          hasCombined: !!debugData.combined,
                          combinedKeys: debugData.combined ? Object.keys(debugData.combined) : [],
                          hasTextMatches: !!debugData.textMatches && Array.isArray(debugData.textMatches),
                          textMatchesCount: debugData.textMatches?.length,
                          textMatchSample: debugData.textMatches?.length ? debugData.textMatches[0] : null,
                          hasImageMatches: !!debugData.imageMatches && Array.isArray(debugData.imageMatches),
                          imageMatchesCount: debugData.imageMatches?.length,
                          imageMatchSample: debugData.imageMatches?.length ? debugData.imageMatches[0] : null,
                        }, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              </div>
            </div>
            
            {/* Image-based matches */}
            {debugData.imageMatches && debugData.imageMatches.length > 0 ? (
              <div>
                <h4 className="text-xs font-semibold mb-2 text-blue-700 dark:text-blue-400">
                  Image + Title-based Matches ({debugData.imageMatches.length})
                </h4>
                
                {/* Debug output to see the raw data */}
                <div className="mb-2 p-2 bg-black text-white text-xs rounded overflow-auto max-h-40">
                  <pre>
                    {JSON.stringify(debugData.imageMatches[0], null, 2)}
                  </pre>
                  <div className="mt-2 text-yellow-400">^ First match of {debugData.imageMatches.length} total matches</div>
                  <div className="mt-1 text-blue-400">Searches now use both image and title for more accurate results</div>
                  <div className="mt-1 text-pink-400 font-semibold">Image-based results are now exclusively used when available</div>
                  {debugData.imageSearchDetails?.titleFilterWords && (
                    <div className="mt-1 text-green-400">
                      Title filtering applied with words: {debugData.imageSearchDetails.titleFilterWords.join(', ')}
                    </div>
                  )}
                  {debugData.imageSearchDetails?.originalResultCount && debugData.imageSearchDetails?.filteredResultCount && (
                    <div className="mt-1 text-purple-400">
                      Filtered from {debugData.imageSearchDetails.originalResultCount} to {debugData.imageSearchDetails.filteredResultCount} results
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {debugData.imageMatches.map((match: any) => (
                    <a 
                      key={match.id} 
                      href={match.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-square relative mb-1 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                        {match.image?.imageUrl ? (
                          <Image 
                            src={match.image.imageUrl} 
                            alt={match.title || 'Item image'} 
                            fill
                            className="object-contain"
                          />
                        ) : typeof match.image === 'string' ? (
                          <Image 
                            src={match.image} 
                            alt={match.title || 'Item image'} 
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <PlaceholderImage width={80} height={80} />
                          </div>
                        )}
                      </div>
                      <div className="text-xs truncate" title={match.title}>
                        {match.title}
                      </div>
                      <div className="text-xs font-semibold text-green-600 dark:text-green-400">
                        {typeof match.price === 'object' 
                          ? `${match.price?.currency || 'GBP'} ${match.price?.value || 'N/A'}`
                          : `GBP ${match.price || 'N/A'}`}
                      </div>
                      <div className="text-xs text-blue-500 flex items-center mt-1">
                        <ExternalLink className="h-3 w-3 mr-1" /> View on eBay
                      </div>
                      {match.relevanceScore && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Match: {Math.round(match.relevanceScore * 100)}%
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-yellow-600">No image-based matches found</p>
            )}
            
            {/* Text-based matches */}
            {debugData.textMatches && debugData.textMatches.length > 0 ? (
              <div>
                <h4 className="text-xs font-semibold mb-2 text-yellow-700 dark:text-yellow-400">
                  Text-based Matches ({debugData.textMatches.length})
                </h4>
                
                {/* Debug output to see the raw data */}
                <div className="mb-2 p-2 bg-black text-white text-xs rounded overflow-auto max-h-40">
                  <pre>
                    {JSON.stringify(debugData.textMatches[0], null, 2)}
                  </pre>
                  <div className="mt-2 text-yellow-400">^ First match of {debugData.textMatches.length} total matches</div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {debugData.textMatches.map((match: any) => (
                    <a 
                      key={match.id} 
                      href={match.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-square relative mb-1 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                        {match.image?.imageUrl ? (
                          <Image 
                            src={match.image.imageUrl} 
                            alt={match.title} 
                            fill
                            className="object-contain"
                          />
                        ) : typeof match.image === 'string' ? (
                          <Image 
                            src={match.image} 
                            alt={match.title} 
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <PlaceholderImage width={80} height={80} />
                          </div>
                        )}
                      </div>
                      <div className="text-xs truncate" title={match.title}>
                        {match.title}
                      </div>
                      <div className="text-xs font-semibold text-green-600 dark:text-green-400">
                        {typeof match.price === 'object' 
                          ? `${match.price?.currency || 'GBP'} ${match.price?.value || 'N/A'}`
                          : `GBP ${match.price || 'N/A'}`}
                      </div>
                      <div className="text-xs text-blue-500 flex items-center mt-1">
                        <ExternalLink className="h-3 w-3 mr-1" /> View on eBay
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-yellow-600">No text-based matches found</p>
            )}
            
            {/* Add debug info about what was passed to the API */}
            <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
              <h4 className="font-semibold mb-1">Request Details:</h4>
              <p>Title: {item?.name}</p>
              <p>Condition: {item?.condition}</p>
              <p>Primary Image: {images.length > 0 ? (
                <>
                  ✅ Available <br />
                  <span className="text-xs text-gray-500 break-all">{images[0]?.url}</span>
                </>
              ) : "❌ Not available"}</p>
              
              {/* Special section for image URL errors */}
              {debugData.imageSearchDetails?.error === 'Image processing error' && (
                <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded">
                  <p className="text-red-800 dark:text-red-200 font-semibold">❌ Image URL Error</p>
                  <p className="text-red-700 dark:text-red-300 break-all">{debugData.imageSearchDetails.message}</p>
                  {debugData.imageSearchDetails.imageUrl && (
                    <div className="mt-1">
                      <p className="text-xs font-semibold">Image URL (partial):</p>
                      <p className="text-xs text-red-600 dark:text-red-300 break-all">{debugData.imageSearchDetails.imageUrl}</p>
                    </div>
                  )}
                  <div className="mt-2">
                    <p className="text-xs font-semibold">Troubleshooting steps:</p>
                    <ol className="list-decimal pl-5 text-red-700 dark:text-red-300">
                      <li>Check if the image URL is accessible in a browser</li>
                      <li>Verify that the image is not too large (should be under 5MB)</li>
                      <li>Try a different image for this item</li>
                      <li>Check browser console for more detailed error messages</li>
                    </ol>
                  </div>
                </div>
              )}
              
              {/* Show image search status and errors for non-URL-related issues */}
              {debugData.imageSearchDetails && debugData.imageSearchDetails.error !== 'Image processing error' && (
                <div className="mt-2 border-t pt-2 border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold mb-1">Image Search Status:</h4>
                  
                  {debugData.imageSearchDetails.error ? (
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded">
                      <p className="text-red-800 dark:text-red-200 font-semibold">❌ Error: {debugData.imageSearchDetails.error}</p>
                      {debugData.imageSearchDetails.message && (
                        <p className="text-red-700 dark:text-red-300">{debugData.imageSearchDetails.message}</p>
                      )}
                    </div>
                  ) : debugData.imageSearchDetails.imageSearchSuccess === false ? (
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded">
                      <p className="text-red-800 dark:text-red-200 font-semibold">❌ Image search API call failed</p>
                      <p className="text-red-700 dark:text-red-300">
                        Try refreshing again or check the browser console for details.
                      </p>
                    </div>
                  ) : debugData.imageSearchDetails.originalResultCount === 0 ? (
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                      <p className="text-yellow-800 dark:text-yellow-200 font-semibold">⚠️ No results from eBay image search API</p>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        The eBay API didn&apos;t find any matches for this image. Possible reasons:
                      </p>
                      <ul className="list-disc pl-5 text-yellow-700 dark:text-yellow-300 mt-1">
                        <li>Image quality issues or format not recognized</li>
                        <li>No similar items currently listed on eBay</li>
                        <li>Item is too unique or rare for visual matching</li>
                        <li>API limitations or rate limiting</li>
                      </ul>
                    </div>
                  ) : (
                    <p className="text-green-600 dark:text-green-400">
                      ✅ Image search successful - Found {debugData.imageSearchDetails.originalResultCount} item(s)
                    </p>
                  )}
                  
                  {/* API response details */}
                  {debugData.imageSearchDetails.apiResponse && (
                    <div className="mt-2">
                      <p>API Status: {debugData.imageSearchDetails.apiResponse.status}</p>
                      <p>Result Count: {debugData.imageSearchDetails.originalResultCount}</p>
                      <p>Filter String: {debugData.imageSearchDetails.filterString}</p>
                    </div>
                  )}
                  
                  {/* Show original unfiltered matches if available */}
                  {debugData.imageSearchDetails.originalResults && 
                   debugData.imageSearchDetails.originalResults.length > 0 && (
                    <div className="mt-2">
                      <h5 className="font-semibold text-xs mb-1">Original Unfiltered Matches (before title word filtering):</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {debugData.imageSearchDetails.originalResults.map((match: any, idx: number) => (
                          <a 
                            key={`raw-${idx}`} 
                            href={match.itemWebUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                          >
                            <div className="aspect-square relative mb-1 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                              {match.image?.imageUrl ? (
                                <Image 
                                  src={match.image.imageUrl} 
                                  alt={match.title || 'Item image'} 
                                  fill
                                  className="object-contain"
                                />
                              ) : typeof match.image === 'string' ? (
                                <Image 
                                  src={match.image} 
                                  alt={match.title || 'Item image'} 
                                  fill
                                  className="object-contain"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <PlaceholderImage width={80} height={80} />
                                </div>
                              )}
                            </div>
                            <div className="text-xs truncate" title={match.title}>
                              {match.title}
                            </div>
                            <div className="text-xs font-semibold text-green-600 dark:text-green-400">
                              {typeof match.price === 'object' 
                                ? `${match.price?.currency || 'GBP'} ${match.price?.value || 'N/A'}`
                                : `GBP ${match.price || 'N/A'}`}
                            </div>
                            <div className="text-xs text-blue-500 flex items-center mt-1">
                              <ExternalLink className="h-3 w-3 mr-1" /> View on eBay
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full rounded-xl" />
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }
  
  // Render an error state
  if (error || !item) {
    return (
      <div className="container py-6">
        <Card className="p-6 flex flex-col items-center justify-center space-y-4">
          <h2 className="text-xl font-bold text-destructive">Error Loading Item</h2>
          <p className="text-center text-muted-foreground">{error || "Item not found."}</p>
          <Button onClick={() => router.push("/my-collection")}>
            Return to Collection
          </Button>
        </Card>
      </div>
    );
  }
  
  // Map DB images to the format expected by ImageCarousel
  const carouselImages = images.map(img => ({
    id: img.id,
    url: img.url,
    alt: `${item.name} image`
  }));
  
  // Render the actual component with the original layout structure
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black/30">
      <main className="container mx-auto px-2 sm:px-4 py-8 sm:py-12 max-w-7xl overflow-x-hidden">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="inline-flex items-center text-purple-400 hover:text-primary/50 mb-4 sm:mb-8"
          onClick={() => router.push("/my-collection")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collection
        </Button>
        
        {/* Main content - two column layout with gallery on left, details on right */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-8 w-full overflow-hidden">
          {/* Image gallery column */}
          <div className="space-y-2 sm:space-y-4 w-full overflow-hidden">
            {imageLoading ? (
              <Skeleton className="h-96 w-full rounded-xl" />
            ) : (
              <>
                <ImageCarousel 
                  images={carouselImages} 
                  itemId={item.id} 
                  onAddImages={handleAddImages}
                  onDeleteImage={handleDeleteImage}
                />
                
                {/* Debug Panel - placed under the image carousel */}
                {isDebugMode && (
                  <>
                    {renderDebugInfo()}
                  </>
                )}
              </>
            )}
          </div>
          
          {/* Details column */}
          <div className="space-y-6">
            {/* Item Header */}
            <ItemHeader
              name={item.name}
              isEditing={isEditingField === "name"}
              onEditStart={() => handleEditStart("name")}
              onEditCancel={handleEditCancel}
              onEditSave={(name) => handleUpdateField("name", name)}
            />
            
            {/* Metrics Section */}
            <ItemMetrics
              cost={item.cost}
              value={item.value}
              soldPrice={item.soldPrice}
              isSold={item.isSold}
              ebayListed={item.ebayListed}
              isEditingCost={isEditingField === "cost"}
              isEditingValue={isEditingField === "value"}
              isEditingSoldPrice={isEditingField === "soldPrice"}
              isLoadingAiPrice={isLoadingAiPrice}
              onEditCostStart={() => handleEditStart("cost")}
              onEditValueStart={() => handleEditStart("value")}
              onEditSoldPriceStart={() => handleEditStart("soldPrice")}
              onEditCancel={handleEditCancel}
              onEditCostSave={(cost) => handleUpdateField("cost", cost)}
              onEditValueSave={(value) => handleUpdateField("value", value)}
              onEditSoldPriceSave={(soldPrice) => handleUpdateField("soldPrice", soldPrice)}
              onRefreshAiPrice={handleRefreshAiPrice}
            />
            
            {/* Profit Metrics */}
            <ProfitMetrics
              cost={item.cost}
              value={item.value}
              soldPrice={item.soldPrice}
              isSold={item.isSold}
            />
            
            {/* Item Details Section */}
            <Card className="border dark:border-border shadow-sm dark:bg-card/60">
              <div className="p-6 space-y-6">
                <h3 className="text-lg font-medium">Item Details</h3>
                
                {/* Status & Acquisition Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Status & Acquisition</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1.5">Date Acquired</div>
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          className="p-0 h-auto font-normal text-left justify-start w-full group"
                          onClick={() => handleEditStart("acquired")}
                        >
                          <div className="flex items-center">
                            <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                              {item.acquired ? new Date(item.acquired).toLocaleDateString() : 'Not specified'}
                            </Badge>
                            <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2">Edit</span>
                          </div>
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-muted-foreground mb-1.5">Collection Status</div>
                      <ItemStatus
                        isSold={item.isSold}
                        soldPrice={tempSoldPrice}
                        soldDate={tempSoldDate}
                        showSoldDetails={showSoldDetails}
                        onToggleSold={handleToggleSold}
                        onSoldPriceChange={setTempSoldPrice}
                        onSoldDateChange={setTempSoldDate}
                        onSaveSoldDetails={handleSaveSoldDetails}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Show sold details for editing only when the item is sold and has sold details */}
                {item.isSold && item.soldPrice !== null && !showSoldDetails && (
                  <SoldDetails
                    soldPrice={item.soldPrice}
                    soldDate={item.soldDate}
                    isEditingSoldPrice={isEditingField === "soldPrice"}
                    isEditingSoldDate={isEditingField === "soldDate"}
                    onEditSoldPriceStart={() => handleEditStart("soldPrice")}
                    onEditSoldDateStart={() => handleEditStart("soldDate")}
                    onEditCancel={handleEditCancel}
                    onEditSoldPriceSave={(price) => handleUpdateField("soldPrice", price)}
                    onEditSoldDateSave={(date) => handleUpdateField("soldDate", date)}
                  />
                )}
                
                {/* Item Information Section */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground">Item Information</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {/* Type */}
                    <div className="space-y-1.5">
                      <div className="text-xs text-muted-foreground">Type</div>
                      <Popover open={isEditingField === "type"} onOpenChange={(open) => !open && handleEditCancel()}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="p-0 h-auto font-normal text-left justify-start w-full group"
                            onClick={() => handleEditStart("type")}
                          >
                            <div className="flex items-center">
                              <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                                {item.type || 'Not specified'}
                              </Badge>
                              <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2">Edit</span>
                            </div>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 dark:bg-black/90 dark:border-border">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-foreground">Edit Type</h4>
                            <div className="space-y-2">
                              <select 
                                className="w-full p-2 rounded-md border border-input bg-background"
                                value={item.type}
                                onChange={(e) => handleUpdateField("type", e.target.value)}
                              >
                                {TYPE_OPTIONS.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {/* Franchise */}
                    <div className="space-y-1.5">
                      <div className="text-xs text-muted-foreground">Franchise</div>
                      <Popover open={isEditingField === "franchise"} onOpenChange={(open) => !open && handleEditCancel()}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="p-0 h-auto font-normal text-left justify-start w-full group"
                            onClick={() => handleEditStart("franchise")}
                          >
                            <div className="flex items-center">
                              <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                                {item.franchise || 'Not specified'}
                              </Badge>
                              <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2">Edit</span>
                            </div>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 dark:bg-black/90 dark:border-border">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-foreground">Edit Franchise</h4>
                            <div className="space-y-2">
                              <select 
                                className="w-full p-2 rounded-md border border-input bg-background"
                                value={item.franchise}
                                onChange={(e) => handleUpdateField("franchise", e.target.value)}
                              >
                                {FRANCHISE_OPTIONS.map(option => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {/* Brand */}
                    <div className="space-y-1.5">
                      <div className="text-xs text-muted-foreground">Brand</div>
                      <Popover open={isEditingField === "brand"} onOpenChange={(open) => !open && handleEditCancel()}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="p-0 h-auto font-normal text-left justify-start w-full group"
                            onClick={() => handleEditStart("brand")}
                          >
                            <div className="flex items-center">
                              <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                                {item.brand || 'Not specified'}
                              </Badge>
                              <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2">Edit</span>
                            </div>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 dark:bg-black/90 dark:border-border">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-foreground">Edit Brand</h4>
                            <div className="space-y-2">
                              <select 
                                className="w-full p-2 rounded-md border border-input bg-background"
                                value={item.brand}
                                onChange={(e) => handleUpdateField("brand", e.target.value)}
                              >
                                {BRAND_OPTIONS.map(option => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {/* Year */}
                    <div className="space-y-1.5">
                      <div className="text-xs text-muted-foreground">Year</div>
                      <Popover open={isEditingField === "year"} onOpenChange={(open) => !open && handleEditCancel()}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="p-0 h-auto font-normal text-left justify-start w-full group"
                            onClick={() => handleEditStart("year")}
                          >
                            <div className="flex items-center">
                              <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                                {item.year || 'Not specified'}
                              </Badge>
                              <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2">Edit</span>
                            </div>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 dark:bg-black/90 dark:border-border">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-foreground">Edit Year</h4>
                            <div className="space-y-2">
                              <select 
                                className="w-full p-2 rounded-md border border-input bg-background"
                                value={item.year?.toString() || ""}
                                onChange={(e) => handleUpdateField("year", e.target.value ? parseInt(e.target.value) : null)}
                              >
                                <option value="">Not specified</option>
                                {YEAR_OPTIONS.map(option => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {/* Condition */}
                    <div className="space-y-1.5">
                      <div className="text-xs text-muted-foreground">Condition</div>
                      <Popover open={isEditingField === "condition"} onOpenChange={(open) => !open && handleEditCancel()}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="p-0 h-auto font-normal text-left justify-start w-full group"
                            onClick={() => handleEditStart("condition")}
                          >
                            <div className="flex items-center">
                              <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                                {item.condition || 'Not specified'}
                              </Badge>
                              <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2">Edit</span>
                            </div>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 dark:bg-black/90 dark:border-border">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-foreground">Edit Condition</h4>
                            <div className="space-y-2">
                              <select 
                                className="w-full p-2 rounded-md border border-input bg-background"
                                value={item.condition}
                                onChange={(e) => handleUpdateField("condition", e.target.value as ItemCondition)}
                              >
                                {CONDITION_OPTIONS.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {/* Notes */}
                    <div className="space-y-1.5 col-span-2">
                      <div className="text-xs text-muted-foreground">Notes</div>
                      <Popover open={isEditingField === "notes"} onOpenChange={(open) => !open && handleEditCancel()}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="p-0 h-auto font-normal text-left justify-start w-full group"
                            onClick={() => handleEditStart("notes")}
                          >
                            <div className="w-full bg-primary/5 hover:bg-primary/10 p-2 rounded text-sm min-h-[60px] overflow-y-auto text-left relative">
                              <span className="block whitespace-pre-wrap">{item.notes || 'No notes added'}</span>
                              <span className="absolute top-1 right-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                            </div>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-foreground">Edit Notes</h4>
                            <div className="space-y-2">
                              <textarea 
                                className="w-full p-2 rounded-md border border-input bg-background min-h-[100px]"
                                value={tempNotes}
                                onChange={(e) => setTempNotes(e.target.value)}
                                placeholder="Add notes about this item..."
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                              <Button onClick={() => handleUpdateField("notes", tempNotes)}>Save</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                
                {/* Delete button at the bottom */}
                <div className="pt-4 mt-4 border-t border-border flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-destructive"
                    onClick={handleDeleteItem}
                  >
                    Delete Item
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Image Upload Dialog */}
      <Dialog open={isImageUploadOpen} onOpenChange={setIsImageUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Images</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <DynamicImageUpload 
              onUpload={handleImageUpload} 
              bucketName="item-images" 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 