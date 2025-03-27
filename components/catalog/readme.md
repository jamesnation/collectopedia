# Catalog Component Refactoring

This folder contains the refactored implementation of the Catalog component. The original monolithic component has been broken down into smaller, more manageable pieces, following the same approach used in the Item Details refactoring.

## Folder Structure

- `/context` - Context providers for state that needs to be shared across components
- `/hooks` - Custom hooks for managing state and side effects
- `/ui` - UI components that make up the Catalog page
- `/utils` - Utility functions for the Catalog page
- `index.tsx` - Main entry point that composes the page from the components
- `image-loader.tsx` - Specialized component for handling image loading (preserved as-is)

## Implementation Overview

The refactoring follows these principles:

1. **Separation of concerns** - Business logic is separated from UI code
2. **Reusability** - Components are designed to be reusable where possible
3. **Maintainability** - Smaller, focused components are easier to understand and maintain
4. **Performance** - Using custom hooks helps optimize rendering

## Refactoring Process

### Phase 1: Preparation
- Created a backup file (index.tsx.bak.20240627) before making changes
- Created this README file to document the approach

### Phase 2: Structure Creation
- Reorganized the folder structure
- Extracted UI components to their own files
- Extracted business logic to custom hooks
- Implemented consistent prop interfaces

### Phase 3: Integration
- Integrated all components with their respective hooks
- Connected the real hook implementations to the index.tsx file
- Fixed prop type issues between components
- Ensured all functionality works as expected

## Components

- **CatalogProvider** - Wrapper for context providers
- **FilterBar** - Contains all filtering controls
- **SummaryPanel** - Displays statistics about the collection
- **ItemListView** - List view of items
- **ItemGridView** - Grid view of items
- **AddItemModal** - Modal for adding items
- **ImageLoader** - Specialized component for handling image loading (preserved with minimal changes)

## Hooks

- **useCatalogItems** - Manages item fetching and state
- **useCatalogFilters** - Manages filtering and sorting of items  
- **useCustomEntities** - Manages custom types, franchises, and brands
- **usePersistentFilters** - Manages persistent storage of filters
- **useImageCache** - Manages the image cache (context hook)

## Image Loading System

The image loading system is a critical component that's been preserved as much as possible during refactoring. It consists of:

1. **ImageCacheContext** - Context provider for caching images
2. **ImageLoader** - Component that handles efficient loading of images
3. **useImageService** - Service for interacting with the image API

These components work together to provide efficient image loading with features such as:
- Local storage caching to reduce network requests
- Batch loading to minimize API calls
- Prioritization of visible images
- Detection of stale images that need refreshing 