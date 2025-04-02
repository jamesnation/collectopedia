/**
 * Debug Panel Component
 * 
 * Displays debug information for eBay price searches when debug mode is enabled.
 * Shows both image-based and text-based search results, along with detailed
 * diagnostic information about the search process.
 */

import React from 'react'
import Image from 'next/image'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card"
import { ExternalLink, Info, Search, Tag, PieChart, AlertCircle } from "lucide-react"
import { PlaceholderImage } from '@/components/ui/placeholder-image'
import { SelectImage } from '@/db/schema/images-schema'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface DebugPanelProps {
  debugData: any
  isDebugMode: boolean
  isInitialized: boolean
  item: any
  images: SelectImage[]
}

export default function DebugPanel({
  debugData,
  isDebugMode,
  isInitialized,
  item,
  images
}: DebugPanelProps) {
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
            eBay Search Debug Mode
          </CardTitle>
          <CardDescription className="text-xs text-yellow-600 dark:text-yellow-500">
            No debug data available. Try clicking Refresh on the AI Price card.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Extract search parameters for quick reference
  const searchParams = debugData.searchParams || {};
  
  // Function to format price display for listings
  const formatPrice = (price: any) => {
    if (typeof price === 'object') {
      return `${price?.currency || 'GBP'} ${price?.value || 'N/A'}`;
    } else if (typeof price === 'number') {
      return `GBP ${price}`;
    } else {
      return `GBP ${price || 'N/A'}`;
    }
  };
  
  // Log debug data structure to help troubleshoot
  console.log('eBay Debug Data Structure:', {
    hasTextBased: !!debugData.textBased,
    hasImageBased: !!debugData.imageBased,
    hasCombined: !!debugData.combined,
    textBasedSample: debugData.textBased,
    imageMatches: debugData.imageMatches?.length,
    textMatches: debugData.textMatches?.length,
    imageMatchesArray: Array.isArray(debugData.imageMatches),
    imageMatchesExample: debugData.imageMatches?.length > 0 ? debugData.imageMatches[0] : null
  });
  
  // Calculate which tab should be default active based on available data
  const getDefaultTab = () => {
    if (debugData.imageMatches && debugData.imageMatches.length > 0) {
      return "image";
    } else if (debugData.textMatches && debugData.textMatches.length > 0) {
      return "text";
    }
    return "raw";
  };
  
  // Get price values directly from the matches if available
  const extractPricesFromMatches = (matches: any[]) => {
    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      return { lowest: 0, median: 0, highest: 0 };
    }
    
    console.log('Extracting prices from matches:', { 
      matchCount: matches.length,
      firstMatchSample: matches[0]
    });
    
    // Extract numeric prices from matches with more flexible extraction
    const prices = matches
      .map(match => {
        // Try to extract price from various formats
        if (typeof match.price === 'object' && match.price?.value) {
          return parseFloat(match.price.value);
        } else if (typeof match.price === 'number') {
          return match.price;
        } else if (typeof match.price === 'string') {
          return parseFloat(match.price);
        } 
        // Try additional potential locations for price data
        else if (match.estimatedValues && match.estimatedValues.price) {
          return parseFloat(match.estimatedValues.price);
        } else if (match.sellingStatus && match.sellingStatus.currentPrice) {
          return parseFloat(match.sellingStatus.currentPrice.value);
        }
        return 0;
      })
      .filter(price => !isNaN(price) && price > 0)
      .sort((a, b) => a - b);
    
    console.log('Extracted prices:', { 
      priceCount: prices.length,
      prices: prices.slice(0, 5)
    });
    
    if (prices.length === 0) return { lowest: 0, median: 0, highest: 0 };
    
    const lowest = prices[0];
    const highest = prices[prices.length - 1];
    
    // Calculate median
    let median;
    const mid = Math.floor(prices.length / 2);
    if (prices.length % 2 === 0) {
      median = (prices[mid - 1] + prices[mid]) / 2;
    } else {
      median = prices[mid];
    }
    
    return { lowest, median, highest };
  };
  
  // Calculate price statistics - try to get them from multiple sources
  const priceStats = {
    // First try to get from direct textBased/imageBased properties
    text: debugData.textBased || 
          // Then try to calculate from matches
          (debugData.textMatches?.length > 0 ? extractPricesFromMatches(debugData.textMatches) : 
          { lowest: 0, median: 0, highest: 0 }),
    
    image: debugData.imageBased || 
           (debugData.imageMatches?.length > 0 ? extractPricesFromMatches(debugData.imageMatches) : 
           { lowest: 0, median: 0, highest: 0 })
  };
  
  // Helper function to safely format price values
  const formatTablePrice = (value: any) => {
    if (value === null || value === undefined) return '£0.00';
    if (typeof value === 'number') return `£${value.toFixed(2)}`;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? '£0.00' : `£${num.toFixed(2)}`;
    }
    return '£0.00';
  };
  
  // Determine which method was used - simplified approach
  // If image search has results, use it, otherwise fall back to text search
  const usedMethod = priceStats.image.median > 0 ? 'image' : 'text';
  
  return (
    <Card className="mt-4 border border-dashed border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
          <Info className="h-4 w-4" /> eBay Price Debug Information
        </CardTitle>
        <CardDescription className="text-xs text-yellow-600 dark:text-yellow-500">
          Detailed pricing data and search parameters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Parameters Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-md p-3 shadow-sm">
          <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
            <Search className="h-4 w-4" /> Search Parameters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-start">
                <span className="text-xs font-medium w-24">Title:</span>
                <span className="text-xs">{searchParams.title || item?.name || 'N/A'}</span>
              </div>
              <div className="flex items-start">
                <span className="text-xs font-medium w-24">Franchise:</span>
                <span className="text-xs">{searchParams.franchise || item?.franchise || 'N/A'}</span>
              </div>
              <div className="flex items-start">
                <span className="text-xs font-medium w-24">Condition:</span>
                <span className="text-xs">{searchParams.condition || item?.condition || 'N/A'}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-start">
                <span className="text-xs font-medium w-24">Image:</span>
                <span className="text-xs">
                  {images.length > 0 ? '✅ Available' : '❌ Not available'}
                </span>
              </div>
              <div className="flex items-start">
                <span className="text-xs font-medium w-24">Region:</span>
                <span className="text-xs">{searchParams.region || 'UK'}</span>
              </div>
              {debugData.imageSearchDetails?.titleFilterWords && (
                <div className="flex items-start">
                  <span className="text-xs font-medium w-24">Filter Words:</span>
                  <div className="flex flex-wrap gap-1">
                    {debugData.imageSearchDetails.titleFilterWords.map((word: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20">{word}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Price Calculation Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-md p-3 shadow-sm">
          <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
            <PieChart className="h-4 w-4" /> Price Calculation
          </h3>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Method</TableHead>
                <TableHead>Lowest</TableHead>
                <TableHead>Median</TableHead>
                <TableHead>Highest</TableHead>
                <TableHead className="w-[100px]">Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className={usedMethod === 'text' ? 'bg-green-50 dark:bg-green-900/20' : ''}>
                <TableCell className="font-medium">Text Search</TableCell>
                <TableCell>{formatTablePrice(priceStats.text.lowest)}</TableCell>
                <TableCell className={usedMethod === 'text' ? 'font-bold' : ''}>{formatTablePrice(priceStats.text.median)}</TableCell>
                <TableCell>{formatTablePrice(priceStats.text.highest)}</TableCell>
                <TableCell>{usedMethod === 'text' ? '✅' : '❌'}</TableCell>
              </TableRow>
              <TableRow className={usedMethod === 'image' ? 'bg-green-50 dark:bg-green-900/20' : ''}>
                <TableCell className="font-medium">Image Search</TableCell>
                <TableCell>{formatTablePrice(priceStats.image.lowest)}</TableCell>
                <TableCell className={usedMethod === 'image' ? 'font-bold' : ''}>{formatTablePrice(priceStats.image.median)}</TableCell>
                <TableCell>{formatTablePrice(priceStats.image.highest)}</TableCell>
                <TableCell>{usedMethod === 'image' ? '✅' : '❌'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>
                {usedMethod === 'image' 
                  ? 'Image-based results used (preferred method)' 
                  : 'Text-based results used (last resort)'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Search Results Tabs */}
        <Tabs defaultValue={getDefaultTab()} className="bg-white dark:bg-gray-800 rounded-md p-3 shadow-sm">
          <TabsList className="mb-2">
            <TabsTrigger value="image">Image Search Results ({debugData.imageMatches?.length || 0})</TabsTrigger>
            <TabsTrigger value="text">Text Search Results ({debugData.textMatches?.length || 0})</TabsTrigger>
            <TabsTrigger value="raw">Raw API Data</TabsTrigger>
          </TabsList>
          
          {/* Image Search Results Tab */}
          <TabsContent value="image" className="space-y-3">
            {/* Add raw image matches data visualization for debugging */}
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs mb-2">
              <div className="mb-1 font-medium">Debug info:</div>
              <div>Image matches count: {debugData.imageMatches?.length || 0}</div>
              <div>Is array: {Array.isArray(debugData.imageMatches) ? 'Yes' : 'No'}</div>
              {debugData.imageSearchDetails?.originalResultCount && (
                <div>Original API result count: {debugData.imageSearchDetails.originalResultCount}</div>
              )}
            </div>
            
            {/* Try to access image matches in different possible locations in the data structure */}
            {(() => {
              // Find image matches from all possible locations in the data structure
              const matches = 
                (debugData.imageMatches && Array.isArray(debugData.imageMatches) && debugData.imageMatches.length > 0) ? debugData.imageMatches :
                (debugData.imageSearchDetails?.originalResults && Array.isArray(debugData.imageSearchDetails.originalResults)) ? 
                  debugData.imageSearchDetails.originalResults : 
                [];
              
              console.log('Extracted image matches:', { 
                count: matches.length,
                firstMatch: matches[0] ? {
                  hasPrice: !!matches[0].price,
                  priceType: typeof matches[0].price,
                  hasEstimatedValues: !!matches[0].estimatedValues,
                  hasSellingStatus: !!matches[0].sellingStatus,
                  // Log the full object structure
                  fullObject: matches[0]
                } : null
              });
              
              // Function to extract price from various item formats
              const extractItemPrice = (item: any) => {
                // Try various price formats from eBay API
                if (typeof item.price === 'object' && item.price?.value) {
                  return item.price.value;
                } else if (typeof item.price === 'number') {
                  return item.price;
                } else if (typeof item.price === 'string') {
                  return item.price;
                } else if (item.sellingStatus?.currentPrice?.value) {
                  return item.sellingStatus.currentPrice.value;
                } else if (item.estimatedValues?.price) {
                  return item.estimatedValues.price;
                } else if (item.buyingOptions && item.price) {
                  return item.price.value;
                }
                return '0.00';
              };
              
              return matches.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Image</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="w-[100px]">Price</TableHead>
                        <TableHead className="w-[80px]">Match %</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matches.map((match: any, index: number) => (
                        <TableRow key={`img-${index}`}>
                          <TableCell>
                            <div className="w-16 h-16 relative bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
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
                                <PlaceholderImage width={64} height={64} />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-xs">
                            {match.title}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-green-600 dark:text-green-400">
                            {formatTablePrice(extractItemPrice(match))}
                          </TableCell>
                          <TableCell className="text-xs">
                            {match.relevanceScore 
                              ? `${Math.round(match.relevanceScore * 100)}%` 
                              : match.score 
                                ? `${Math.round(match.score)}pts` 
                                : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <a 
                              href={match.url || match.itemWebUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 flex items-center"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" /> View
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-yellow-600">
                  No image-based matches found
                </div>
              );
            })()}
            
            {/* Image Search Status */}
            {debugData.imageSearchDetails && (
              <div className="mt-2 border-t pt-2 border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-semibold mb-1">Image Search Status:</h4>
                
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
                  </div>
                ) : debugData.imageSearchDetails.originalResultCount === 0 ? (
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                    <p className="text-yellow-800 dark:text-yellow-200 font-semibold">⚠️ No results from eBay image search API</p>
                  </div>
                ) : (
                  <p className="text-green-600 dark:text-green-400">
                    ✅ Image search successful - Found {debugData.imageSearchDetails.originalResultCount} item(s)
                  </p>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Text Search Results Tab */}
          <TabsContent value="text" className="space-y-3">
            {/* Add raw text matches data visualization for debugging */}
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs mb-2">
              <div className="mb-1 font-medium">Debug info:</div>
              <div>Text matches count: {debugData.textMatches?.length || 0}</div>
              <div>Is array: {Array.isArray(debugData.textMatches) ? 'Yes' : 'No'}</div>
            </div>
          
            {debugData.textMatches && debugData.textMatches.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Image</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-[100px]">Price</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debugData.textMatches.map((match: any, index: number) => {
                      // Use the same price extractor as for image matches
                      const itemPrice = (() => {
                        // Try various price formats from eBay API
                        if (typeof match.price === 'object' && match.price?.value) {
                          return match.price.value;
                        } else if (typeof match.price === 'number') {
                          return match.price;
                        } else if (typeof match.price === 'string') {
                          return match.price;
                        } else if (match.sellingStatus?.currentPrice?.value) {
                          return match.sellingStatus.currentPrice.value;
                        } else if (match.estimatedValues?.price) {
                          return match.estimatedValues.price;
                        } else if (match.buyingOptions && match.price) {
                          return match.price.value;
                        }
                        return '0.00';
                      })();
                      
                      return (
                        <TableRow key={`txt-${index}`}>
                          <TableCell>
                            <div className="w-16 h-16 relative bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
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
                                <PlaceholderImage width={64} height={64} />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-xs">
                            {match.title}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-green-600 dark:text-green-400">
                            {formatTablePrice(itemPrice)}
                          </TableCell>
                          <TableCell>
                            <a 
                              href={match.url || match.itemWebUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 flex items-center"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" /> View
                            </a>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-yellow-600">
                No text-based matches found
              </div>
            )}
            
            {debugData.textApiInfo && (
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                <h4 className="font-semibold mb-1">API Response:</h4>
                <p>Status: {debugData.textApiInfo.error ? 'Error' : 'Success'}</p>
                {debugData.textApiInfo.message && (
                  <p>Message: {debugData.textApiInfo.message}</p>
                )}
                {debugData.textApiInfo.error && (
                  <p className="text-red-600">Error: {debugData.textApiInfo.error}</p>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Raw API Data Tab */}
          <TabsContent value="raw">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-xs font-semibold">Search Parameters</AccordionTrigger>
                <AccordionContent>
                  <div className="bg-black text-white p-2 rounded text-xs overflow-auto max-h-60">
                    <pre>{JSON.stringify(debugData.searchParams, null, 2)}</pre>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-xs font-semibold">Image Search Response</AccordionTrigger>
                <AccordionContent>
                  <div className="bg-black text-white p-2 rounded text-xs overflow-auto max-h-60">
                    <pre>{debugData.imageMatches && debugData.imageMatches.length > 0
                      ? JSON.stringify(debugData.imageMatches[0], null, 2)
                      : "No image match data available"}</pre>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-xs font-semibold">Text Search Response</AccordionTrigger>
                <AccordionContent>
                  <div className="bg-black text-white p-2 rounded text-xs overflow-auto max-h-60">
                    <pre>{debugData.textMatches && debugData.textMatches.length > 0
                      ? JSON.stringify(debugData.textMatches[0], null, 2)
                      : "No text match data available"}</pre>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-xs font-semibold">Image Search Details</AccordionTrigger>
                <AccordionContent>
                  <div className="bg-black text-white p-2 rounded text-xs overflow-auto max-h-60">
                    <pre>{JSON.stringify(debugData.imageSearchDetails, null, 2)}</pre>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 