/*
 * Unified Image Loading Service
 * 
 * This service centralizes all image loading operations for the application with:
 * - Smart request prioritization and queueing
 * - Memory and device-aware caching
 * - Mobile-optimized loading strategies
 * - Progressive loading with low-res placeholders
 * - Error handling and retry logic
 */

import { getResponsiveImageUrl, getSizedImageUrl } from '@/components/catalog/utils/image-loader';
import { SelectImage } from '@/db/schema/images-schema';

// Types for image loading status tracking
type LoadingState = 'idle' | 'loading' | 'loaded' | 'error';
type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large';
type DeviceType = 'mobile' | 'tablet' | 'desktop';
type NetworkType = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

// Interface for the image entry in the cache
interface CachedImage {
  url: string;
  optimizedUrls: Record<ImageSize, string>;
  state: LoadingState;
  loadedAt: number;
  retryCount: number;
  priority: number;
  size: number; // estimated size in bytes
}

// Priority levels
const PRIORITY = {
  VISIBLE: 100,      // Currently visible in viewport
  NEAR_VIEWPORT: 80, // Just outside viewport
  PREFETCH: 60,      // Likely to be viewed soon
  BACKGROUND: 40,    // Background loading
  LOW: 20           // Low priority items
};

// Memory limits
const MEMORY_LIMITS = {
  mobile: 50 * 1024 * 1024,  // 50MB for mobile
  tablet: 100 * 1024 * 1024, // 100MB for tablets
  desktop: 200 * 1024 * 1024 // 200MB for desktop
};

// Maximum concurrent requests
const MAX_CONCURRENT_REQUESTS = {
  mobile: {
    'slow-2g': 2,
    '2g': 3,
    '3g': 4,
    '4g': 6,
    'unknown': 4
  },
  tablet: {
    'slow-2g': 3,
    '2g': 4,
    '3g': 6,
    '4g': 8,
    'unknown': 6
  },
  desktop: {
    'slow-2g': 4,
    '2g': 6,
    '3g': 8,
    '4g': 12,
    'unknown': 8
  }
};

// Estimated image sizes for memory management (in bytes)
const ESTIMATED_SIZE = {
  thumbnail: 10 * 1024, // 10KB
  small: 30 * 1024,     // 30KB
  medium: 100 * 1024,   // 100KB
  large: 300 * 1024     // 300KB
};

class ImageService {
  private imageCache: Map<string, CachedImage> = new Map();
  private loadQueue: string[] = [];
  private activeRequests: number = 0;
  private deviceType: DeviceType = 'desktop';
  private networkType: NetworkType = 'unknown';
  private totalCacheSize: number = 0;
  private memoryLimit: number = MEMORY_LIMITS.desktop;
  private listeners: Map<string, Set<() => void>> = new Map();
  private preconnected: Set<string> = new Set();
  
  constructor() {
    this.detectDeviceType();
    this.detectNetworkType();
    this.setupEventListeners();
    
    // Set memory limit based on device type
    this.memoryLimit = MEMORY_LIMITS[this.deviceType];
    
    console.log(`[IMAGE-SERVICE] Initialized with device type: ${this.deviceType}, network: ${this.networkType}`);
    console.log(`[IMAGE-SERVICE] Memory limit set to: ${this.memoryLimit / (1024 * 1024)}MB`);
  }
  
  /**
   * Detects the device type based on screen size and user agent
   */
  private detectDeviceType(): void {
    if (typeof window === 'undefined') return;
    
    const width = window.innerWidth;
    
    // Check if mobile using user agent as well
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (width < 768 || isMobileUA) {
      this.deviceType = 'mobile';
    } else if (width < 1024) {
      this.deviceType = 'tablet';
    } else {
      this.deviceType = 'desktop';
    }
  }
  
  /**
   * Detects the network type using the Network Information API
   * or falls back to a performance-based estimate
   */
  private detectNetworkType(): void {
    if (typeof window === 'undefined') return;
    
    // Use Network Information API if available
    const connection = (navigator as any).connection;
    
    if (connection && connection.effectiveType) {
      this.networkType = connection.effectiveType as NetworkType;
      return;
    }
    
    // Fall back to performance-based estimate
    this.estimateNetworkTypeFromPerformance();
  }
  
  /**
   * Estimates network type based on performance metrics
   */
  private estimateNetworkTypeFromPerformance(): void {
    if (typeof window === 'undefined' || !window.performance) return;
    
    // Use navigation timing if available
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navTiming && navTiming.duration) {
      const loadTime = navTiming.duration;
      
      if (loadTime > 10000) {
        this.networkType = 'slow-2g';
      } else if (loadTime > 5000) {
        this.networkType = '2g';
      } else if (loadTime > 2000) {
        this.networkType = '3g';
      } else {
        this.networkType = '4g';
      }
    }
  }
  
  /**
   * Sets up event listeners for network and visibility changes
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;
    
    // Listen for network changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', () => {
        this.detectNetworkType();
        console.log(`[IMAGE-SERVICE] Network changed to: ${this.networkType}`);
      });
    }
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.processPendingRequests();
      } else {
        // Reduce processing when page is not visible
        this.pauseNonEssentialLoading();
      }
    });
    
    // Listen for resize to detect device type changes
    window.addEventListener('resize', this.throttle((): void => {
      const previousDeviceType = this.deviceType;
      this.detectDeviceType();
      
      if (previousDeviceType !== this.deviceType) {
        console.log(`[IMAGE-SERVICE] Device type changed from ${previousDeviceType} to ${this.deviceType}`);
        this.memoryLimit = MEMORY_LIMITS[this.deviceType];
      }
    }, 500));
  }
  
  /**
   * Create a throttled function that doesn't execute more often than specified
   */
  private throttle(func: Function, limit: number): EventListener {
    let lastCall = 0;
    return function(this: any, ...args: any[]) {
      const now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        func.apply(this, args);
      }
    } as EventListener;
  }
  
  /**
   * Preconnects to known image domains to speed up requests
   */
  public preconnectToImageDomains(urls: string[]): void {
    if (typeof document === 'undefined') return;
    
    urls.forEach(url => {
      try {
        // Extract domain from URL
        const domain = new URL(url).origin;
        
        // Skip if already preconnected
        if (this.preconnected.has(domain)) return;
        
        // Create preconnect link
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
        
        this.preconnected.add(domain);
        console.log(`[IMAGE-SERVICE] Preconnected to: ${domain}`);
      } catch (e) {
        // Ignore invalid URLs
      }
    });
  }
  
  /**
   * Pauses loading of non-essential images when the page is not visible
   */
  private pauseNonEssentialLoading(): void {
    this.loadQueue = this.loadQueue.filter(id => {
      const image = this.imageCache.get(id);
      return image && image.priority >= PRIORITY.VISIBLE;
    });
  }
  
  /**
   * Processes the pending image requests based on priority
   */
  private processPendingRequests(): void {
    if (this.loadQueue.length === 0 || 
        this.activeRequests >= MAX_CONCURRENT_REQUESTS[this.deviceType][this.networkType]) {
      return;
    }
    
    // Sort queue by priority
    this.loadQueue.sort((a, b) => {
      const imgA = this.imageCache.get(a);
      const imgB = this.imageCache.get(b);
      return (imgB?.priority || 0) - (imgA?.priority || 0);
    });
    
    // Process as many requests as allowed
    while (
      this.loadQueue.length > 0 && 
      this.activeRequests < MAX_CONCURRENT_REQUESTS[this.deviceType][this.networkType]
    ) {
      const id = this.loadQueue.shift();
      if (id) {
        this.loadImageFromCache(id);
      }
    }
  }
  
  /**
   * Loads an image from the cache, updating its state
   */
  private loadImageFromCache(id: string): void {
    const cachedImage = this.imageCache.get(id);
    if (!cachedImage || cachedImage.state === 'loaded') return;
    
    cachedImage.state = 'loading';
    this.activeRequests++;
    
    const img = new Image();
    const optimizedUrl = cachedImage.optimizedUrls.medium;
    
    img.onload = () => {
      if (this.imageCache.has(id)) {
        const updatedImage = this.imageCache.get(id)!;
        updatedImage.state = 'loaded';
        updatedImage.loadedAt = Date.now();
        this.notifyListeners(id);
      }
      this.activeRequests--;
      this.processPendingRequests();
    };
    
    img.onerror = () => {
      if (this.imageCache.has(id)) {
        const updatedImage = this.imageCache.get(id)!;
        updatedImage.state = 'error';
        updatedImage.retryCount++;
        
        // Retry with exponential backoff if under retry limit
        if (updatedImage.retryCount < 3) {
          console.log(`[IMAGE-SERVICE] Retrying image: ${id}, attempt: ${updatedImage.retryCount}`);
          setTimeout(() => {
            this.loadQueue.push(id);
            this.processPendingRequests();
          }, Math.pow(2, updatedImage.retryCount) * 1000);
        } else {
          console.error(`[IMAGE-SERVICE] Failed to load image after retries: ${id}`);
          this.notifyListeners(id);
        }
      }
      this.activeRequests--;
      this.processPendingRequests();
    };
    
    img.src = optimizedUrl;
  }
  
  /**
   * Preloads item images with appropriate sizing for future use
   * @param itemIds Array of item IDs to preload
   * @param images Map of item IDs to their image data
   * @param priority Loading priority
   */
  public preloadItemImages(
    itemIds: string[], 
    images: Record<string, SelectImage[]>,
    priority: number = PRIORITY.BACKGROUND
  ): void {
    // Skip if no items
    if (!itemIds.length) return;
    
    // Extract all image URLs
    const imageUrls: string[] = [];
    const imagesByItem: Record<string, string[]> = {};
    
    itemIds.forEach(itemId => {
      // Skip if no images for this item
      if (!images[itemId] || !images[itemId].length) return;
      
      const itemImages = images[itemId].map(img => img.url);
      imagesByItem[itemId] = itemImages;
      imageUrls.push(...itemImages);
    });
    
    // Preconnect to image domains
    this.preconnectToImageDomains(imageUrls);
    
    // Preload primary images first with higher priority
    itemIds.forEach(itemId => {
      const itemImages = imagesByItem[itemId];
      
      if (!itemImages || !itemImages.length) return;
      
      // Primary image has higher priority
      this.preloadImage(itemImages[0], priority);
      
      // Secondary images with lower priority
      if (itemImages.length > 1) {
        itemImages.slice(1).forEach(url => {
          this.preloadImage(url, priority - 20);
        });
      }
    });
  }
  
  /**
   * Preloads a single image with the given priority
   */
  public preloadImage(url: string, priority: number = PRIORITY.BACKGROUND): void {
    if (!url) return;
    
    const id = this.getImageId(url);
    
    // Skip if already loaded or loading with higher priority
    if (this.imageCache.has(id)) {
      const existing = this.imageCache.get(id)!;
      
      if (existing.state === 'loaded' || existing.state === 'loading' && existing.priority >= priority) {
        return;
      }
      
      // Update priority if higher
      if (priority > existing.priority) {
        existing.priority = priority;
        
        // Reprocess queue if priority increased
        if (existing.state === 'idle') {
          this.processPendingRequests();
        }
      }
      
      return;
    }
    
    // Generate optimized URLs for different sizes
    const optimizedUrls: Record<ImageSize, string> = {
      thumbnail: getResponsiveImageUrl(url, 'thumbnail'),
      small: getResponsiveImageUrl(url, 'small'),
      medium: getResponsiveImageUrl(url, 'medium'),
      large: getResponsiveImageUrl(url, 'large')
    };
    
    // Add to cache
    this.imageCache.set(id, {
      url,
      optimizedUrls,
      state: 'idle',
      loadedAt: 0,
      retryCount: 0,
      priority,
      size: ESTIMATED_SIZE.medium,
    });
    
    // Update total cache size
    this.totalCacheSize += ESTIMATED_SIZE.medium;
    
    // Check if we need to clean up cache
    if (this.totalCacheSize > this.memoryLimit) {
      this.cleanupCache();
    }
    
    // Add to load queue
    this.loadQueue.push(id);
    
    // Process queue
    this.processPendingRequests();
  }
  
  /**
   * Cleans up the cache by removing least recently used images
   */
  private cleanupCache(): void {
    // Sort cache entries by loadedAt (oldest first)
    const entries = Array.from(this.imageCache.entries())
      .filter(([id, image]) => image.state === 'loaded') // Only clean loaded images
      .sort(([idA, a], [idB, b]) => a.loadedAt - b.loadedAt);
    
    // Target size is 80% of memory limit
    const targetSize = this.memoryLimit * 0.8;
    
    // Remove entries until we're under target size
    while (this.totalCacheSize > targetSize && entries.length > 0) {
      const [id, image] = entries.shift()!;
      this.imageCache.delete(id);
      this.totalCacheSize -= image.size;
      
      console.log(`[IMAGE-SERVICE] Removed image from cache: ${id}`);
    }
    
    console.log(`[IMAGE-SERVICE] Cache cleanup complete, current size: ${this.totalCacheSize / 1024}KB`);
  }
  
  /**
   * Gets optimized image URL at the specified size
   */
  public getOptimizedImageUrl(url: string, size: ImageSize = 'medium'): string {
    if (!url) return '';
    
    const id = this.getImageId(url);
    const cachedImage = this.imageCache.get(id);
    
    if (cachedImage) {
      return cachedImage.optimizedUrls[size];
    }
    
    // If not in cache, generate on the fly
    return getResponsiveImageUrl(url, size);
  }
  
  /**
   * Loads an image and returns an optimized URL along with loading state
   */
  public loadImage(
    url: string, 
    size: ImageSize = 'medium',
    priority: number = PRIORITY.BACKGROUND
  ): { url: string, isLoading: boolean, isLoaded: boolean, hasError: boolean } {
    if (!url) {
      return { 
        url: '', 
        isLoading: false, 
        isLoaded: false, 
        hasError: false 
      };
    }
    
    // Start preloading with the specified priority
    this.preloadImage(url, priority);
    
    const id = this.getImageId(url);
    const cachedImage = this.imageCache.get(id);
    
    if (!cachedImage) {
      return { 
        url: getResponsiveImageUrl(url, size), 
        isLoading: true, 
        isLoaded: false, 
        hasError: false 
      };
    }
    
    return {
      url: cachedImage.optimizedUrls[size],
      isLoading: cachedImage.state === 'loading',
      isLoaded: cachedImage.state === 'loaded',
      hasError: cachedImage.state === 'error'
    };
  }
  
  /**
   * Subscribe to image load events
   */
  public subscribe(imageUrl: string, callback: () => void): () => void {
    const id = this.getImageId(imageUrl);
    
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set());
    }
    
    this.listeners.get(id)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(id);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }
  
  /**
   * Notify listeners of image load/error events
   */
  private notifyListeners(id: string): void {
    const listeners = this.listeners.get(id);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback();
        } catch (e) {
          console.error(`[IMAGE-SERVICE] Error in listener callback for ${id}:`, e);
        }
      });
    }
  }
  
  /**
   * Generates a unique ID for an image URL
   */
  private getImageId(url: string): string {
    return url.trim();
  }
  
  /**
   * Increases the loading priority for images currently in viewport
   */
  public prioritizeVisibleImages(imageUrls: string[]): void {
    imageUrls.forEach(url => {
      const id = this.getImageId(url);
      const cachedImage = this.imageCache.get(id);
      
      if (cachedImage) {
        // Increase priority
        cachedImage.priority = PRIORITY.VISIBLE;
        
        // If not yet loaded, move to front of queue
        if (cachedImage.state !== 'loaded') {
          // Remove from current position in queue
          this.loadQueue = this.loadQueue.filter(queuedId => queuedId !== id);
          // Add to front of queue
          this.loadQueue.unshift(id);
        }
      } else {
        // Not in cache yet, preload with high priority
        this.preloadImage(url, PRIORITY.VISIBLE);
      }
    });
    
    // Reprocess queue with new priorities
    this.processPendingRequests();
  }
  
  /**
   * Prepare image URLs for the viewport with a prefetch strategy
   * This is useful for image galleries or carousels
   */
  public prepareImagesForViewport(
    currentImageUrl: string,
    nearbyImageUrls: string[],
    size: ImageSize = 'medium'
  ): void {
    // Load current image with highest priority
    this.preloadImage(currentImageUrl, PRIORITY.VISIBLE);
    
    // Load nearby images with high priority
    nearbyImageUrls.forEach((url, index) => {
      // Decrease priority as index increases (further away items have lower priority)
      const priority = PRIORITY.NEAR_VIEWPORT - (index * 5);
      this.preloadImage(url, priority);
    });
  }
  
  /**
   * Purges an image from the cache
   */
  public purgeFromCache(url: string): void {
    const id = this.getImageId(url);
    
    if (this.imageCache.has(id)) {
      const image = this.imageCache.get(id)!;
      this.totalCacheSize -= image.size;
      this.imageCache.delete(id);
      
      // Remove from load queue
      this.loadQueue = this.loadQueue.filter(queuedId => queuedId !== id);
      
      console.log(`[IMAGE-SERVICE] Purged image from cache: ${id}`);
    }
  }
  
  /**
   * Gets the current number of images in cache
   */
  public getCacheStats(): { 
    totalImages: number, 
    loadedImages: number, 
    cacheSize: string,
    deviceType: string,
    networkType: string
  } {
    const loadedImages = Array.from(this.imageCache.values())
      .filter(img => img.state === 'loaded')
      .length;
    
    return {
      totalImages: this.imageCache.size,
      loadedImages,
      cacheSize: `${(this.totalCacheSize / (1024 * 1024)).toFixed(2)}MB`,
      deviceType: this.deviceType,
      networkType: this.networkType
    };
  }
}

// Create a singleton instance
export const imageService = typeof window !== 'undefined' ? new ImageService() : null;

// Hook for React components
export function useImageService() {
  if (typeof window === 'undefined') {
    // Return empty implementation for SSR
    return {
      loadImage: () => ({ url: '', isLoading: false, isLoaded: false, hasError: false }),
      preloadImage: () => {},
      preloadItemImages: () => {},
      prioritizeVisibleImages: () => {},
      prepareImagesForViewport: () => {},
      getCacheStats: () => ({ 
        totalImages: 0, 
        loadedImages: 0, 
        cacheSize: '0MB',
        deviceType: 'unknown',
        networkType: 'unknown'
      })
    };
  }
  
  return imageService!;
} 