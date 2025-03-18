/**
 * Sort Dropdown Component
 * 
 * A dropdown for selecting sorting options.
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
import { ChevronDown } from 'lucide-react';
import { SortOption } from '../context/catalog-context';

export interface SortOptionConfig {
  value: string;
  label: string;
  direction: 'asc' | 'desc';
}

interface SortDropdownProps {
  value: SortOption;
  onChange: (option: SortOption) => void;
  options: SortOptionConfig[];
  label?: string;
  placeholder?: string;
  className?: string;
}

export default function SortDropdown({
  value,
  onChange,
  options,
  label = 'Sort by',
  placeholder = 'Select sort option',
  className = '',
}: SortDropdownProps) {
  // Generate value string from SortOption
  const getValueString = (option: SortOption): string => {
    return `${option.column}-${option.direction}`;
  };

  // Parse value string back to SortOption
  const parseValueString = (value: string): SortOption => {
    const [column, direction] = value.split('-');
    return {
      column,
      direction: direction as 'asc' | 'desc',
    };
  };

  // Handle change
  const handleChange = (value: string) => {
    onChange(parseValueString(value));
  };

  return (
    <div className={className}>
      <Select 
        value={getValueString(value)} 
        onValueChange={handleChange}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {label && <SelectLabel>{label}</SelectLabel>}
            {options.map((option) => (
              <SelectItem 
                key={`${option.value}-${option.direction}`} 
                value={`${option.value}-${option.direction}`}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
} 