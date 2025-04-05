# Collectopedia Image Optimization System

This document describes the advanced image loading and optimization system implemented in Collectopedia to provide efficient image loading, caching, and display with a focus on performance, especially on mobile. 

## Architecture Overview

The image optimization system consists of several key components:

1. **Unified Image Service** - Central service that manages all image operations
2. **OptimizedImage Component** - React component for efficiently displaying images
3. **ImageLoader Component** - Background component for managing image loading
4. **Image Cache System** - Persistence layer that works alongside the image service

## Key Featurez

### 1. Device-Aware Loading

- Detects device type (mobile, tablet, desktop) and adjusts loading strategies
- Modifies concurrent request limits based on device capabilities
- Sets appropriate memory limits for different devices

### 2. Prioritized Loading

- Implements priority levels for loading images:
  - `VISIBLE`: 100 - Currently visible in viewport
  - `NEAR_VIEWPORT`: 80 - Images just outside viewport
  - `PREFETCH`: 60 - Images likely to be viewed soon
  - `BACKGROUND`: 40 - General background loading
  - `LOW`: 20 - Low priority items

### 3. Network-Aware Loading

- Detects network quality (4G, 3G, 2G, etc.)
- Adjusts concurrent requests based on network capability
- Implements retry logic with exponential backoff

### 4. Performance Optimizations

- **Connection Preconnecting**: Establishes early connections to image domains
- **Smart Queuing**: Orders image loading by priority
- **Memory Management**: LRU cache cleanup to stay within memory limits
- **Intelligent Sizing**: Loads appropriately sized images for the display context

### 5. User Experience Enhancements

- **Progressive Loading**: Shows loading states with placeholders
- **Smart Prefetching**: Loads images near the viewport before they're needed
- **Viewport Detection**: Uses Intersection Observer to identify visible images

## Components in Detail

### Image Service (`services/image-service.ts`)

The core service that manages all image loading operations:

```typescript
// Example usage:
const imageService = useImageService();

// Load an image with priority
const { url, isLoading, isLoaded, hasError } = 
  imageService.loadImage(imageUrl, 'medium', PRIORITY.VISIBLE);

// Preload images for items
imageService.preloadItemImages(itemIds, imagesMap);

// Prioritize visible images
imageService.prioritizeVisibleImages(visibleImageUrls);
```

### OptimizedImage Component (`components/ui/optimized-image.tsx`)

A drop-in replacement for Next.js Image component with enhanced features:

```tsx
<OptimizedImage
  src={imageUrl}
  alt="Product image"
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  priority={isHighPriority}
  size="medium"
  containerClassName="w-full h-full"
/>
```

### ImageLoader Component (`components/catalog/image-loader.tsx`)

Background component for managing image loading:

```tsx
<ImageLoader 
  itemIds={items.map(item => item.id)}
  images={imagesMap}
  isLoading={isDataLoading}
/>
```

## Technical Implementation Details

### Memory Management

The system implements memory limits based on device type:

- Mobile: 50MB limit
- Tablet: 100MB limit
- Desktop: 200MB limit

When the cache size approaches these limits, the system uses an LRU (Least Recently Used) algorithm to remove older images.

### Request Concurrency

Maximum concurrent requests are dynamically adjusted:

```
Mobile:
  - 4G: 6 concurrent requests
  - 3G: 4 concurrent requests
  - 2G: 3 concurrent requests

Tablet:
  - 4G: 8 concurrent requests
  - 3G: 6 concurrent requests
  - 2G: 4 concurrent requests

Desktop:
  - 4G: 12 concurrent requests
  - 3G: 8 concurrent requests
  - 2G: 6 concurrent requests
```

### Image Sizing

The system supports multiple image sizes:

- `thumbnail`: ~10KB, for list views
- `small`: ~30KB, for grid views
- `medium`: ~100KB, for product views
- `large`: ~300KB, for detailed views

## Implementation Notes

### Browser Support

- Uses native browser features when available:
  - Network Information API
  - Intersection Observer API
  - RequestIdleCallback

- Provides fallbacks for browsers without these APIs

### Performance Metrics

The system includes built-in performance tracking, with statistics accessible via:

```typescript
const stats = imageService.getCacheStats();
// Returns: { totalImages, loadedImages, cacheSize, deviceType, networkType }
```

## How to Use

### Basic Image Display

Replace your existing Next.js `Image` components:

```tsx
// Before
<Image
  src={imageUrl}
  alt="Product image"
  width={300}
  height={300}
/>

// After
<OptimizedImage
  src={imageUrl}
  alt="Product image"
  width={300}
  height={300}
  size="medium"
/>
```

### Preloading Images

Preload images before they're needed:

```typescript
// Preload a single image
imageService.preloadImage(imageUrl);

// Preload multiple images with priorities
imageService.preloadItemImages(itemIds, imagesRecord);
```

### Prioritizing Visible Images

When images become visible:

```typescript
// Mark images as visible to load them first
imageService.prioritizeVisibleImages(visibleUrls);
```

## Future Enhancements

1. Persistent disk caching with IndexedDB
2. Adaptive quality based on connection speed
3. Integration with CDN for dynamic image resizing
4. Progressive image loading (LQIP - Low Quality Image Placeholders)
5. WebP/AVIF format detection and optimization 