/**
 * Filter Dropdown Component
 * 
 * A reusable dropdown component for selecting filter options.
 */

'use client';

import React from 'react';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterOption, CustomEntity } from './filter-types';

// Special value for representing "no selection"
export const EMPTY_SELECT_VALUE = "__all__";

interface FilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[] | string[] | CustomEntity[];
  label?: string;
  placeholder?: string;
  className?: string;
  emptyOptionLabel?: string;
}

export default function FilterDropdown({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select an option',
  className = '',
  emptyOptionLabel = 'All',
}: FilterDropdownProps) {
  // Normalize the options to a consistent format
  const normalizedOptions: FilterOption[] = options.map(option => {
    if (typeof option === 'string') {
      return { value: option, label: option };
    } else if ('name' in option) {
      return { value: option.name, label: option.name };
    } else {
      return option as FilterOption;
    }
  });

  // Convert empty string to our placeholder value for internal use
  const internalValue = value === '' ? EMPTY_SELECT_VALUE : value;
  
  // Handle change to convert our placeholder back to empty string
  const handleChange = (newValue: string) => {
    onChange(newValue === EMPTY_SELECT_VALUE ? '' : newValue);
  };

  return (
    <div className={className}>
      {label && <div className="mb-1 text-sm font-medium">{label}</div>}
      <Select value={internalValue} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={EMPTY_SELECT_VALUE}>{emptyOptionLabel}</SelectItem>
            {normalizedOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
} 