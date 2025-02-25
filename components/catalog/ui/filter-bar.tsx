import { Search, LayoutList, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SortDescriptor } from "../hooks/use-catalog-filters";
import { CustomEntity } from "../utils/schema-adapter";

interface FilterBarProps {
  view: 'list' | 'grid';
  setView: (view: 'list' | 'grid') => void;
  
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  
  brandFilter: string;
  setBrandFilter: (brand: string) => void;
  
  yearFilter: string;
  setYearFilter: (year: string) => void;
  
  showSold: boolean;
  setShowSold: (showSold: boolean) => void;
  
  soldYearFilter: string;
  setSoldYearFilter: (year: string) => void;
  
  availableYears: number[];
  availableSoldYears: number[];
  
  // Custom entities
  defaultTypeOptions?: string[];
  customTypes: CustomEntity[];
  
  defaultBrandOptions?: string[];
  customBrands: CustomEntity[];
}

export function FilterBar({
  view,
  setView,
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  brandFilter,
  setBrandFilter,
  yearFilter,
  setYearFilter,
  showSold,
  setShowSold,
  soldYearFilter,
  setSoldYearFilter,
  availableYears,
  availableSoldYears,
  defaultTypeOptions = [],
  customTypes,
  defaultBrandOptions = [],
  customBrands
}: FilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      {/* Search Input */}
      <div className="relative w-full md:w-64">
        <Input
          placeholder="Search items..."
          className="pl-10 border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
      </div>
      
      <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
        {/* View Toggle */}
        <div className="flex items-center space-x-2 bg-background rounded-md p-1">
          <Toggle
            pressed={view === 'list'}
            onPressedChange={() => setView('list')}
            aria-label="List view"
            className={`${view === 'list' ? 'bg-muted text-primary' : ''} p-2 rounded-md`}
          >
            <LayoutList className="h-5 w-5" />
          </Toggle>
          <Toggle
            pressed={view === 'grid'}
            onPressedChange={() => setView('grid')}
            aria-label="Grid view"
            className={`${view === 'grid' ? 'bg-muted text-primary' : ''} p-2 rounded-md`}
          >
            <LayoutGrid className="h-5 w-5" />
          </Toggle>
        </div>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-[140px] border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {defaultTypeOptions.length > 0 && (
              <>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Default Types</SelectLabel>
                  {defaultTypeOptions.map((type) => (
                    <SelectItem key={`filter-type-${type}`} value={type}>{type}</SelectItem>
                  ))}
                </SelectGroup>
              </>
            )}
            {customTypes.length > 0 && (
              <>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Custom Types</SelectLabel>
                  {customTypes.map((type) => (
                    <SelectItem key={`filter-type-custom-${type.id}`} value={type.name}>{type.name}</SelectItem>
                  ))}
                </SelectGroup>
              </>
            )}
          </SelectContent>
        </Select>

        {/* Brand Filter */}
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-full md:w-[140px] border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground">
            <SelectValue placeholder="Filter by brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {defaultBrandOptions.length > 0 && (
              <>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Default Brands</SelectLabel>
                  {defaultBrandOptions.map((brand) => (
                    <SelectItem key={`filter-brand-${brand}`} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectGroup>
              </>
            )}
            {customBrands.length > 0 && (
              <>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Custom Brands</SelectLabel>
                  {customBrands.map((brand) => (
                    <SelectItem key={`filter-brand-custom-${brand.id}`} value={brand.name}>{brand.name}</SelectItem>
                  ))}
                </SelectGroup>
              </>
            )}
          </SelectContent>
        </Select>

        {/* Year Filter */}
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-full md:w-[140px] border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground">
            <SelectValue placeholder="Filter by year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {availableYears.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Show Sold Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="show-sold"
            checked={showSold}
            onCheckedChange={setShowSold}
          />
          <Label htmlFor="show-sold">Show Sold Items</Label>
        </div>

        {/* Sold Year Filter (only shown when showSold is true) */}
        {showSold && (
          <Select value={soldYearFilter} onValueChange={setSoldYearFilter}>
            <SelectTrigger className="w-full md:w-[140px] border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground">
              <SelectValue placeholder="Filter sold by year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sold Years</SelectItem>
              {availableSoldYears.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
} 