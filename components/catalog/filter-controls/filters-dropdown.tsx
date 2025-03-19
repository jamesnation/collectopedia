/**
 * FiltersDropdown Component
 * 
 * A dropdown menu component that contains all filter controls for the catalog.
 * Includes type, franchise, year filters, and items with images toggle.
 * Fixed Select components to use 'all' instead of empty string for default options.
 */

import * as React from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface FiltersDropdownProps {
  filters: {
    type?: string
    franchise?: string
    year?: string
    showWithImages: boolean
  }
  onFilterChange: (key: string, value: any) => void
  onReset: () => void
  customTypes: { id: string; name: string }[]
  customFranchises: { id: string; name: string }[]
  activeFilterCount: number
}

export function FiltersDropdown({
  filters,
  onFilterChange,
  onReset,
  customTypes,
  customFranchises,
  activeFilterCount
}: FiltersDropdownProps) {
  // Get available years (e.g., last 50 years)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 51 }, (_, i) => (currentYear - i).toString())

  // Convert empty string values to 'all' for the select components
  const getSelectValue = (value: string | undefined) => value || 'all'

  // Handle select changes and convert 'all' back to empty string for the filter
  const handleSelectChange = (key: string, value: string) => {
    onFilterChange(key, value === 'all' ? '' : value)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 rounded-full px-1 py-0">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 p-4" align="start">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Filters</h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={onReset}
          >
            Reset Filters
          </Button>
        </div>

        <div className="space-y-4">
          {/* Type Filter */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={getSelectValue(filters.type)}
              onValueChange={(value) => handleSelectChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {customTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Franchise Filter */}
          <div className="space-y-2">
            <Label>Franchise</Label>
            <Select
              value={getSelectValue(filters.franchise)}
              onValueChange={(value) => handleSelectChange('franchise', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Franchises" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Franchises</SelectItem>
                {customFranchises.map((franchise) => (
                  <SelectItem key={franchise.id} value={franchise.id}>
                    {franchise.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Filter */}
          <div className="space-y-2">
            <Label>Year</Label>
            <Select
              value={getSelectValue(filters.year)}
              onValueChange={(value) => handleSelectChange('year', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items with Images Toggle */}
          <div className="flex items-center justify-between">
            <Label>Items with images</Label>
            <Switch
              checked={filters.showWithImages}
              onCheckedChange={(checked) => onFilterChange('showWithImages', checked)}
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 