/**
 * Active Filters Component
 * 
 * Displays currently active filters with the ability to remove individual filters
 * or clear all filters at once.
 */

'use client';

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, FilterX } from 'lucide-react';
import { FilterState } from '../context/catalog-context';

interface ActiveFiltersProps {
  filters: FilterState;
  onClearFilter: (key: keyof FilterState) => void;
  onClearAllFilters: () => void;
  filterLabels?: Record<keyof FilterState, string>;
  className?: string;
}

export default function ActiveFilters({
  filters,
  onClearFilter,
  onClearAllFilters,
  filterLabels = {
    search: 'Search',
    type: 'Type',
    franchise: 'Franchise',
    year: 'Year',
    showSold: 'Sold Items',
    soldYear: 'Sold Year',
    showWithImages: 'Has Images',
  },
  className = "",
}: ActiveFiltersProps) {
  // Helper to determine if any filters are active
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'showSold' || key === 'showWithImages') {
      return value === true;
    }
    return !!value;
  });
  
  if (!hasActiveFilters) {
    return null;
  }
  
  return (
    <div className={`flex flex-wrap gap-2 items-center ${className}`}>
      <span className="text-sm text-muted-foreground">Active Filters:</span>
      
      {/* Search filter */}
      {filters.search && (
        <Badge variant="secondary" className="flex items-center gap-1">
          {filterLabels.search}: {filters.search}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 ml-1"
            onClick={() => onClearFilter('search')}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {filterLabels.search} filter</span>
          </Button>
        </Badge>
      )}
      
      {/* Type filter */}
      {filters.type && (
        <Badge variant="secondary" className="flex items-center gap-1">
          {filterLabels.type}: {filters.type}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 ml-1"
            onClick={() => onClearFilter('type')}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {filterLabels.type} filter</span>
          </Button>
        </Badge>
      )}
      
      {/* Franchise filter */}
      {filters.franchise && (
        <Badge variant="secondary" className="flex items-center gap-1">
          {filterLabels.franchise}: {filters.franchise}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 ml-1"
            onClick={() => onClearFilter('franchise')}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {filterLabels.franchise} filter</span>
          </Button>
        </Badge>
      )}
      
      {/* Year filter */}
      {filters.year && (
        <Badge variant="secondary" className="flex items-center gap-1">
          {filterLabels.year}: {filters.year}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 ml-1"
            onClick={() => onClearFilter('year')}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {filterLabels.year} filter</span>
          </Button>
        </Badge>
      )}
      
      {/* Sold Year filter - only show if showSold is true */}
      {filters.showSold && filters.soldYear && (
        <Badge variant="secondary" className="flex items-center gap-1">
          {filterLabels.soldYear}: {filters.soldYear}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 ml-1"
            onClick={() => onClearFilter('soldYear')}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {filterLabels.soldYear} filter</span>
          </Button>
        </Badge>
      )}
      
      {/* Toggle filters */}
      {filters.showWithImages && (
        <Badge variant="secondary" className="flex items-center gap-1">
          {filterLabels.showWithImages}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 ml-1"
            onClick={() => onClearFilter('showWithImages')}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {filterLabels.showWithImages} filter</span>
          </Button>
        </Badge>
      )}
      
      {/* Clear all filters button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onClearAllFilters}
        className="ml-auto"
      >
        <FilterX className="h-4 w-4 mr-2" />
        Clear All
      </Button>
    </div>
  );
} 