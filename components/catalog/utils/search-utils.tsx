/**
 * Search Utilities - Helper functions and components for search functionality
 */

import React from 'react';

/**
 * Props for the HighlightedText component
 */
interface HighlightedTextProps {
  text: string;
  searchQuery: string;
  highlightClassName?: string;
}

/**
 * Component that renders text with highlighted search terms
 * @param text The text to render
 * @param searchQuery The search query to highlight
 * @param highlightClassName CSS class to apply to highlighted text
 */
export function HighlightedText({ 
  text, 
  searchQuery, 
  highlightClassName = 'bg-yellow-200 dark:bg-yellow-800 rounded px-0.5'
}: HighlightedTextProps) {
  // If no search query or text, just return the text
  if (!searchQuery?.trim() || !text) {
    return <>{text}</>;
  }
  
  // Split search query into terms
  const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);
  
  try {
    // Create regex pattern for all terms
    const pattern = new RegExp(
      `(${searchTerms
        .filter(term => term.length > 0)
        .map(term => term
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
        )
        .join('|')})`, 
      'gi'
    );
    
    // Split text by the search pattern
    const parts = text.split(pattern);
    
    // If no matches found, return the original text
    if (parts.length === 1) {
      return <>{text}</>;
    }
    
    // Create highlighted text
    return (
      <>
        {parts.map((part, i) => {
          // Check if this part matches any search term
          const isMatch = searchTerms.some(term => 
            part.toLowerCase() === term
          );
          
          return isMatch ? (
            <span key={i} className={highlightClassName}>{part}</span>
          ) : (
            <span key={i}>{part}</span>
          );
        })}
      </>
    );
  } catch (error) {
    // In case of regex errors, return the original text
    console.error('Error highlighting text:', error);
    return <>{text}</>;
  }
}

/**
 * Helper function to check if text contains search terms
 * @param text The text to check
 * @param searchQuery The search query to look for
 * @returns boolean indicating if the text contains the search terms
 */
export function textContainsSearchTerms(text: string, searchQuery: string): boolean {
  if (!searchQuery?.trim() || !text) {
    return false;
  }
  
  const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);
  
  return searchTerms.every(term => 
    text.toLowerCase().includes(term)
  );
} 