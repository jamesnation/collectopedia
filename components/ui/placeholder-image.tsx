"use client"

import React from 'react'
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
      />
    </div>
  )
} 