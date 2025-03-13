/**
 * components/item-details/common/loading-state.tsx
 * 
 * A loading state component that displays a spinner while content is loading.
 */

import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading item details..." }: LoadingStateProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black/30 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto" />
        <p className="mt-4 text-lg text-foreground">{message}</p>
      </div>
    </div>
  );
} 