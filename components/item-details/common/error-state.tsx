/**
 * components/item-details/common/error-state.tsx
 * 
 * An error state component that displays an error message.
 */

import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ErrorStateProps {
  message?: string;
  linkText?: string;
  linkHref?: string;
}

export function ErrorState({ 
  message = "Error: Item not found", 
  linkText = "Back to Collection",
  linkHref = "/my-collection"
}: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black/30 flex items-center justify-center">
      <div className="text-center space-y-4">
        <XCircle className="h-12 w-12 text-destructive mx-auto" />
        <p className="text-lg text-destructive">{message}</p>
        <Link href={linkHref}>
          <Button variant="outline" className="mt-4">
            {linkText}
          </Button>
        </Link>
      </div>
    </div>
  );
} 