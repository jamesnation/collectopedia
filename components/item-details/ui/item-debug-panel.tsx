"use client";

/**
 * components/item-details/ui/item-debug-panel.tsx
 * 
 * This component displays debug information for eBay API data.
 * It shows match data used for AI price estimation and detailed logs
 * for debugging purposes when enabled in development mode.
 * Updated to use list view with thumbnails and show eBay query details.
 */

import { useState } from "react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ExternalLink, Search } from "lucide-react";
import { PlaceholderImage } from '@/components/ui/placeholder-image';

interface DebugDataProps {
  debugData: any | null;
}

export function ItemDebugPanel({ debugData }: DebugDataProps) {
  const [showFullDebug, setShowFullDebug] = useState(false);

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
  }
  
  if (imageBasedPrice === undefined && debugData.imageMatches) {
    imageBasedPrice = extractPricesFromMatches(debugData.imageMatches);
  }
  
  // Get the finalPrice directly from debugData if available
  const finalPrice = debugData.finalPrice || debugData.price;
  
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

  // Extract query information
  const textQuery = debugData.textSearchQuery || debugData.searchQuery || '';
  const imageQuery = debugData.imageSearchQuery || '';
  const filterString = debugData.imageSearchDetails?.filterString || '';
  const filterKeywords = debugData.imageSearchDetails?.titleFilterWords || [];
  
  // More comprehensive extraction of query parameters
  const itemName = debugData.itemName || 
                  debugData.item?.name || 
                  debugData.request?.title ||
                  debugData.requestParams?.title ||
                  debugData.searchParams?.title ||
                  debugData.title ||
                  '';
                  
  const itemCondition = debugData.itemCondition || 
                       debugData.item?.condition || 
                       debugData.request?.condition ||
                       debugData.requestParams?.condition ||
                       debugData.searchParams?.condition ||
                       debugData.condition ||
                       '';
                       
  const itemFranchise = debugData.itemFranchise || 
                       debugData.item?.franchise || 
                       debugData.request?.franchise ||
                       debugData.requestParams?.franchise ||
                       debugData.searchParams?.franchise ||
                       debugData.franchise ||
                       '';

  // Try to build the formatted query or fallback to the raw query
  const formattedQuery = [
    itemName,
    itemCondition ? `(${itemCondition})` : '',
    itemFranchise ? `${itemFranchise}` : ''
  ].filter(Boolean).join(' ').trim() || textQuery;

  // Check if we actually have a query to show
  const displayQuery = formattedQuery || textQuery || 'Not available';

  // Try to find the actual raw search string from the debugData
  const rawSearchString = debugData.searchText || 
                         debugData.rawSearchQuery || 
                         debugData.ebaySearchQuery || 
                         debugData.searchString ||
                         textQuery;

  // Add this helper function after the useState declaration
  const getEbayItemUrl = (match: any): string => {
    // Try direct URL properties first
    if (match.url) return match.url;
    if (match.viewItemURL) return match.viewItemURL;
    if (match.link) return match.link;
    if (match.itemUrl) return match.itemUrl;
    if (match.webURL) return match.webURL;
    if (match.itemWebUrl) return match.itemWebUrl;
    if (match.viewItemURLForNaturalSearch) return match.viewItemURLForNaturalSearch;
    
    // Check nested properties
    if (match.links?.viewItemURL) return match.links.viewItemURL;
    if (match.itemLinks?.viewItemURL) return match.itemLinks.viewItemURL;
    
    // If we have an itemId, construct a URL (this is a fallback)
    if (match.itemId) {
      return `https://www.ebay.com/itm/${match.itemId}`;
    }
    
    // For eBay Finding API response format
    if (match.itemId?.[0]) {
      return `https://www.ebay.com/itm/${match.itemId[0]}`;
    }
    
    // Another fallback for different API format
    if (match.legacyItemId) {
      return `https://www.ebay.com/itm/${match.legacyItemId}`;
    }
    
    // Last resort for title search
    if (match.title) {
      const encoded = encodeURIComponent(match.title);
      return `https://www.ebay.com/sch/i.html?_nkw=${encoded}`;
    }
    
    // Default
    return '#';
  };

  // Render component with match data
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
          {/* Price Method Summary */}
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Final price estimate: <span className="font-bold">${roundedPrice}</span> based on {selectedMethod}
            </p>
          </div>

          {/* eBay Query Information */}
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md space-y-2">
            <h4 className="text-xs font-medium text-blue-700 dark:text-blue-400 flex items-center">
              <Search className="h-3 w-3 mr-1" /> eBay Search Query Details
            </h4>
            
            <div className="p-2 bg-blue-100 dark:bg-blue-950/20 rounded-md">
              <div className="text-xs font-medium text-blue-800 dark:text-blue-300">
                Formatted Query: <span className="text-blue-900 dark:text-blue-100 font-bold">"{displayQuery}"</span>
              </div>
              <div className="text-[10px] text-blue-700 dark:text-blue-400 mt-1">
                Format: [Item Name] + (Condition) + Franchise
              </div>
              {rawSearchString && rawSearchString !== displayQuery && (
                <div className="text-xs text-blue-800 dark:text-blue-300 mt-2">
                  <span className="font-semibold">Raw Search:</span> "{rawSearchString}"
                </div>
              )}
            </div>
            
            {textQuery && (
              <div className="text-xs text-blue-600 dark:text-blue-300">
                <span className="font-semibold">Text Search:</span> "{textQuery}"
              </div>
            )}
            
            {imageQuery && (
              <div className="text-xs text-blue-600 dark:text-blue-300">
                <span className="font-semibold">Image URL:</span> <span className="break-all text-[10px]">{imageQuery}</span>
              </div>
            )}
            
            {filterKeywords && filterKeywords.length > 0 && (
              <div className="text-xs text-blue-600 dark:text-blue-300">
                <span className="font-semibold">Filter Keywords:</span> {filterKeywords.join(', ')}
              </div>
            )}
            
            {filterString && (
              <div className="text-xs text-blue-600 dark:text-blue-300">
                <span className="font-semibold">Filter String:</span> <span className="text-[10px]">{filterString}</span>
              </div>
            )}
          </div>
          
          {/* Image Matches Summary - Now first */}
          {debugData.imageMatches && debugData.imageMatches.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                Image Search Matches ({debugData.imageMatches.length})
              </h4>
              <p className="text-xs text-yellow-600">
                Median: ${imageBasedPrice ? Math.round(imageBasedPrice) : 'N/A'}
              </p>
              
              <div className="mt-2 space-y-2">
                {debugData.imageMatches.slice(0, 5).map((match: any, index: number) => (
                  <div key={`image-${index}`} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 max-w-[70%]">
                      <div className="w-12 h-12 relative flex-shrink-0 rounded overflow-hidden bg-gray-100">
                        {match.image?.imageUrl ? (
                          <Image 
                            src={match.image.imageUrl} 
                            alt={match.title || 'Item image'} 
                            fill
                            className="object-contain"
                          />
                        ) : match.galleryURL ? (
                          <Image 
                            src={match.galleryURL} 
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
                          <div className="flex items-center justify-center h-full w-full">
                            <PlaceholderImage width={40} height={40} />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-medium line-clamp-2" title={match.title}>
                          {match.title}
                        </div>
                        {match.condition && (
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">
                            Condition: {match.condition}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {typeof match.price === 'object' 
                          ? `$${match.price?.value || 'N/A'}`
                          : `$${match.price || 'N/A'}`}
                      </div>
                      <a 
                        href={getEbayItemUrl(match)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 flex items-center"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" /> eBay
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              
              {debugData.imageMatches.length > 5 && (
                <p className="text-xs text-yellow-500 mt-1">
                  +{debugData.imageMatches.length - 5} more matches
                </p>
              )}
            </div>
          )}
          
          {/* Text Matches Summary - Now second */}
          {debugData.textMatches && debugData.textMatches.length > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                Text Search Matches ({debugData.textMatches.length})
              </h4>
              <p className="text-xs text-yellow-600">
                Median: ${textBasedPrice ? Math.round(textBasedPrice) : 'N/A'}
              </p>
              
              <div className="mt-2 space-y-2">
                {debugData.textMatches.slice(0, 5).map((match: any, index: number) => (
                  <div key={`text-${index}`} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 max-w-[70%]">
                      <div className="w-12 h-12 relative flex-shrink-0 rounded overflow-hidden bg-gray-100">
                        {match.image?.imageUrl ? (
                          <Image 
                            src={match.image.imageUrl} 
                            alt={match.title || 'Item image'} 
                            fill
                            className="object-contain"
                          />
                        ) : match.galleryURL ? (
                          <Image 
                            src={match.galleryURL} 
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
                          <div className="flex items-center justify-center h-full w-full">
                            <PlaceholderImage width={40} height={40} />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-medium line-clamp-2" title={match.title}>
                          {match.title}
                        </div>
                        {match.condition && (
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">
                            Condition: {match.condition}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {typeof match.price === 'object' 
                          ? `$${match.price?.value || 'N/A'}`
                          : `$${match.price || 'N/A'}`}
                      </div>
                      <a 
                        href={getEbayItemUrl(match)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 flex items-center"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" /> eBay
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              
              {debugData.textMatches.length > 5 && (
                <p className="text-xs text-yellow-500 mt-1">
                  +{debugData.textMatches.length - 5} more matches
                </p>
              )}
            </div>
          )}
          
          {/* Show full debug info toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFullDebug(!showFullDebug)}
            className="w-full mt-2 text-xs font-medium text-yellow-700 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300"
          >
            {showFullDebug ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Hide Full Debug Data
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show Full Debug Data
              </>
            )}
          </Button>
          
          {/* Full debug info */}
          {showFullDebug && (
            <div className="mt-2 border border-yellow-200 dark:border-yellow-800/30 rounded p-2 max-h-[300px] overflow-y-auto">
              {/* Add query details first to make them easier to find */}
              <div className="mb-4">
                <h5 className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                  Query Details:
                </h5>
                <div className="bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded text-xs">
                  <div><span className="font-semibold">Item Name:</span> {itemName || 'Not found'}</div>
                  <div><span className="font-semibold">Condition:</span> {itemCondition || 'Not found'}</div>
                  <div><span className="font-semibold">Franchise:</span> {itemFranchise || 'Not found'}</div>
                  <div className="mt-1"><span className="font-semibold">Text Query:</span> {textQuery || 'Not found'}</div>
                  <div className="mt-1"><span className="font-semibold">Has Image Query:</span> {imageQuery ? 'Yes' : 'No'}</div>
                </div>
              </div>

              {/* Request params if available */}
              {(debugData.request || debugData.requestParams || debugData.searchParams) && (
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                    Request Parameters:
                  </h5>
                  <pre className="text-xs text-yellow-700 dark:text-yellow-400 whitespace-pre-wrap bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded">
                    {JSON.stringify(
                      debugData.request || debugData.requestParams || debugData.searchParams, 
                      null, 
                      2
                    )}
                  </pre>
                </div>
              )}

              {/* Sample item data */}
              {(debugData.imageMatches?.length > 0 || debugData.textMatches?.length > 0) && (
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                    Sample Item Structure:
                  </h5>
                  <pre className="text-xs text-yellow-700 dark:text-yellow-400 whitespace-pre-wrap bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded">
                    {JSON.stringify(
                      debugData.imageMatches?.[0] || debugData.textMatches?.[0], 
                      null, 
                      2
                    )}
                  </pre>
                </div>
              )}

              {/* Full debug data */}
              <h5 className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                Full Debug Data:
              </h5>
              <pre className="text-xs text-yellow-700 dark:text-yellow-400 whitespace-pre-wrap">
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 