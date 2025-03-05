"use client"

import React, { useEffect } from 'react'
import Image from 'next/image'

// Small, optimized placeholder SVG as static asset
export const PLACEHOLDER_IMAGE_PATH = '/images/no-image.svg'

// Simple placeholder component with enhanced performance
export function PlaceholderImage({ 
  className = "", 
  width, 
  height
}: { 
  className?: string, 
  width?: number, 
  height?: number
}) {
  // Log when the component renders
  console.log('[PLACEHOLDER] Rendering placeholder image', { width, height, className });
  
  // Log when the component mounts/unmounts
  useEffect(() => {
    console.log('[PLACEHOLDER] Placeholder image mounted', { width, height });
    return () => {
      console.log('[PLACEHOLDER] Placeholder image unmounted', { width, height });
    };
  }, [width, height]);
  
  // If width and height are provided, use them directly
  // Otherwise, fill the container
  const style = width !== undefined && height !== undefined
    ? { width, height }
    : { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  
  return (
    <div 
      className={`flex items-center justify-center bg-gray-200 dark:bg-gray-800 ${className}`}
      style={style}
    >
      <Image
        src={PLACEHOLDER_IMAGE_PATH}
        alt="No image available"
        width={width ? width * 0.6 : 48}
        height={height ? height * 0.6 : 48}
        priority={true} // Ensures fast loading
        loading="eager" // Forces immediate loading
        unoptimized={true} // Skip image optimization for SVGs since they're already optimized
        onLoad={() => console.log('[PLACEHOLDER] SVG image loaded')}
      />
    </div>
  )
} 