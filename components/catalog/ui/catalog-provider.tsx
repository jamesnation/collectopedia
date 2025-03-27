/*
 * CatalogProvider Component
 * 
 * This component wraps all the necessary context providers for the Catalog component.
 * It's responsible for setting up the image cache and other context providers.
 */

"use client"

import React from 'react';
import { ImageCacheProvider } from '../context/image-cache-context';

interface CatalogProviderProps {
  children: React.ReactNode;
}

export function CatalogProvider({ children }: CatalogProviderProps) {
  return (
    <ImageCacheProvider>
      {children}
    </ImageCacheProvider>
  );
}

export default CatalogProvider; 