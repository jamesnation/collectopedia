# eBay AI Pricing Feature: Technical Documentation

## Overview

The eBay AI pricing feature provides estimated values for collectible items by querying the eBay marketplace via multiple APIs. This document outlines how the feature works from a technical standpoint, including the refresh functionality, API integrations, data flow, and UI components. This documentation will serve as a reference for future improvements and maintenance.

## System Architecture

### Components

1. **User Interface Components**
   - Individual item refresh buttons
   - Bulk refresh functionality in settings
   - Price displays in item cards and details pages

2. **Server Actions**
   - `ebay-actions.ts` - Core logic for eBay price fetching and updates
   - `items-actions.ts` - Database update operations

3. **API Routes**
   - `/api/ebay/route.ts` - Primary eBay API integration
   - `/api/ebay-updates/route.ts` - Handles batch updates
   - `/api/ebay-updates/bulk-refresh/route.ts` - Processes larger batches with progress tracking

4. **External API Integrations**
   - eBay Browse API (for listed items)
   - RapidAPI (for sold items)

5. **Database Schema**
   - `items-schema.ts` with `ebayListed` and `ebaySold` fields

## Data Flow

### Price Fetching Process

1. **Request Initiation**:
   - Manual: User clicks refresh button
   - Automated: Background update logic or scheduled cron job
   - Bulk: Settings page "Refresh All AI Estimates" button

2. **Server Action** (`updateEbayPrices`):
   - Takes item ID, name, type ('listed' or 'sold'), and condition
   - Calls `fetchEbayPrices` to get latest prices from eBay

3. **API Integration** (`fetchEbayPrices`):
   - Constructs request URL with appropriate parameters
   - Calls internal API endpoint (`/api/ebay`)
   - Returns structured price data (lowest, median, highest)

4. **External API Calls** (in `/api/ebay/route.ts`):
   - For listed items: Authenticates with eBay OAuth and calls Browse API
   - For sold items: Uses RapidAPI integration
   - Applies condition filtering ('New' or 'Used')
   - Processes results into standardized format

5. **Database Update**:
   - Rounds the median price
   - Updates specific item with new price value
   - Sets timestamp for when price was last updated

6. **UI Update**:
   - Revalidates paths to refresh server components
   - Updates client-side state for immediate UI feedback
   - Shows toast notification of success/failure

## Implementation Details

### eBay API Integration

```typescript
// app/api/ebay/route.ts
async function getEbayPrices(searchTerm: string, listingType: 'listed' | 'sold', condition?: 'New' | 'Used') {
  try {
    if (listingType === 'sold') {
      // RapidAPI for sold items
      const options = {
        // ...configuration
        data: {
          keywords: searchTerm,
          // ...other parameters
        }
      };
      
      // Add condition to keywords for sold items
      if (condition) {
        options.data.keywords = `${options.data.keywords} ${condition}`;
      }
      
      // ...API call and processing
    } else {
      // eBay Browse API for active listings
      const token = await getEbayToken();
      
      // Build filter string with condition
      let filterString = 'deliveryCountry:GB,itemLocationCountry:GB';
      if (condition) {
        filterString += `,conditions:${condition.toUpperCase()}`;
      }
      
      // ...API call and processing
    }
    
    // ...price calculation logic
  } catch (error) {
    // ...error handling
  }
}
```

### Server Actions

```typescript
// actions/ebay-actions.ts
export async function updateEbayPrices(id: string, name: string, type: 'listed' | 'sold', condition?: 'New' | 'Used') {
  try {
    const prices = await fetchEbayPrices(name, type, condition);
    
    // Validate price data
    if (prices.median === undefined || prices.median === null) {
      return { success: false, error: 'No valid price data found' };
    }
    
    // Round the median price
    const roundedPrice = Math.round(prices.median);
    
    // Update database
    const updateData = {
      [type === 'listed' ? 'ebayListed' : 'ebaySold']: roundedPrice
    };
    
    const updateResult = await updateItemAction(id, updateData);
    
    // ...success/error handling
  } catch (error) {
    // ...error handling
  }
}
```

### Bulk Update Process

```typescript
// app/api/ebay-updates/bulk-refresh/route.ts
export async function POST(req: NextRequest) {
  // ...user authentication
  
  try {
    // Process items in batches
    const batchSize = data.batchSize || 10;
    const offset = data.offset || 0;
    
    // Get user's items
    const items = itemsResult.data.filter(item => !item.isSold);
    
    // Process current batch
    const itemsToProcess = items.slice(offset, offset + batchSize);
    
    // Track results
    const results = {
      totalProcessed: itemsToProcess.length,
      successfulUpdates: 0,
      failedUpdates: 0,
      totalValue: 0,
      remainingItems: Math.max(0, totalItems - (offset + itemsToProcess.length)),
      nextOffset: offset + itemsToProcess.length
    };
    
    // Process each item
    for (const item of itemsToProcess) {
      // ...fetch prices and update database
    }
    
    // Record history
    if (results.successfulUpdates > 0) {
      await recordEbayHistoryForUserAction(results.totalValue, userId);
    }
    
    // Return results for progress tracking
    return NextResponse.json({
      success: true,
      message: `Processed ${results.totalProcessed} items...`,
      results: { ...results, totalItems }
    });
  } catch (error) {
    // ...error handling
  }
}
```

### UI Integration: Individual Item Refresh

```typescript
// components/item-details-page.tsx
const handleAiPriceRefresh = async () => {
  if (item) {
    try {
      setLoadingAiPrice(true);
      
      // Get the current primary image URL
      const primaryImage = images.length > 0 ? images[0].url : undefined;
      
      // Import the action dynamically
      const { getEnhancedEbayPrices } = await import('@/actions/ebay-actions');
      
      // Use the enhanced pricing function that combines text and image search
      const result = await getEnhancedEbayPrices({
        title: item.name,
        image: primaryImage,
        condition: item.condition,
        franchise: item.franchise // Include franchise for more accurate search
      }, true);
      
      if (result.combined || result.textBased || result.imageBased) {
        // Prioritize combined results, then image-based, then text-based
        const bestPrice = result.combined?.median || 
                         result.imageBased?.median || 
                         result.textBased?.median;
        
        if (bestPrice) {
          // Update local state and database
          setItem({
            ...item,
            ebayListed: bestPrice
          });
          
          await updateItemAction(item.id, {
            ebayListed: bestPrice
          });
          
          toast({
            title: "AI Price updated",
            description: `Successfully updated AI price for ${item.name}.`,
          });
        }
      }
    } catch (error) {
      // ... error handling
    }
  }
};
```

### UI Integration: Bulk Refresh

```typescript
// components/settings/collections-tab.tsx
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
    // Process items in batches
    const batchSize = 10;
    let currentOffset = 0;
    let remainingItems = 1;
    
    // Loop until all items processed
    while (remainingItems > 0 && currentIteration < maxIterations) {
      // Call API with timeout protection
      const response = await fetch('/api/ebay-updates/bulk-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize, offset: currentOffset }),
        signal: controller.signal
      });
      
      const data = await response.json();
      
      // Update tracking variables
      remainingItems = data.results.remainingItems;
      currentOffset = data.results.nextOffset;
      
      // Update progress UI
      setRefreshStats({
        processed: totalProcessedSoFar,
        successful: totalSuccessfulSoFar,
        failed: totalFailedSoFar,
        total: totalItems
      });
      
      // Calculate progress percentage
      const progressPercentage = totalItems > 0 
        ? Math.min(100, (totalProcessedSoFar / totalItems) * 100) 
        : 100;
      setRefreshProgress(progressPercentage);
    }
    
    // Show completion notification
    toast({
      title: "Refresh Complete",
      description: `Successfully updated ${totalSuccessfulSoFar} items...`,
    });
  } catch (error) {
    // ...error handling
  } finally {
    setIsRefreshing(false);
  }
};
```

## Background Updates

### Update Triggering

The system implements a lightweight background update mechanism that triggers when a user loads their collection:

```typescript
// hooks/use-background-updates.ts
export function useBackgroundUpdates() {
  useEffect(() => {
    // Don't run on server
    if (typeof window === 'undefined') return;
    
    // Check when we last triggered an update
    const lastUpdateTime = localStorage.getItem(LAST_UPDATE_KEY);
    const now = Date.now();
    
    // If it's been more than the update interval (24 hours)
    if (!lastUpdateTime || now - parseInt(lastUpdateTime) > UPDATE_INTERVAL) {
      // Make the request in the background
      triggerBackgroundUpdate()
        .then(response => {
          if (response.success) {
            localStorage.setItem(LAST_UPDATE_KEY, now.toString());
          }
        })
        .catch(error => {
          console.error('Error triggering background update:', error);
        });
    }
  }, []);
}
```

## Key Data Structures

### Item Schema with eBay Fields

```typescript
// db/schema/items-schema.ts
export const itemsTable = pgTable("items", {
  // ...other fields
  condition: conditionEnum("condition").notNull().default("Used"),
  ebaySold: integer("ebay_sold"),
  ebayListed: integer("ebay_listed"),
  ebayLastUpdated: timestamp("ebay_last_updated"),
  // ...other fields
});
```

## Performance Considerations

1. **Rate Limiting**:
   - eBay API has quota limits that must be respected
   - RapidAPI has its own separate quota system

2. **Batch Processing**:
   - Updates are processed in batches of 10 items
   - Progress tracking implemented for long-running operations
   - Timeout protection for API calls (30 seconds)

3. **Efficiency**:
   - Only unsold items are updated automatically
   - Timestamps track when prices were last updated
   - Background updates run only once per 24 hours

## Future Improvement Opportunities

1. **Enhanced Condition Handling**:
   - Currently maps to "New" or "Used", but eBay supports more granular conditions
   - Could be expanded to support eBay's full condition spectrum (New, Like New, Very Good, etc.)

2. **Improved Search Accuracy**:
   - Current implementation uses the item name directly
   - Could implement more sophisticated search with brand, franchise, or other metadata
   - Consider AI-based query enhancement for better results

3. **Caching Layer**:
   - Implement caching for commonly queried items
   - Reduce API calls for items with similar names

4. **Reliability Enhancements**:
   - Implement retry mechanisms for failed API calls
   - Add dead-letter queue for failed updates to retry later

5. **Analytics Integration**:
   - Track price trends over time
   - Generate insights about collection value fluctuations

6. **Performance Optimization**:
   - Parallelize API calls for faster bulk updates
   - Consider implementing a background worker model
   - Optimize database queries for large collections

7. **API Alternatives**:
   - Research and implement alternative data sources
   - Add fallback APIs when primary sources fail

8. **UI Improvements**:
   - Show price history charts
   - Add confidence scores for price estimates
   - Provide comparative price analysis

## Search Query Enhancement

The system now includes franchise information in the search query to improve result accuracy:

```typescript
// actions/ebay-actions.ts
export async function fetchEbayPrices(
  toyName: string, 
  listingType: 'listed' | 'sold', 
  condition?: 'New' | 'Used',
  franchise?: string
) {
  try {
    // Create search term that includes franchise if provided
    let searchTerm = toyName;
    if (franchise && franchise.trim() && !['Other', 'Unknown'].includes(franchise)) {
      searchTerm = `${franchise} ${toyName}`;
    }
    
    // Use enhanced search term in API call
    const url = new URL('/api/ebay', baseUrl);
    url.searchParams.append('toyName', searchTerm);
    // ... rest of implementation
  } catch (error) {
    // ... error handling
  }
}
```

## Enhanced Price Retrieval

The `getEnhancedEbayPrices` function now accepts franchise information as part of its parameters:

```typescript
export async function getEnhancedEbayPrices(
  item: { 
    title: string; 
    image?: string; 
    condition?: string;
    franchise?: string; // Added franchise parameter
  },
  includeDebugData: boolean = false
) {
  // Log search parameters including franchise
  console.log('Item details:', { 
    title: item.title, 
    franchise: item.franchise, 
    condition: item.condition 
  });
  
  // Initialize debug data with search parameters
  if (includeDebugData) {
    result.debugData = {
      searchParams: {
        title: item.title,
        imageUrl: item.image,
        condition: item.condition,
        franchise: item.franchise
      }
    };
  }
  
  // Get text-based results with franchise
  const textResults = await fetchEbayPrices(
    item.title,
    'listed',
    item.condition as 'New' | 'Used' | undefined,
    item.franchise
  );
  
  // ... rest of implementation
}
```

## Search Accuracy Improvements

1. **Franchise Integration**:
   - Search queries now include franchise information when available
   - Franchise is excluded for 'Other' and 'Unknown' categories
   - Improves result relevance for franchise-specific items

2. **Search Term Construction**:
   - Format: `${franchise} ${itemName}` (when franchise is available)
   - Example: "Transformers Optimus Prime" instead of just "Optimus Prime"
   - Helps find more accurate price matches within specific franchises

3. **Debug Information**:
   - Debug panel now shows franchise information in search parameters
   - Helps verify correct franchise inclusion in searches
   - Useful for troubleshooting search accuracy

## Future Improvement Opportunities

1. **Enhanced Franchise Handling**:
   - Implement franchise-specific search modifiers
   - Add franchise synonyms or alternative names
   - Consider franchise-specific price adjustments

2. **Search Term Optimization**:
   - Fine-tune franchise inclusion in search queries
   - Add franchise-specific keywords
   - Implement franchise-based result filtering

3. **Franchise Analytics**:
   - Track price variations by franchise
   - Analyze franchise-specific market trends
   - Generate franchise-based value insights

## Conclusion

The eBay AI pricing feature provides valuable insights into collection values by integrating with eBay's marketplace data. The system balances manual and automated updates while offering individual and bulk refresh options. Future improvements should focus on enhancing accuracy, performance, and user experience while maintaining reliability and respecting API limitations. 