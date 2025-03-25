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
import { ExternalLink } from "lucide-react"
import { PlaceholderImage } from '@/components/ui/placeholder-image'
import { SelectImage } from '@/db/schema/images-schema'

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
  )
} 