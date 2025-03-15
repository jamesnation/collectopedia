/**
 * components/item-details/context/item-details-context.tsx
 * 
 * This file implements the context provider for item details page state management.
 * It centralizes all state and state-changing functions to make the main component cleaner.
 * Updated to use React Query for improved data fetching and caching.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { ItemCondition } from "@/types/item-types";
import { useAuth } from "@clerk/nextjs";
import { useEbayDebugMode } from "@/hooks/use-ebay-debug-mode";
import { useRegionContext } from "@/contexts/region-context";
import { arrayMove } from '@dnd-kit/sortable';
import { 
  useItemQuery, 
  useItemHistoryQuery, 
  useUpdateItemMutation,
  useDeleteItemMutation,
  useRefreshAiPriceMutation
} from "@/hooks/items/use-item-query";
import { isEqual } from "lodash";
import { getImagesByItemIdAction, deleteImageAction } from "@/actions/images-actions";

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

// Item type definition
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

// History event type
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

// Props for the context provider
interface ItemDetailsProviderProps {
  children: ReactNode;
  itemId: string;
  loadItem: (id: string) => Promise<Item>;
  updateItem: (id: string, data: Partial<Item>) => Promise<Item>;
  deleteItem: (id: string) => Promise<void>;
  loadHistoryEvents: (id: string) => Promise<HistoryEvent[]>;
  refreshAiPrice: (id: string) => Promise<number | null | { price: number; debugData: any }>;
}

// Context interface definition
interface ItemDetailsContextType {
  // Item state
  item: Item | null;
  isLoading: boolean;
  error: string | null;
  
  // Images state
  images: ImageType[];
  imageLoading: boolean;
  
  // Editing state
  isEditingField: string | null;
  tempNotes: string;
  
  // Sold state
  showSoldDetails: boolean;
  tempSoldPrice: string;
  tempSoldDate: string;
  
  // History state
  historyEvents: HistoryEvent[];
  historyIsLoading: boolean;
  
  // eBay state
  isLoadingAiPrice: boolean;
  debugData: any;

  // Image dialog state
  isImageUploadOpen: boolean;
  
  // Actions
  handleEditStart: (field: string) => void;
  handleEditCancel: () => void;
  handleUpdateField: (field: string, value: any) => Promise<void>;
  
  // Sold actions
  handleToggleSold: (checked: boolean) => Promise<void>;
  handleSaveSoldDetails: () => Promise<void>;
  
  // Image actions
  handleAddImages: () => void;
  handleImageUpload: (url: string) => Promise<void>;
  handleDeleteImage: (imageId: string) => Promise<void>;
  handleImageReorder: (event: any) => Promise<void>;
  
  // Notes actions
  setTempNotes: React.Dispatch<React.SetStateAction<string>>;
  
  // Sold actions
  setTempSoldPrice: React.Dispatch<React.SetStateAction<string>>;
  setTempSoldDate: React.Dispatch<React.SetStateAction<string>>;
  setShowSoldDetails: React.Dispatch<React.SetStateAction<boolean>>;
  
  // eBay actions
  handleRefreshAiPrice: () => Promise<void>;
  
  // Dialog actions
  setIsImageUploadOpen: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Item actions
  handleDeleteItem: () => Promise<void>;
}

// Create the context with default values
const ItemDetailsContext = createContext<ItemDetailsContextType | undefined>(undefined);

// Provider component
export function ItemDetailsProvider({
  children,
  itemId,
  loadItem,
  updateItem,
  deleteItem,
  loadHistoryEvents,
  refreshAiPrice
}: ItemDetailsProviderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { userId } = useAuth();
  const { isDebugMode, isInitialized } = useEbayDebugMode();
  const { region } = useRegionContext();
  
  // Use React Query for data fetching
  const { 
    data: itemData, 
    isLoading: isLoadingItem, 
    error: itemError 
  } = useItemQuery(itemId, loadItem);
  
  const { 
    data: historyData = [], 
    isLoading: isLoadingHistory 
  } = useItemHistoryQuery(itemId, loadHistoryEvents);
  
  // Use React Query for mutations
  const updateItemMutation = useUpdateItemMutation(updateItem);
  const deleteItemMutation = useDeleteItemMutation(deleteItem);
  const refreshPriceMutation = useRefreshAiPriceMutation(refreshAiPrice);
  
  // Local state management (not moved to React Query)
  // Item state based on React Query data
  const [item, setItem] = useState<Item | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Update local state from React Query
  useEffect(() => {
    // Only update item state if the data has actually changed
    if (itemData && !isEqual(itemData, item)) {
      setItem(itemData);
    }
    
    if (itemError && !error) {
      setError(String(itemError));
    }
  }, [itemData, itemError, item, error]);
  
  // Editing state
  const [isEditingField, setIsEditingField] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>("");
  
  // Image state
  const [images, setImages] = useState<ImageType[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // Sold state
  const [showSoldDetails, setShowSoldDetails] = useState(false);
  const [tempSoldPrice, setTempSoldPrice] = useState<string>("");
  const [tempSoldDate, setTempSoldDate] = useState<string>("");
  
  // History state from React Query
  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>([]);
  
  // Update local history state from React Query - only if changed
  useEffect(() => {
    if (historyData && !isEqual(historyData, historyEvents)) {
      setHistoryEvents(historyData);
    }
  }, [historyData, historyEvents]);
  
  // eBay state
  const [isLoadingAiPrice, setIsLoadingAiPrice] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  
  // Memoize fetchImages to prevent dependency cycles
  const fetchImages = useCallback(async () => {
    if (!itemData?.id) return;
    
    try {
      setIsLoadingImages(true);
      setImageError(null);
      
      const imagesResult = await getImagesByItemIdAction(itemData.id);
      if (imagesResult.isSuccess && imagesResult.data) {
        // Sort images by order
        const sortedImages = [...imagesResult.data].sort((a, b) => {
          return (a.order || 0) - (b.order || 0);
        });
        
        setImages(sortedImages);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      setImageError("Failed to load images");
    } finally {
      setIsLoadingImages(false);
    }
  }, [itemData?.id]);
  
  // Fetch images only when itemData.id changes, not when item state changes
  useEffect(() => {
    if (itemData?.id) {
      fetchImages();
    }
  }, [itemData?.id, fetchImages]);
  
  // Handle editing field start
  const handleEditStart = (field: string) => {
    console.log(`handleEditStart called with field: ${field}`);
    
    if (field === "notes" && item) {
      setTempNotes(item.notes || "");
    } else if ((field === "soldPrice" || field === "soldPrice-main" || field === "soldPrice-detail") && item) {
      console.log(`Setting tempSoldPrice to: ${item.soldPrice}`);
      setTempSoldPrice(item.soldPrice ? String(item.soldPrice) : "");
    } else if (field === "soldDate" && item) {
      setTempSoldDate(item.soldDate ? new Date(item.soldDate).toISOString().split('T')[0] : "");
    }
    
    setIsEditingField(field);
    console.log(`isEditingField is now set to: ${field}`);
  };
  
  // Handle editing cancel
  const handleEditCancel = () => {
    setIsEditingField(null);
    setTempNotes("");
  };
  
  // Handle field update with React Query
  const handleUpdateField = async (field: string, value: any) => {
    if (!item) return;
    
    try {
      // Log field update attempts for debugging
      console.log(`Updating field: ${field} with value:`, value);
      
      // Normalize field names
      const normalizedField = field === "soldPrice-main" || field === "soldPrice-detail" 
        ? "soldPrice" 
        : field;
      
      // Use the React Query mutation
      await updateItemMutation.mutateAsync({ 
        id: item.id, 
        data: { [normalizedField]: value } 
      });
      
      setIsEditingField(null);
      
      // Show success message for certain fields
      if (normalizedField === "soldPrice" || normalizedField === "soldDate") {
        toast({
          title: "Success",
          description: `Updated ${normalizedField === "soldPrice" ? "sold price" : "sold date"} successfully.`,
        });
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast({
        title: "Error",
        description: `Failed to update ${field}. Please try again.`,
        variant: "destructive",
      });
    }
  };
  
  // Handle adding images
  const handleAddImages = () => {
    setIsImageUploadOpen(true);
  };
  
  // Handle image upload
  const handleImageUpload = async (url: string) => {
    if (!item || !url) return;
    
    console.log("Handling image upload:", url);
    setIsImageUploadOpen(false);
    
    try {
      const { createImageAction } = await import("@/actions/images-actions");
      
      // Extract userId from auth (or use a placeholder for now)
      const currentUserId = userId || 'current-user';
      
      // First create the image record
      const result = await createImageAction({
        url,
        itemId: item.id,
        userId: currentUserId
      });
      
      console.log("Create image result:", result);
      
      if (result.isSuccess && result.data) {
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
        
        // Check if result data is a string or an object
        if (typeof result.data === 'string') {
          console.log("Image ID returned:", result.data);
          
          // Create a new image object to add to the state
          const newImage: ImageType = {
            id: result.data,
            url,
            alt: `${item.name} image`,
            itemId: item.id,
            userId: currentUserId
          };
          
          setImages(prev => [...prev, newImage]);
        } else {
          console.log("Image object returned:", result.data);
          setImages(prev => [...prev, result.data as ImageType]);
        }
        
        // Optimistically update the item images
        const newImageSimple = {
          id: typeof result.data === 'string' ? result.data : result.data.id,
          url,
          alt: `${item.name} image`
        };
        
        // Use React Query mutation to update the item with the new image
        await updateItemMutation.mutateAsync({
          id: item.id,
          data: {
            images: [...(item.images || []), newImageSimple]
          }
        });
        
      } else {
        throw new Error(result.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle delete image
  const handleDeleteImage = useCallback(async (imageId: string) => {
    try {
      if (!item?.id) return;
      
      // Remove from local state immediately (optimistic update)
      setImages(prevImages => prevImages.filter(img => img.id !== imageId));
      
      // Delete the image from the API
      await deleteImageAction(imageId, item.id);
      
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting image:", error);
      
      // Refresh images to restore state on error
      fetchImages();
      
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  }, [item?.id, fetchImages]);
  
  // Handle refresh AI price
  const handleRefreshAiPrice = useCallback(async () => {
    if (!item?.id) return;
    
    try {
      // Set loading state manually to ensure UI updates
      setIsLoadingAiPrice(true);
      
      // Call the mutation
      const result = await refreshPriceMutation.mutateAsync(item.id);
      
      // Handle the result which can now be a number or an object with price and debugData
      if (typeof result === 'object' && result !== null && 'debugData' in result) {
        // Store debug data for the debug panel
        setDebugData(result.debugData);
        
        // Display success message with the price from the object
        toast({
          title: "Success",
          description: `AI price updated to ${result.price}`,
        });
      } else {
        // Handle the case where result is just a number
        // Display success message
        toast({
          title: "Success",
          description: `AI price updated to ${result}`,
        });
      }
    } catch (error) {
      console.error("Error in handleRefreshAiPrice:", error);
      toast({
        title: "Error",
        description: "Failed to update AI price. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Ensure loading state is turned off even if there's an error
      setIsLoadingAiPrice(false);
    }
  }, [item?.id, refreshPriceMutation, toast]);
  
  // Handle toggle sold state
  const handleToggleSold = async (checked: boolean) => {
    if (!item) return;
    
    try {
      // Update the item's isSold status immediately in the database
      await updateItemMutation.mutateAsync({
        id: item.id,
        data: {
          isSold: checked
        }
      });
      
      // If toggling to sold, show the sold details form
      if (checked) {
        setShowSoldDetails(true);
        setTempSoldPrice(item.soldPrice ? String(item.soldPrice) : "");
        setTempSoldDate(item.soldDate ? new Date(item.soldDate).toISOString().split('T')[0] : "");
      } else {
        // If toggling to not sold, clear sold details
        await updateItemMutation.mutateAsync({
          id: item.id,
          data: {
            soldPrice: null,
            soldDate: null
          }
        });
        
        setShowSoldDetails(false);
      }
    } catch (error) {
      console.error("Error toggling sold state:", error);
      toast({
        title: "Error",
        description: "Failed to update item status. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle save sold details
  const handleSaveSoldDetails = async () => {
    if (!item) return;
    
    try {
      const soldPrice = tempSoldPrice ? parseFloat(tempSoldPrice) : null;
      const soldDate = tempSoldDate ? new Date(tempSoldDate) : null;
      
      // Validate input
      if (!soldPrice || !soldDate) {
        toast({
          title: "Validation Error",
          description: "Both sold price and date are required.",
          variant: "destructive",
        });
        return;
      }
      
      // Use React Query mutation
      await updateItemMutation.mutateAsync({
        id: item.id,
        data: {
          isSold: true,
          soldPrice,
          soldDate
        }
      });
      
      setShowSoldDetails(false);
      
      toast({
        title: "Success",
        description: "Sold details saved successfully.",
      });
    } catch (error) {
      console.error("Error saving sold details:", error);
      toast({
        title: "Error",
        description: "Failed to save sold details. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle delete item
  const handleDeleteItem = async () => {
    if (!item) return;
    
    const confirmDelete = window.confirm("Are you sure you want to delete this item? This action cannot be undone.");
    if (!confirmDelete) return;
    
    try {
      // Use React Query mutation
      await deleteItemMutation.mutateAsync(item.id);
      
      // Navigate back to collection
      router.push("/my-collection");
      
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle image reordering
  const handleImageReorder = async (event: any) => {
    if (!item || !event || !event.active || !event.over) return;
    
    const oldIndex = images.findIndex(img => img.id === event.active.id);
    const newIndex = images.findIndex(img => img.id === event.over.id);
    
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    
    try {
      // Update local state first (optimistic update)
      const newImages = arrayMove(images, oldIndex, newIndex);
      setImages(newImages);
      
      // Convert to simple array for the item's images
      const simpleImages = newImages.map(img => ({
        id: img.id,
        url: img.url,
        alt: img.alt || `${item.name} image`
      }));
      
      // Use React Query mutation to update the order in the database
      await updateItemMutation.mutateAsync({
        id: item.id,
        data: { images: simpleImages }
      });
      
      // Also update the order in the images table
      try {
        const { reorderImagesAction } = await import("@/actions/images-actions");
        
        // Create order updates
        const orderUpdates = newImages.map((img, index) => ({
          id: img.id,
          order: index
        }));
        
        await reorderImagesAction(item.id, orderUpdates);
      } catch (orderError) {
        console.error("Error updating image order:", orderError);
        // Not critical, so we don't need to show a toast
      }
      
    } catch (error) {
      console.error("Error reordering images:", error);
      toast({
        title: "Error",
        description: "Failed to reorder images. Please try again.",
        variant: "destructive",
      });
      
      // Reload images if the reorder failed
      fetchImages();
    }
  };
  
  // Convert type for item images to match our ImageType
  const convertImagesToImageType = (itemData: Item): ImageType[] => {
    if (!itemData.images || itemData.images.length === 0) {
      return [];
    }

    return itemData.images.map(img => ({
      id: img.id,
      url: img.url,
      itemId: itemData.id,
      userId: 'current-user', // Placeholder, would normally be the actual user ID
      order: 0 // Default order
    }));
  };

  // Memoize the Item -> ImageType conversion to prevent unnecessary re-renders
  const itemImages = useMemo(() => {
    if (item && item.images && item.images.length > 0) {
      return convertImagesToImageType(item);
    }
    return [];
  }, [item]);

  // Return the context value
  const contextValue: ItemDetailsContextType = {
    item,
    isLoading: isLoadingItem,
    error,
    images,
    imageLoading: isLoadingImages,
    isEditingField,
    tempNotes,
    showSoldDetails,
    tempSoldPrice,
    tempSoldDate,
    historyEvents,
    historyIsLoading: isLoadingHistory,
    isLoadingAiPrice,
    debugData,
    isImageUploadOpen,
    handleEditStart,
    handleEditCancel,
    handleUpdateField,
    handleToggleSold,
    handleSaveSoldDetails,
    handleAddImages,
    handleImageUpload,
    handleDeleteImage,
    handleImageReorder,
    setTempNotes,
    setTempSoldPrice,
    setTempSoldDate,
    setShowSoldDetails,
    handleRefreshAiPrice,
    setIsImageUploadOpen,
    handleDeleteItem,
  };
  
  return (
    <ItemDetailsContext.Provider value={contextValue}>
      {children}
    </ItemDetailsContext.Provider>
  );
}

// Custom hook to use the context
export function useItemDetails() {
  const context = useContext(ItemDetailsContext);
  
  if (context === undefined) {
    throw new Error("useItemDetails must be used within an ItemDetailsProvider");
  }
  
  return context;
} 