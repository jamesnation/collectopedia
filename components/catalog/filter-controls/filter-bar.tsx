/**
 * Filter Bar Component
 * 
 * This component provides the main filter controls for the catalog,
 * including search, type filters, franchise filters, etc.
 */

'use client';

import React, { useCallback } from 'react';
import { useCatalogContext, FilterState } from '../context/catalog-context';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Grid, List, Search, Filter, X, FilterX, 
  Image as ImageIcon 
} from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import SearchInput from './search-input';
import FilterDropdown from './filter-dropdown';
import ActiveFilters from './active-filters';
import { Badge } from "@/components/ui/badge";
import { itemTypeEnum, franchiseEnum } from "@/db/schema/items-schema";

/**
 * Filter bar that contains all filtering and view controls
 */
export default function FilterBar() {
  const {
    filters,
    setFilters,
    clearFilters,
    viewType,
    setViewType,
    customTypes,
    customFranchises,
    availableYears,
    availableSoldYears,
    totalItems
  } = useCatalogContext();

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    // Create a new filters object with the updated search value
    const newFilters = { ...filters, search: value };
    setFilters(newFilters);
  }, [filters, setFilters]);

  // Handle type filter change
  const handleTypeChange = useCallback((value: string) => {
    setFilters({ ...filters, type: value });
  }, [filters, setFilters]);

  // Handle franchise filter change
  const handleFranchiseChange = useCallback((value: string) => {
    setFilters({ ...filters, franchise: value });
  }, [filters, setFilters]);

  // Handle year filter change
  const handleYearChange = useCallback((value: string) => {
    setFilters({ ...filters, year: value });
  }, [filters, setFilters]);

  // Handle sold year filter change
  const handleSoldYearChange = useCallback((value: string) => {
    setFilters({ ...filters, soldYear: value });
  }, [filters, setFilters]);

  // Handle show sold toggle
  const handleShowSoldChange = useCallback((checked: boolean) => {
    setFilters({ ...filters, showSold: checked });
  }, [filters, setFilters]);

  // Handle show with images toggle
  const handleShowWithImagesChange = useCallback((checked: boolean) => {
    setFilters({ ...filters, showWithImages: checked });
  }, [filters, setFilters]);

  // Check if any filters are active
  const hasActiveFilters = filters.search || 
    filters.type || 
    filters.franchise || 
    filters.year || 
    filters.soldYear || 
    filters.showWithImages;

  // Clear individual filter
  const handleClearFilter = (key: keyof typeof filters) => {
    const newFilters = { ...filters };
    if (key === 'showSold' || key === 'showWithImages') {
      newFilters[key] = false;
    } else {
      newFilters[key] = '';
    }
    setFilters(newFilters);
  };

  return (
    <div className="space-y-4">
      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <SearchInput
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search your collection..."
            className="flex-grow"
            showShortcutHint={false}
          />
          {filters.search && (
            <Badge className="absolute right-12 top-2 bg-primary/20 text-foreground hover:bg-primary/30">
              {totalItems} {totalItems === 1 ? 'result' : 'results'}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewType === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewType('grid')}
            title="Grid View"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewType === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewType('list')}
            title="List View"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dropdown Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Type Filter */}
        <FilterDropdown
          value={filters.type}
          onChange={handleTypeChange}
          options={[...itemTypeEnum.enumValues, ...customTypes.map(t => t.name)]}
          label="Type"
          placeholder="All Types"
        />

        {/* Franchise Filter */}
        <FilterDropdown
          value={filters.franchise}
          onChange={handleFranchiseChange}
          options={[...franchiseEnum.enumValues, ...customFranchises.map(f => f.name)]}
          label="Franchise"
          placeholder="All Franchises"
        />

        {/* Year Filter */}
        <FilterDropdown
          value={filters.year}
          onChange={handleYearChange}
          options={availableYears || []}
          label="Year"
          placeholder="All Years"
        />

        {/* Sold Year Filter - Only show when showSold is true */}
        {filters.showSold && (
          <FilterDropdown
            value={filters.soldYear}
            onChange={handleSoldYearChange}
            options={availableSoldYears || []}
            label="Sold Year"
            placeholder="All Sold Years"
          />
        )}
      </div>

      {/* Toggle Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Show Sold Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="show-sold"
            checked={filters.showSold}
            onCheckedChange={handleShowSoldChange}
          />
          <Label htmlFor="show-sold">Show Sold Items</Label>
        </div>

        {/* Show With Images Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="show-with-images"
            checked={filters.showWithImages}
            onCheckedChange={handleShowWithImagesChange}
          />
          <Label htmlFor="show-with-images">Only Items With Images</Label>
        </div>

        {/* Clear Filters Button - Only show when filters are active */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="ml-auto"
          >
            <FilterX className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <ActiveFilters
          filters={filters}
          onClearFilter={handleClearFilter}
          onClearAllFilters={clearFilters}
          className="mt-2"
        />
      )}
    </div>
  );
} 