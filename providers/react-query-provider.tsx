"use client";

/**
 * providers/react-query-provider.tsx
 * 
 * This component sets up TanStack Query (React Query) for the application.
 * It provides caching, retries, and optimistic updates for data fetching.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, ReactNode } from 'react';

interface ReactQueryProviderProps {
  children: ReactNode;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  // Create a client on component mount
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Global defaults
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 60, // 1 hour (formerly cacheTime)
        refetchOnWindowFocus: false, // Don't refetch on window focus
        retry: 1, // Only retry once
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      },
      mutations: {
        // Default for mutations
        retry: 1,
        retryDelay: 1000,
      }
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    </QueryClientProvider>
  );
} 