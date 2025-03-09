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
  showWithImages: boolean;
  setShowWithImages: (show: boolean) => void;
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
  customFranchises,
  showWithImages,
  setShowWithImages
}: FilterBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  useEffect(() => {
    setYearFilter('all');
    setSoldYearFilter('all');
  }, [showSold, setYearFilter, setSoldYearFilter]);
  
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
      <div className="relative w-full sm:w-auto flex-1 max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground dark:text-gray-400" />
        <Input
          type="search"
          placeholder="Search your collection..."
          className="pl-8 dark:bg-gray-750 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:dark:border-purple-300/50 dark:focus-visible:ring-purple-300/20"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto justify-end">
        <div className="flex items-center border rounded-md px-2 py-1 dark:border-gray-600 dark:bg-gray-750">
          <Switch
            id="show-sold-external"
            checked={showSold}
            onCheckedChange={setShowSold}
            className="data-[state=checked]:dark:bg-purple-600 mr-2"
          />
          <Label htmlFor="show-sold-external" className="text-sm dark:text-white whitespace-nowrap">Show Sold</Label>
        </div>

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 dark:bg-gray-750 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700 dark:hover:border-purple-300/30">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 dark:bg-gray-750 dark:border-gray-600 dark:shadow-purple-900/10 dark:shadow-md">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium dark:text-white">Filters</h4>
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  Narrow down your collection view
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-with-images"
                  checked={showWithImages}
                  onCheckedChange={setShowWithImages}
                  className="data-[state=checked]:dark:bg-purple-600"
                />
                <Label htmlFor="show-with-images" className="dark:text-white">Has Images Only</Label>
              </div>
              
              <div className="text-xs text-muted-foreground dark:text-gray-400 ml-6 -mt-1 mb-3">
                Show only items with uploaded images
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="type-filter" className="dark:text-white">Type</Label>
                <Select
                  value={typeFilter}
                  onValueChange={setTypeFilter}
                >
                  <SelectTrigger id="type-filter" className="dark:bg-gray-750 dark:border-gray-600 dark:text-white focus:dark:ring-purple-300/20">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-750 dark:border-gray-600">
                    <SelectItem value="all" className="dark:text-white dark:focus:bg-purple-900/20">All Types</SelectItem>
                    {defaultTypeOptions.map((type) => (
                      <SelectItem key={type} value={type} className="dark:text-white dark:focus:bg-purple-900/20">{type}</SelectItem>
                    ))}
                    {customTypes.map((type) => (
                      <SelectItem key={type.id} value={type.name} className="dark:text-white dark:focus:bg-purple-900/20">{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="franchise-filter" className="dark:text-white">Franchise</Label>
                <Select
                  value={franchiseFilter}
                  onValueChange={setFranchiseFilter}
                >
                  <SelectTrigger id="franchise-filter" className="dark:bg-gray-750 dark:border-gray-600 dark:text-white focus:dark:ring-purple-300/20">
                    <SelectValue placeholder="All Franchises" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-750 dark:border-gray-600">
                    <SelectItem value="all" className="dark:text-white dark:focus:bg-purple-900/20">All Franchises</SelectItem>
                    {defaultFranchiseOptions.map((franchise) => (
                      <SelectItem key={franchise} value={franchise} className="dark:text-white dark:focus:bg-purple-900/20">{franchise}</SelectItem>
                    ))}
                    {customFranchises.map((franchise) => (
                      <SelectItem key={franchise.id} value={franchise.name} className="dark:text-white dark:focus:bg-purple-900/20">{franchise.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="year-filter" className="dark:text-white">
                  {showSold ? 'Sold Year' : 'Year'}
                </Label>
                <Select
                  value={showSold ? soldYearFilter : yearFilter}
                  onValueChange={showSold ? setSoldYearFilter : setYearFilter}
                >
                  <SelectTrigger id="year-filter" className="dark:bg-gray-750 dark:border-gray-600 dark:text-white focus:dark:ring-purple-300/20">
                    <SelectValue placeholder={`All ${showSold ? 'Sold ' : ''}Years`} />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-750 dark:border-gray-600">
                    <SelectItem value="all" className="dark:text-white dark:focus:bg-purple-900/20">{`All ${showSold ? 'Sold ' : ''}Years`}</SelectItem>
                    {(showSold ? availableSoldYears : availableYears).map((year) => (
                      <SelectItem key={year} value={year.toString()} className="dark:text-white dark:focus:bg-purple-900/20">{year}</SelectItem>
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
                  setShowWithImages(false);
                  setIsFilterOpen(false);
                }}
                className="dark:bg-gray-750 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700 dark:hover:border-purple-300/30"
              >
                Reset Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="border rounded-md flex dark:border-gray-600">
          <Toggle
            pressed={view === 'list'}
            onPressedChange={() => setView('list')}
            aria-label="List view"
            className="rounded-none rounded-l-md dark:bg-gray-750 dark:text-white dark:data-[state=on]:bg-purple-900/30 dark:hover:bg-gray-700"
          >
            <LayoutList className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={view === 'grid'}
            onPressedChange={() => setView('grid')}
            aria-label="Grid view"
            className="rounded-none rounded-r-md dark:bg-gray-750 dark:text-white dark:data-[state=on]:bg-purple-900/30 dark:hover:bg-gray-700"
          >
            <LayoutGrid className="h-4 w-4" />
          </Toggle>
        </div>
      </div>
    </div>
  );
} 