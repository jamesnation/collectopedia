/**
 * Search Input Component
 * 
 * A specialized input for search with keyboard shortcut support.
 * Updated to use named exports per TypeScript standards.
 */

'use client';

import React, { useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { Input } from "@/components/ui/input";
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showClearButton?: boolean;
  autoFocus?: boolean;
  debounce?: number;
  showShortcutHint?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  showClearButton = true,
  autoFocus = false,
  debounce = 300,
  showShortcutHint = false,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle input change with debounce
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a new timer
    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounce);
  };

  // Handle keyboard events (shortcuts)
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Press / to focus search input when not already focused
    if (e.key === '/' && document.activeElement !== inputRef.current) {
      e.preventDefault();
      inputRef.current?.focus();
    }
    
    // Press Escape to clear search and blur input
    if (e.key === 'Escape') {
      if (localValue) {
        e.preventDefault();
        handleClear();
      } else {
        inputRef.current?.blur();
      }
    }
  };

  // Handle clear button click
  const handleClear = () => {
    setLocalValue('');
    onChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Add keyboard shortcut listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === '/' && e.target === document.body) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  // Auto focus on mount if needed
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className={`relative flex-grow ${className}`}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="pl-8 pr-12"
          aria-label="Search"
        />
        
        {showClearButton && localValue && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1.5 h-6 w-6 p-0"
            onClick={handleClear}
            type="button"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Keyboard shortcut hint */}
      {showShortcutHint && (
        <div className="absolute right-3 top-2.5 text-xs text-muted-foreground">
          Press &quot;/&quot;
        </div>
      )}
    </div>
  );
} 