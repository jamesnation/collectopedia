"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowLeft, Edit, Loader2, Save, ChevronLeft, ChevronRight, X, RefreshCw, BarChart4, Percent, ExternalLink } from "lucide-react"
import { getItemByIdAction, updateItemAction } from "@/actions/items-actions"
import { createSoldItemAction, getSoldItemByItemIdAction, updateSoldItemAction } from "@/actions/sold-items-actions"
import { SelectItem as SelectItemType } from "@/db/schema/items-schema"
import { SelectSoldItem } from "@/db/schema/sold-items-schema"
import { useToast } from "@/components/ui/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { getRelatedItemsAction } from "@/actions/items-actions"
import { getImagesByItemIdAction, createImageAction, deleteImageAction } from "@/actions/images-actions"
import { SelectImage } from "@/db/schema/images-schema"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import DynamicImageUpload from "@/components/image-upload"
import { generateYearOptions } from "@/lib/utils"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCustomBrandsAction } from "@/actions/custom-brands-actions"
import { PlaceholderImage, PLACEHOLDER_IMAGE_PATH } from '@/components/ui/placeholder-image'
import { useEbayDebugMode } from "@/hooks/use-ebay-debug-mode"
import { useRegionContext } from "@/contexts/region-context"

const placeholderImage = PLACEHOLDER_IMAGE_PATH;

// Mock data for value over time (replace with real data later)
const valueData = [
  { date: '2023-01', value: 4500 },
  { date: '2023-02', value: 4600 },
  { date: '2023-03', value: 4700 },
  { date: '2023-04', value: 4800 },
  { date: '2023-05', value: 4900 },
  { date: '2023-06', value: 5000 },
]

// Add type definition at the top
type ItemCondition = "New" | "Used";

interface ItemDetailsPageProps {
  id: string
}

export default function ItemDetailsPage({ id }: ItemDetailsPageProps) {
  const router = useRouter()
  const [item, setItem] = useState<SelectItemType | null>(null)
  const [soldItem, setSoldItem] = useState<SelectSoldItem | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const [isSold, setIsSold] = useState(false)
  const [soldPrice, setSoldPrice] = useState("")
  const [soldDate, setSoldDate] = useState("")
  const [relatedItems, setRelatedItems] = useState<SelectItemType[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [images, setImages] = useState<SelectImage[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [customBrands, setCustomBrands] = useState<{ id: string; name: string }[]>([])
  const yearOptions = generateYearOptions()
  const [loadingAiPrice, setLoadingAiPrice] = useState(false)
  const [debugData, setDebugData] = useState<any>(null);
  const { isDebugMode, isInitialized } = useEbayDebugMode();
  const { formatCurrency, currencySymbol, region } = useRegionContext();

  const defaultBrands = [
    'DC',
    'Filmation',
    'Funko',
    'Games Workshop',
    'Hasbro',
    'Kenner',
    'Marvel',
    'Matchbox',
    'Mattel',
    'Medium',
    'Playmates',
    'Senate',
    'Sunbow',
    'Super7',
    'Takara',
    'Tomy'
  ];

  // Update conditionOptions definition
  const conditionOptions: ItemCondition[] = [
    "New",
    "Used"
  ];

  useEffect(() => {
    if (id) {
      fetchItem(id)
      fetchSoldItem(id)
      fetchImages(id)
      loadCustomBrands()
    }
  }, [id])

  useEffect(() => {
    if (item) {
      fetchRelatedItems(item.franchise, item.id, item.isSold)
    }
  }, [item])

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    console.log('ItemDetailsPage - Debug mode status:', { isDebugMode, isInitialized, itemId: id });
  }, [isDebugMode, isInitialized, id]);

  const fetchItem = async (itemId: string) => {
    setIsLoading(true)
    const result = await getItemByIdAction(itemId)
    if (result.isSuccess && result.data) {
      setItem(result.data)
      setIsSold(result.data.isSold) // Set initial isSold state
    }
    setIsLoading(false)
  }

  const fetchSoldItem = async (itemId: string) => {
    const result = await getSoldItemByItemIdAction(itemId)
    if (result.isSuccess && result.data) {
      setSoldItem(result.data)
      setIsSold(true)
      setSoldPrice(result.data.soldPrice.toString())
      setSoldDate(new Date(result.data.soldDate).toISOString().split('T')[0])
    }
  }

  const fetchRelatedItems = async (franchise: string, itemId: string, isSold: boolean) => {
    const result = await getRelatedItemsAction(franchise, itemId, isSold)
    if (result.isSuccess && result.data) {
      setRelatedItems(result.data)
    }
  }

  const fetchImages = async (itemId: string) => {
    const result = await getImagesByItemIdAction(itemId)
    if (result.isSuccess && result.data) {
      setImages(result.data)
    }
  }

  const loadCustomBrands = async () => {
    const result = await getCustomBrandsAction();
    if (result.isSuccess && result.data) {
      setCustomBrands(result.data);
    }
  };

  const handleEditStart = (field: string) => {
    setEditingField(field)
  }

  const handleEditCancel = () => {
    setEditingField(null)
  }

  const handleEditSave = async () => {
    if (item) {
      try {
        const result = await updateItemAction(item.id, item)
        if (result.isSuccess) {
          setEditingField(null)
          toast({
            title: "Item updated",
            description: "Your changes have been saved successfully.",
          })
        } else {
          throw new Error('Action failed')
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update item. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (item) {
      const { name, value } = e.target;
      setItem({
        ...item,
        [name]: name === 'value' || name === 'cost' ? parseFloat(value) || 0 : value
      });
    }
  }

  const handleSoldToggle = async (checked: boolean) => {
    setIsSold(checked)
    if (item) {
      try {
        const updatedItem = { ...item, isSold: checked }
        const result = await updateItemAction(item.id, updatedItem)
        if (result.isSuccess) {
          setItem(updatedItem)
          toast({
            title: checked ? "Item marked as sold" : "Item unmarked as sold",
            description: checked ? "The item has been marked as sold." : "The item has been unmarked as sold.",
          })
        } else {
          throw new Error('Failed to update item sold status')
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update item sold status. Please try again.",
          variant: "destructive",
        })
        setIsSold(!checked) // Revert the toggle if update fails
      }
    }
    if (!checked) {
      setSoldPrice("")
      setSoldDate("")
      setSoldItem(null)
    }
  }

  const handleSaveSoldDetails = async () => {
    if (item && isSold) {
      try {
        const updatedItem = {
          ...item,
          isSold: true,
          soldPrice: parseInt(soldPrice),
          soldDate: new Date(soldDate),  // Add this line
        }
        const result = await updateItemAction(item.id, updatedItem)

        if (result.isSuccess && result.data) {
          setItem(result.data[0])
          toast({
            title: "Sold details saved",
            description: "The item has been marked as sold and details saved.",
          })
        } else {
          throw new Error(result.error || 'Action failed')
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save sold details. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleImageUpload = async (url: string) => {
    if (item) {
      try {
        // Create a new image entry
        const imageResult = await createImageAction({
          itemId: item.id,
          userId: item.userId,
          url: url,
        });

        if (imageResult.isSuccess && imageResult.data) {
          // Add the new image to the images array
          setImages(prevImages => {
            if (imageResult.data) {
              return [...prevImages, imageResult.data];
            }
            return prevImages;
          });
          
          // Set the current image index to show the new image
          setCurrentImageIndex(images.length);
          
          // Revalidate the path to update all components
          toast({
            title: "Image uploaded",
            description: "Your new image has been added to the item.",
          });
        } else {
          throw new Error('Failed to create image entry');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        toast({
          title: "Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleImageDelete = async (imageId: string) => {
    try {
      if (!item) return;

      const result = await deleteImageAction(imageId, item.id);
      if (result.isSuccess) {
        setImages(prevImages => prevImages.filter(img => img.id !== imageId));
        setCurrentImageIndex(prevIndex => Math.min(prevIndex, images.length - 2));
        toast({
          title: "Image deleted",
          description: "The image has been removed from the item.",
        });
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAiPriceRefresh = async () => {
    if (item) {
      try {
        setLoadingAiPrice(true);
        setDebugData(null); // Clear previous debug data
        
        // Get the current primary image URL
        const primaryImage = images.length > 0 ? images[0].url : undefined;
        
        // Log that we're refreshing with debug mode
        console.log('Refreshing AI price with debug mode:', { isDebugMode, isInitialized });
        
        // Import the action dynamically to avoid SSR issues
        const { getEnhancedEbayPrices } = await import('@/actions/ebay-actions');
        
        // Only proceed with debug mode if it's both enabled and initialized
        const shouldUseDebugMode = isDebugMode && isInitialized;
        
        // Use the enhanced pricing function that combines text and image search
        // Pass isDebugMode to include debug data when enabled
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
        
        // Check if we got pricing results
        if (result.combined || result.textBased || result.imageBased) {
          // Prioritize combined results, then image-based, then text-based
          const bestPrice = result.combined?.median || 
                           result.imageBased?.median || 
                           result.textBased?.median;
          
          if (bestPrice) {
            // Update the local state with the new value
            setItem({
              ...item,
              ebayListed: bestPrice
            });
            
            // Also update in the database
            const { updateItemAction } = await import('@/actions/items-actions');
            await updateItemAction(item.id, {
              ebayListed: bestPrice
            });
            
            const method = result.combined ? 'combined text+image search' : 
                         result.imageBased ? 'image search' : 'text search';
            
            toast({
              title: "AI Price updated",
              description: `Updated price for ${item.name} using ${method}.`,
            });
          } else {
            throw new Error('No valid price found');
          }
        } else {
          throw new Error('Failed to retrieve prices');
        }
      } catch (error) {
        console.error(`Error refreshing AI price for ${item.name}:`, error);
        toast({
          title: "Error",
          description: "Failed to update AI price. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingAiPrice(false);
      }
    }
  };

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
                    <ol className="list-decimal pl-5 text-xs text-red-700 dark:text-red-300">
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
      <main className="container mx-auto px-2 sm:px-4 py-8 sm:py-12 max-w-full overflow-x-hidden">
        <Link href="/my-collection" className="inline-flex items-center text-purple-400 hover:text-primary/50 mb-4 sm:mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collection
        </Link>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-8 w-full overflow-hidden">
          <div className="space-y-2 sm:space-y-4 w-full overflow-hidden">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src={images[currentImageIndex]?.url || item?.image || placeholderImage}
                  alt={`${item?.name} - Image ${currentImageIndex + 1}`}
                  fill
                  className="object-contain rounded-lg"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={true}
                />
              </div>
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-0 sm:left-1 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 p-0 sm:p-1"
                    onClick={() => setCurrentImageIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : images.length - 1))}
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 sm:right-1 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 p-0 sm:p-1"
                    onClick={() => setCurrentImageIndex(prevIndex => (prevIndex < images.length - 1 ? prevIndex + 1 : 0))}
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6" />
                  </Button>
                </>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-background/80 hover:bg-background/90 text-xs sm:text-sm p-1 sm:p-2 h-auto"
                  >
                    <Edit className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                    Edit Images
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full max-w-[320px] sm:w-80 dark:bg-black/90 dark:border-border">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-foreground">Edit Item Images</h4>
                    <DynamicImageUpload onUpload={handleImageUpload} bucketName="item-images" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                      {images.map((image, index) => (
                        <div key={index} className="relative">
                          <Image src={image.url} alt={`Image ${index + 1}`} width={100} height={100} className="w-full h-auto aspect-square object-cover rounded-md" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-0 right-0 h-5 w-5 sm:h-6 sm:w-6"
                            onClick={() => handleImageDelete(image.id)}
                          >
                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {images.length > 1 && (
              <ScrollArea className="w-full overflow-x-auto overflow-y-hidden rounded-md border">
                <div className="flex w-max space-x-1 sm:space-x-2 p-1 sm:p-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-md overflow-hidden flex-shrink-0 ${
                        index === currentImageIndex ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={`${item?.name} - Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
            
            {/* Debug Panel - moved here to appear under the main image */}
            {renderDebugInfo()}
          </div>
          <div className="space-y-6">
            <Popover open={editingField === 'name'} onOpenChange={(open) => !open && handleEditCancel()}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="p-0 h-auto font-normal text-2xl font-bold font-serif mb-4 dark:text-foreground group"
                  onClick={() => handleEditStart('name')}
                >
                  <span>{item.name}</span>
                  <Edit className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-purple-400">Edit Item Name</h4>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-purple-400">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={item.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                    <Button onClick={handleEditSave} className="bg-primary/70 text-primary-foreground hover:bg-primary/60">Save</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
              <Card className="border dark:border-border shadow-sm h-full overflow-hidden text-left">
                <CardHeader className="pb-1 md:pb-2 text-left">
                  <CardTitle className="text-base md:text-lg text-left">Estimated Value</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3 flex flex-col items-start justify-start w-full text-left">
                  <Popover open={editingField === 'value'} onOpenChange={(open) => !open && handleEditCancel()}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-normal group w-full text-left justify-start !items-start"
                        onClick={() => handleEditStart('value')}
                      >
                        <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-purple-400 break-words text-left">
                          {formatCurrency(item.value)}
                        </span>
                        <Edit className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity inline-flex" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-foreground">Edit Item Value</h4>
                        <div className="space-y-2">
                          <Label htmlFor="value" className="text-sm font-medium text-foreground">Value</Label>
                          <Input
                            id="value"
                            name="value"
                            type="number"
                            value={item.value}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                          <Button onClick={handleEditSave} className="bg-primary/70 text-primary-foreground hover:bg-primary/60">Save</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>
              <Card className="border dark:border-border shadow-sm h-full overflow-hidden text-left">
                <CardHeader className="pb-1 md:pb-2 text-left">
                  <CardTitle className="text-base md:text-lg text-left">AI Price Estimate</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex items-center justify-between">
                    <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">
                      {item.ebayListed ? formatCurrency(item.ebayListed) : 'Not available'}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleAiPriceRefresh}
                      disabled={loadingAiPrice}
                      title="Refresh AI Price Estimate"
                      className="h-8 w-8 ml-2 flex-shrink-0"
                    >
                      {loadingAiPrice ?
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                        <RefreshCw className="h-3.5 w-3.5" />
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border dark:border-border shadow-sm h-full overflow-hidden text-left sm:col-span-2 lg:col-span-1">
                <CardHeader className="pb-1 md:pb-2 text-left">
                  <CardTitle className="text-base md:text-lg text-left">Purchase Cost</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3 flex flex-col items-start justify-start w-full text-left">
                  <Popover open={editingField === 'cost'} onOpenChange={(open) => !open && handleEditCancel()}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-normal group w-full text-left justify-start !items-start"
                        onClick={() => handleEditStart('cost')}
                      >
                        <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold break-words text-left">
                          {formatCurrency(item.cost)}
                        </span>
                        <Edit className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity inline-flex" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-foreground">Edit Item Cost</h4>
                        <div className="space-y-2">
                          <Label htmlFor="cost" className="text-sm font-medium text-foreground">Cost</Label>
                          <Input
                            id="cost"
                            name="cost"
                            type="number"
                            value={item.cost}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                          <Button onClick={handleEditSave} className="bg-primary/70 text-primary-foreground hover:bg-primary/60">Save</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>
            </div>
            
            <Card className="border dark:border-border shadow-sm mt-3 md:mt-4 lg:mt-6 overflow-hidden text-left">
              <CardHeader className="pb-1 md:pb-2 text-left">
                <CardTitle className="text-base md:text-lg text-left">Profit Metrics</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  {/* Total Profit */}
                  <div className="space-y-1 flex flex-col items-start text-left">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground text-left">Total Profit</p>
                    <div className="flex items-center gap-1 justify-start text-left">
                      <p className={`text-sm sm:text-base md:text-lg lg:text-xl font-bold break-words text-left ${(item.value - item.cost) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(item.value - item.cost)}
                      </p>
                      <BarChart4 className="flex-shrink-0 h-4 w-4 md:h-5 md:w-5 text-purple-400" aria-label="Total Profit" />
                    </div>
                  </div>
                  
                  {/* Profit Margin */}
                  <div className="space-y-1 flex flex-col items-start text-left">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground text-left">Profit Margin</p>
                    <div className="flex items-center gap-1 justify-start text-left">
                      <p className={`text-sm sm:text-base md:text-lg lg:text-xl font-bold break-words text-left ${(item.cost > 0 ? ((item.value - item.cost) / item.cost * 100) : 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {item.cost > 0 ? ((item.value - item.cost) / item.cost * 100).toFixed(2) : '0.00'}%
                      </p>
                      <Percent className="flex-shrink-0 h-4 w-4 md:h-5 md:w-5 text-purple-400" aria-label="Profit Margin" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border dark:border-border shadow-sm dark:bg-card/60">
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Status & Acquisition</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Date Acquired</Label>
                      <p>{item && new Date(item.acquired).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Collection Status</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="item-status"
                          checked={isSold}
                          onCheckedChange={handleSoldToggle}
                        />
                        <span className={`text-sm ${isSold ? "text-rose-500 font-medium" : "text-emerald-600 font-medium"}`}>
                          {isSold ? 'Sold' : 'In Collection'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground">Item Information</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <div className="flex items-center">
                        <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">{item.type}</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Franchise</Label>
                      <p>{item.franchise}</p>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Brand</Label>
                      <Popover open={editingField === 'brand'} onOpenChange={(open) => !open && handleEditCancel()}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="p-0 h-auto font-normal text-left justify-start w-full group"
                            onClick={() => handleEditStart('brand')}
                          >
                            <span>{item.brand || 'Not specified'}</span>
                            <Edit className="ml-2 h-3.5 w-3.5 inline opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                          <h4 className="font-semibold text-sm text-purple-400">Edit Brand</h4>
                          <div className="space-y-2 mt-2">
                            <Label htmlFor="brand" className="text-sm font-medium text-purple-400">Brand</Label>
                            <Select
                              value={item.brand || ""}
                              onValueChange={(value) => {
                                if (item) {
                                  const updatedItem = {
                                    ...item,
                                    brand: value
                                  };
                                  setItem(updatedItem);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select brand" />
                              </SelectTrigger>
                              <SelectContent className="dark:bg-black/90">
                                <SelectGroup>
                                  <SelectLabel>Default Brands</SelectLabel>
                                  {defaultBrands.map((brand) => (
                                    <SelectItem key={brand} value={brand}>
                                      {brand}
                                    </SelectItem>
                                  ))}
                                  {customBrands.length > 0 && (
                                    <>
                                      <SelectLabel>Custom Brands</SelectLabel>
                                      {customBrands.map((brand) => (
                                        <SelectItem key={brand.id} value={brand.name}>
                                          {brand.name}
                                        </SelectItem>
                                      ))}
                                    </>
                                  )}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end space-x-2 mt-4">
                            <Button variant="outline" onClick={handleEditCancel}>Cancel</Button>
                            <Button onClick={handleEditSave}>Save</Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Year</Label>
                      <Popover open={editingField === 'year'} onOpenChange={(open) => !open && handleEditCancel()}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="p-0 h-auto font-normal text-left justify-start w-full group"
                            onClick={() => handleEditStart('year')}
                          >
                            <span>{item.year || 'Not specified'}</span>
                            <Edit className="ml-2 h-3.5 w-3.5 inline opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-purple-400">Edit Year</h4>
                            <div className="space-y-2">
                              <Label htmlFor="year" className="text-sm font-medium text-purple-400">Year</Label>
                              <Select
                                value={item.year?.toString() || ""}
                                onValueChange={(value) => {
                                  if (item) {
                                    const updatedItem = {
                                      ...item,
                                      year: value ? parseInt(value) : null
                                    };
                                    setItem(updatedItem);
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-black/90">
                                  <SelectGroup>
                                    <SelectLabel>Year</SelectLabel>
                                    {yearOptions.map((year) => (
                                      <SelectItem key={year.value} value={year.value}>
                                        {year.label}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={handleEditCancel} className="border-input text-primary/70 hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                              <Button onClick={handleEditSave} className="bg-primary/70 text-primary-foreground hover:bg-primary/60">Save</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Condition</Label>
                      <Popover open={editingField === 'condition'} onOpenChange={(open) => !open && handleEditCancel()}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="p-0 h-auto font-normal text-left justify-start w-full group"
                            onClick={() => handleEditStart('condition')}
                          >
                            <span>{item.condition || 'Not specified'}</span>
                            <Edit className="ml-2 h-3.5 w-3.5 inline opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-purple-400">Edit Condition</h4>
                            <div className="space-y-2">
                              <Label htmlFor="condition" className="text-sm font-medium text-purple-400">Condition</Label>
                              <Select
                                value={item.condition}
                                onValueChange={(value: ItemCondition) => {
                                  if (item) {
                                    const updatedItem = {
                                      ...item,
                                      condition: value as ItemCondition
                                    };
                                    setItem(updatedItem);
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-black/90">
                                  <SelectGroup>
                                    <SelectLabel>Condition</SelectLabel>
                                    {conditionOptions.map((condition) => (
                                      <SelectItem key={condition} value={condition}>
                                        {condition}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={handleEditCancel} className="border-input text-primary/70 hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                              <Button onClick={handleEditSave} className="bg-primary/70 text-primary-foreground hover:bg-primary/60">Save</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {isSold && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-muted-foreground">Sale Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="sold-price" className="text-xs text-muted-foreground">Sold Price</Label>
                        <Input
                          id="sold-price"
                          type="number"
                          placeholder="Enter sold price"
                          value={soldPrice}
                          onChange={(e) => setSoldPrice(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="sold-date" className="text-xs text-muted-foreground">Sold Date</Label>
                        <Input
                          id="sold-date"
                          type="date"
                          value={soldDate}
                          onChange={(e) => setSoldDate(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Button onClick={handleSaveSoldDetails} className="w-full bg-primary/70 text-primary-foreground hover:bg-primary/60">
                      <Save className="w-4 h-4 mr-2" /> Save Sold Details
                    </Button>
                  </div>
                )}
                
                {item.isSold && item.soldPrice && item.soldDate && !isSold && (
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Sale Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Sold Price</Label>
                        <p className="font-semibold text-purple-400">{formatCurrency(item.soldPrice)}</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Sold Date</Label>
                        <p className="font-semibold text-purple-400">{new Date(item.soldDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="notes" className="mt-12">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="value-chart">Value Chart</TabsTrigger>
          </TabsList>
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Item Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Popover open={editingField === 'notes'} onOpenChange={(open) => !open && handleEditCancel()}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left font-normal p-4 bg-muted/30 hover:bg-muted/50 rounded-md group"
                      onClick={() => handleEditStart('notes')}
                    >
                      <div className="flex items-start">
                        <div className="max-h-40 overflow-y-auto pr-2 flex-grow">
                          <p className="text-muted-foreground whitespace-pre-wrap">
                            {item && (item.notes || 'No notes available. Click to add notes about this item.')}
                          </p>
                        </div>
                        <Edit className="ml-2 h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm text-foreground">Edit Notes</h4>
                      <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium text-foreground">Notes</Label>
                        <textarea
                          id="notes"
                          name="notes"
                          value={item ? (item.notes || '') : ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                          rows={4}
                          placeholder="Add notes about this item..."
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                        <Button onClick={handleEditSave} className="bg-primary/70 text-primary-foreground hover:bg-primary/60">Save</Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="value-chart">
            <Card>
              <CardHeader>
                <CardTitle>Value Over Time</CardTitle>
                <CardDescription>Track the estimated value of your item over the past 6 months</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={valueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <section className="mt-12">
          <h2 className="text-2xl font-serif text-foreground mb-6">Related Items</h2>
          {relatedItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedItems.map((relatedItem) => (
                <Card key={relatedItem.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 dark:bg-card/60 dark:border-border">
                  <CardHeader className="p-0">
                    <Image
                      src={relatedItem.image || placeholderImage}
                      alt={relatedItem.name}
                      width={200}
                      height={200}
                      layout="responsive"
                      className="object-cover"
                      loading="lazy"
                    />
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-2">{relatedItem.name}</CardTitle>
                    <p className="font-semibold text-primary/70">
                      {relatedItem.isSold 
                        ? `Sold: ${formatCurrency(relatedItem.soldPrice)}` 
                        : `Value: ${formatCurrency(relatedItem.value)}`}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/item/${relatedItem.id}`} passHref scroll={true}>
                      <Button variant="ghost" className="w-full text-primary/70 hover:bg-accent hover:text-accent-foreground">
                        View Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p>No related items found.</p>
          )}
        </section>
      </main>

      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-border">
        <div className="text-center text-sm text-muted-foreground">
          © 2024 Collectopedia. All rights reserved.
        </div>
      </footer>
    </div>
  )
}