/**
 * components/item-details/common/back-button.tsx
 * 
 * A navigation button that links back to a previous page.
 */

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  href: string;
  label?: string;
}

export function BackButton({
  href,
  label = "Back to Collection"
}: BackButtonProps) {
  return (
    <Link href={href} className="inline-flex items-center text-purple-400 hover:text-primary/50 mb-4 sm:mb-8">
      <ArrowLeft className="mr-2 h-4 w-4" />
      {label}
    </Link>
  );
} 