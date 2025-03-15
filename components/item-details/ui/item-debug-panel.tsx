"use client";

/**
 * components/item-details/ui/item-debug-panel.tsx
 * 
 * This component displays debug information for eBay API data.
 * It shows match data used for AI price estimation and detailed logs
 * for debugging purposes when enabled in development mode.
 */

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

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
          
          {/* Detailed match data summary */}
          <div className="space-y-2 mt-2">
            {/* Text Matches Summary */}
            {debugData.textMatches && debugData.textMatches.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                  Text Search Matches ({debugData.textMatches.length})
                </h4>
                <p className="text-xs text-yellow-600">
                  Median: ${textBasedPrice ? Math.round(textBasedPrice) : 'N/A'}
                </p>
                <div className="mt-1 text-xs">
                  {debugData.textMatches.slice(0, 3).map((match: any, index: number) => {
                    const price = typeof match.price === 'object' ? match.price?.value : match.price;
                    return (
                      <div key={`text-${index}`} className="flex items-center justify-between py-1 border-b border-yellow-200 dark:border-yellow-800/30">
                        <span className="truncate max-w-[60%]">
                          {match.title?.substring(0, 30)}...
                        </span>
                        <span className="font-medium">${typeof price === 'number' ? Math.round(price) : price}</span>
                      </div>
                    );
                  })}
                  {debugData.textMatches.length > 3 && (
                    <p className="text-xs text-yellow-500 mt-1">
                      +{debugData.textMatches.length - 3} more matches
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Image Matches Summary */}
            {debugData.imageMatches && debugData.imageMatches.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                  Image Search Matches ({debugData.imageMatches.length})
                </h4>
                <p className="text-xs text-yellow-600">
                  Median: ${imageBasedPrice ? Math.round(imageBasedPrice) : 'N/A'}
                </p>
                <div className="mt-1 text-xs">
                  {debugData.imageMatches.slice(0, 3).map((match: any, index: number) => {
                    const price = typeof match.price === 'object' ? match.price?.value : match.price;
                    return (
                      <div key={`image-${index}`} className="flex items-center justify-between py-1 border-b border-yellow-200 dark:border-yellow-800/30">
                        <span className="truncate max-w-[60%]">
                          {match.title?.substring(0, 30)}...
                        </span>
                        <span className="font-medium">${typeof price === 'number' ? Math.round(price) : price}</span>
                      </div>
                    );
                  })}
                  {debugData.imageMatches.length > 3 && (
                    <p className="text-xs text-yellow-500 mt-1">
                      +{debugData.imageMatches.length - 3} more matches
                    </p>
                  )}
                </div>
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
                <pre className="text-xs text-yellow-700 dark:text-yellow-400 whitespace-pre-wrap">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 