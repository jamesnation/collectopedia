/**
 * Catalog Query Provider
 * 
 * Sets up React Query for catalog data fetching and state management.
 * Updated to use named exports per TypeScript standards.
 * Improved mutation handling to prevent stuck states.
 */

"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState, ReactNode } from "react"

export interface CatalogQueryProviderProps {
  children: ReactNode
}

export function CatalogQueryProvider({ children }: CatalogQueryProviderProps) {
  // Create a client
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 1
      },
      mutations: {
        // Set a relatively short retry timing
        retry: false,
        // Don't cache mutations to prevent stuck states - use gcTime instead of cacheTime (which is deprecated)
        gcTime: 0,
        // Prevent mutations from blocking other operations
        networkMode: 'always',
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV !== 'production' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
} 