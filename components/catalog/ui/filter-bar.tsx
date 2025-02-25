import { useState, useEffect } from 'react';
import { Search, Filter, LayoutGrid, LayoutList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CustomEntity } from '../utils/schema-adapter';

interface FilterBarProps {
  view: 'list' | 'grid';
  setView: (view: 'list' | 'grid') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  franchiseFilter: string;
  setFranchiseFilter: (franchise: string) => void;
  yearFilter: string;
  setYearFilter: (year: string) => void;
  showSold: boolean;
  setShowSold: (show: boolean) => void;
  soldYearFilter: string;
  setSoldYearFilter: (year: string) => void;
  availableYears: number[];
  availableSoldYears: number[];
  defaultTypeOptions: string[];
  customTypes: CustomEntity[];
  defaultFranchiseOptions: string[];
  customFranchises: CustomEntity[];
}

export function FilterBar({
  view,
  setView,
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  franchiseFilter,
  setFranchiseFilter,
  yearFilter,
  setYearFilter,
  showSold,
  setShowSold,
  soldYearFilter,
  setSoldYearFilter,
  availableYears,
  availableSoldYears,
  defaultTypeOptions,
  customTypes,
  defaultFranchiseOptions,
  customFranchises
}: FilterBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  useEffect(() => {
    setYearFilter('all');
    setSoldYearFilter('all');
  }, [showSold, setYearFilter, setSoldYearFilter]);
  
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
      <div className="relative w-full sm:w-auto flex-1 max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search your collection..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto justify-end">
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Filters</h4>
                <p className="text-sm text-muted-foreground">
                  Narrow down your collection view
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-sold"
                  checked={showSold}
                  onCheckedChange={setShowSold}
                />
                <Label htmlFor="show-sold">Show Sold Items</Label>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="type-filter">Type</Label>
                <Select
                  value={typeFilter}
                  onValueChange={setTypeFilter}
                >
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {defaultTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                    {customTypes.map((type) => (
                      <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="franchise-filter">Franchise</Label>
                <Select
                  value={franchiseFilter}
                  onValueChange={setFranchiseFilter}
                >
                  <SelectTrigger id="franchise-filter">
                    <SelectValue placeholder="All Franchises" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Franchises</SelectItem>
                    {defaultFranchiseOptions.map((franchise) => (
                      <SelectItem key={franchise} value={franchise}>{franchise}</SelectItem>
                    ))}
                    {customFranchises.map((franchise) => (
                      <SelectItem key={franchise.id} value={franchise.name}>{franchise.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="year-filter">
                  {showSold ? 'Sold Year' : 'Year'}
                </Label>
                <Select
                  value={showSold ? soldYearFilter : yearFilter}
                  onValueChange={showSold ? setSoldYearFilter : setYearFilter}
                >
                  <SelectTrigger id="year-filter">
                    <SelectValue placeholder={`All ${showSold ? 'Sold ' : ''}Years`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{`All ${showSold ? 'Sold ' : ''}Years`}</SelectItem>
                    {(showSold ? availableSoldYears : availableYears).map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setTypeFilter('all');
                  setFranchiseFilter('all');
                  setYearFilter('all');
                  setSoldYearFilter('all');
                  setIsFilterOpen(false);
                }}
              >
                Reset Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="border rounded-md flex">
          <Toggle
            pressed={view === 'list'}
            onPressedChange={() => setView('list')}
            aria-label="List view"
            className="rounded-none rounded-l-md"
          >
            <LayoutList className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={view === 'grid'}
            onPressedChange={() => setView('grid')}
            aria-label="Grid view"
            className="rounded-none rounded-r-md"
          >
            <LayoutGrid className="h-4 w-4" />
          </Toggle>
        </div>
      </div>
    </div>
  );
} 