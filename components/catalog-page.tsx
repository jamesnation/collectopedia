"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Package, Search, PlusCircle, Filter, Edit, Trash2, RefreshCw, ChevronDown, ArrowUpDown, LayoutGrid, LayoutList, Loader2, X } from "lucide-react"
import { Toggle } from "@/components/ui/toggle"
import Link from 'next/link'
import Image from 'next/image'
import { createItemAction, getItemsByUserIdAction, updateItemAction, deleteItemAction } from "@/actions/items-actions"
import { SelectItem as SelectItemType } from "@/db/schema/items-schema"
import { useAuth } from "@clerk/nextjs"
import { v4 as uuidv4 } from 'uuid';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import debounce from 'lodash/debounce'
import { Skeleton } from "@/components/ui/skeleton";
import { brandEnum, itemTypeEnum } from "@/db/schema/items-schema";
import { updateEbayPrices } from "@/actions/ebay-actions"
import { Checkbox } from "@/components/ui/checkbox"
import { SortDescriptor } from '@/types/sort'
import { useDebouncedCallback } from 'use-debounce';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import Papa from 'papaparse'
import { DollarSign, ShoppingCart, TrendingUp, BarChart4, Percent } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { CustomTypeModal } from "@/components/custom-type-modal";
import { getCustomTypesAction } from "@/actions/custom-types-actions";
import { SelectCustomType } from "@/db/schema";
import { CustomBrandModal } from "@/components/custom-brand-modal";
import { getCustomBrandsAction } from "@/actions/custom-brands-actions";
import { createCustomTypeAction } from "@/actions/custom-types-actions";
import { createCustomBrandAction } from "@/actions/custom-brands-actions";
import { CustomManufacturerModal } from "@/components/custom-manufacturer-modal";
import { getCustomManufacturersAction } from "@/actions/custom-manufacturers-actions";
import { createCustomManufacturerAction } from "@/actions/custom-manufacturers-actions";
import { generateYearOptions } from "@/lib/utils";

// Dynamically import components that might cause hydration issues
const DynamicImageUpload = dynamic(() => import('@/components/image-upload'), { ssr: false })
// const DynamicLineChart = dynamic(() => import('recharts').then((mod) => mod.LineChart), { ssr: false })
// const DynamicLine = dynamic(() => import('recharts').then((mod) => mod.Line), { ssr: false })
// const DynamicXAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false })
// const DynamicYAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false })
// const DynamicCartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid), { ssr: false })
// const DynamicTooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false })
// const DynamicResponsiveContainer = dynamic(() => import('recharts').then((mod) => mod.ResponsiveContainer), { ssr: false })

const placeholderImage = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23CCCCCC'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' alignment-baseline='middle' font-family='sans-serif' fill='%23666666'%3ENo Image%3C/text%3E%3C/svg%3E`

type CSVItem = {
  name: string
  type: string
  brand: string
  manufacturer: string
  year: string
  acquired: string
  cost: string
  value: string
  notes: string
  isSold: string
  soldDate: string
  soldPrice: string
  ebayListed: string
  ebaySold: string
}

// Add this function at the top level of the file, after the imports
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Update the SummaryPanel component
function SummaryPanel({
  totalValue = 0,
  totalCost = 0,
  totalItems = 0,
  ebayListedValue = 0,
  ebaySoldValue = 0,
  showSold
}: {
  totalValue?: number
  totalCost?: number
  totalItems?: number
  ebayListedValue?: number
  ebaySoldValue?: number
  showSold: boolean
}) {
  const profit = totalValue - totalCost
  const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-GB', { 
      style: 'currency', 
      currency: 'GBP',
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })
  }

  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US')
  }

  return (
    <Card className="mb-8 bg-card">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-primary">Total {showSold ? "Sold" : "Collection"} Value</h3>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-primary">Total Cost</h3>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalCost)}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-primary">Total Items</h3>
            </div>
            <p className="text-2xl font-bold text-primary">{formatNumber(totalItems)}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-primary">eBay Listed Value</h3>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(ebayListedValue)}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-primary">eBay Sold Value</h3>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(ebaySoldValue)}</p>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <BarChart4 className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-primary">Total Profit</h3>
            </div>
            <p className={`text-xl font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profit)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Percent className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-primary">Profit Margin</h3>
            </div>
            <p className={`text-xl font-semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitMargin.toFixed(2)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

console.log('Component Definition Start:', {
  hasDefaultExport: typeof CatalogPage !== 'undefined',
  environment: typeof window !== 'undefined' ? 'client' : 'server'
});

interface CatalogPageProps {
  initialManufacturers: { id: string; name: string }[];
  initialTypes: { id: string; name: string }[];
  initialBrands: { id: string; name: string }[];
  initialItems: SelectItemType[];
}

function CatalogPage({
  initialManufacturers,
  initialTypes,
  initialBrands,
  initialItems
}: CatalogPageProps) {
  console.log('CatalogPage Function Start');
  
  const [ebayValueType, setEbayValueType] = useState("active")
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    type: '',
    brand: '',
    manufacturer: '',
    year: null as number | null,
    acquired: '',
    cost: '',
    value: '',
    notes: '',
    image: ''
  })
  const [view, setView] = useState('list')
  const [items, setItems] = useState<SelectItemType[]>(initialItems)
  const { userId } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null)
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [editingItem, setEditingItem] = useState<SelectItemType | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newItemImage, setNewItemImage] = useState<string | null>(null)
  const [loadingListedItemId, setLoadingListedItemId] = useState<string | null>(null);
  const [loadingSoldItemId, setLoadingSoldItemId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: 'name', direction: 'ascending' })
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showSold, setShowSold] = useState(false)
  const [soldYearFilter, setSoldYearFilter] = useState<string>('all')
  const csvInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false);
  const [newItemImages, setNewItemImages] = useState<string[]>([])
  const [customTypes, setCustomTypes] = useState<{ id: string; name: string }[]>(initialTypes);
  const [customBrands, setCustomBrands] = useState<{ id: string; name: string }[]>(initialBrands);
  const [customManufacturers, setCustomManufacturers] = useState<{ id: string; name: string }[]>(initialManufacturers);

  const yearOptions = generateYearOptions();

  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    if (userId) {
      const result = await getItemsByUserIdAction(userId)
      if (result.isSuccess && result.data) {
        console.log('Fetched items:', result.data);
        setItems(result.data)
      } else {
        console.error('Failed to fetch items:', result.error);
      }
    }
    setIsLoading(false)
  }, [userId, setIsLoading, setItems])

  useEffect(() => {
    if (userId) {
      fetchItems()
    }
  }, [userId, fetchItems])

  useEffect(() => {
    if (userId) {
      loadCustomTypes();
      loadCustomBrands();
      loadCustomManufacturers();
    }
  }, [userId]);

  const loadCustomTypes = async () => {
    if (!userId) return;
    console.log('Loading custom types...');
    const result = await getCustomTypesAction();
    console.log('Custom types result:', result);
    if (result.isSuccess && result.data) {
      setCustomTypes(result.data);
      if (isAddItemOpen && result.data.length > 0) {
        const mostRecentType = result.data[result.data.length - 1];
        handleNewItemTypeChange(mostRecentType.name);
      }
    }
  };

  const loadCustomBrands = async () => {
    if (!userId) return;
    console.log('Loading custom brands...');
    const result = await getCustomBrandsAction();
    console.log('Custom brands result:', result);
    if (result.isSuccess && result.data) {
      setCustomBrands(result.data);
      if (isAddItemOpen && result.data.length > 0) {
        const mostRecentBrand = result.data[result.data.length - 1];
        handleNewItemBrandChange(mostRecentBrand.name);
      }
    }
  };

  const loadCustomManufacturers = async () => {
    if (!userId) return;
    console.log('loadCustomManufacturers - Start', {
      isClientSide: typeof window !== 'undefined',
      userId
    });
    const result = await getCustomManufacturersAction();
    console.log('loadCustomManufacturers - Result', {
      success: result.isSuccess,
      dataLength: result.data?.length
    });
    if (result.isSuccess && result.data) {
      setCustomManufacturers(result.data);
      if (isAddItemOpen && result.data.length > 0) {
        const mostRecentManufacturer = result.data[result.data.length - 1];
        handleNewItemManufacturerChange(mostRecentManufacturer.name);
      }
    }
  };

  const debouncedSetSearch = useDebouncedCallback(
    (value) => setDebouncedSearchQuery(value),
    300
  );

  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter(item => showSold ? item.isSold : !item.isSold);
    
    // Apply search filter
    if (debouncedSearchQuery) {
      const lowercasedQuery = debouncedSearchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(lowercasedQuery) ||
        item.type.toLowerCase().includes(lowercasedQuery) ||
        item.brand.toLowerCase().includes(lowercasedQuery)
      );
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter(item => item.type === typeFilter);
    }
    
    // Apply brand filter
    if (brandFilter !== 'all') {
      result = result.filter(item => item.brand === brandFilter);
    }
    
    // Apply year filter
    if (yearFilter !== 'all') {
      result = result.filter(item => new Date(item.acquired).getFullYear().toString() === yearFilter);
    }

    // Apply sold year filter
    if (showSold && soldYearFilter !== 'all') {
      result = result.filter(item => item.soldDate && new Date(item.soldDate).getFullYear().toString() === soldYearFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      const { column, direction } = sortDescriptor;
      let comparison = 0;

      switch (column) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'acquired':
          comparison = new Date(a.acquired).getTime() - new Date(b.acquired).getTime();
          break;
        case 'cost':
          comparison = a.cost - b.cost;
          break;
        case 'value':
        case 'soldPrice':
          comparison = (showSold ? (a.soldPrice ?? 0) - (b.soldPrice ?? 0) : a.value - b.value);
          break;
        case 'soldDate':
          comparison = new Date(a.soldDate || 0).getTime() - new Date(b.soldDate || 0).getTime();
          break;
      }

      return direction === 'ascending' ? comparison : -comparison;
    });

    return result;
  }, [items, debouncedSearchQuery, typeFilter, brandFilter, yearFilter, sortDescriptor, showSold, soldYearFilter]);

  // Calculate summary values based on filteredAndSortedItems
  const summaryValues = useMemo(() => {
    return filteredAndSortedItems.reduce((acc, item) => {
      acc.totalValue += showSold ? (item.soldPrice ?? 0) : item.value;
      acc.totalCost += item.cost;
      acc.ebayListedValue += showSold ? 0 : (item.ebayListed ?? 0);
      acc.ebaySoldValue += showSold ? 0 : (item.ebaySold ?? 0);
      return acc;
    }, {
      totalValue: 0,
      totalCost: 0,
      ebayListedValue: 0,
      ebaySoldValue: 0
    });
  }, [filteredAndSortedItems, showSold]);

  const handleDelete = useCallback(async (id: string) => {
    setIsLoading(true)
    setLoadingItemId(id)
    try {
      const result = await deleteItemAction(id)
      if (result.isSuccess) {
        setItems(items.filter(item => item.id !== id))
        toast({
          title: "Item deleted",
          description: "The item has been removed from your collection.",
        })
      } else {
        throw new Error('Action failed')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setLoadingItemId(null)
    }
  }, [items, toast])

  const handleEditStart = (item: SelectItemType, field: string) => {
    setEditingItem({ ...item });
    setEditingItemId(item.id);
    setEditingField(field);
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditingItemId(null);
    setEditingField(null);
  };

  const handleEditSave = async () => {
    if (editingItem) {
      setIsLoading(true);
      setLoadingItemId(editingItem.id);
      try {
        const result = await updateItemAction(editingItem.id, {
          ...editingItem,
          image: editingItem.image, // Make sure to include the image URL here
        });
        if (result.isSuccess) {
          setItems(items.map(item => item.id === editingItem.id ? editingItem : item));
          toast({
            title: "Item updated",
            description: "Your changes have been saved successfully.",
          });
          handleEditCancel();
        } else {
          throw new Error('Action failed');
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update item. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setLoadingItemId(null);
      }
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingItem) {
      setEditingItem({ ...editingItem, name: e.target.value });
    }
  };

  const handleTypeChange = (value: string) => {
    if (editingItem) {
      // If the value matches a custom type ID, use its name
      const customType = customTypes.find(type => type.id === value);
      const typeName = customType ? customType.name : value;
      
      setEditingItem({
        ...editingItem,
        type: typeName
      });
    }
  };

  const handleBrandChange = (value: string) => {
    if (editingItem) {
      // If the value matches a custom brand ID, use its name
      const customBrand = customBrands.find(brand => brand.id === value);
      const brandName = customBrand ? customBrand.name : value;
      
      setEditingItem({
        ...editingItem,
        brand: brandName
      });
    }
  };

  const handleAcquiredChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingItem) {
      setEditingItem({ ...editingItem, acquired: new Date(e.target.value) });
    }
  };

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingItem) {
      setEditingItem({ ...editingItem, cost: parseInt(e.target.value) });
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingItem) {
      setEditingItem({ ...editingItem, value: parseInt(e.target.value) });
    }
  };

  const handleEbayRefresh = async (id: string, name: string, type: 'sold' | 'listed') => {
    if (type === 'listed') {
      setLoadingListedItemId(id);
    } else {
      setLoadingSoldItemId(id);
    }

    try {
      const result = await updateEbayPrices(id, name, type);
      if (result.success) {
        console.log('eBay update result:', result);

        setItems(prevItems => prevItems.map(item => {
          if (item.id === id) {
            return {
              ...item,
              ebayListed: type === 'listed' ? result.prices.median : item.ebayListed,
              ebaySold: type === 'sold' ? result.prices.median : item.ebaySold
            };
          }
          return item;
        }));

        toast({
          title: "eBay prices updated",
          description: `Successfully updated ${type} prices for ${name}.`,
        });
      } else {
        throw new Error(result.error || 'Failed to update eBay prices');
      }
    } catch (error) {
      console.error(`Error refreshing eBay ${type} data:`, error);
      toast({
        title: "Error",
        description: `Failed to update ${type} prices. Please try again.`,
        variant: "destructive",
      });
    } finally {
      if (type === 'listed') {
        setLoadingListedItemId(null);
      } else {
        setLoadingSoldItemId(null);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log('handleInputChange:', { name, value });
    setNewItem(prev => ({ ...prev, [name]: value }));
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setNewItem(prev => ({ ...prev, image: imageUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (url: string) => {
    setNewItemImages(prev => [...prev, url]);
  }

  const handleRemoveImage = (index: number) => {
    setNewItemImages(prev => prev.filter((_, i) => i !== index));
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (userId) {
      setIsLoading(true)
      try {
        // Add debug logging
        console.log('Current newItem state:', newItem);
        console.log('Available custom types:', customTypes);
        console.log('Available custom brands:', customBrands);
        
        // Parse and validate cost and value
        const cost = parseFloat(newItem.cost) || 0;
        const value = parseFloat(newItem.value) || 0;
        
        if (isNaN(cost) || isNaN(value)) {
          throw new Error('Cost and value must be valid numbers');
        }

        // Get the actual type and brand values
        const type = newItem.type || 'Other';
        const brand = newItem.brand || 'Other';
        
        console.log('Creating item with type:', type, 'and brand:', brand);
        
        const result = await createItemAction({
          id: crypto.randomUUID(),
          userId,
          name: newItem.name,
          type: type,
          brand: brand,
          manufacturer: newItem.manufacturer || null,
          year: newItem.year,  // Remove the parseInt since it's already a number
          acquired: new Date(newItem.acquired || new Date()),
          cost: cost,
          value: value,
          notes: newItem.notes || '',
          isSold: false,
          image: newItemImages[0] || '',
          images: newItemImages,
        });

        console.log('Create item result:', result);

        if (result.isSuccess) {
          await fetchItems()
          setNewItem({ 
            name: '', 
            type: '', 
            brand: '', 
            manufacturer: '',
            year: null as number | null,
            acquired: '', 
            cost: '', 
            value: '', 
            notes: '', 
            image: '' 
          })
          setNewItemImages([])
          setIsAddItemOpen(false)
          toast({
            title: "Success",
            description: "Item added successfully to your collection.",
            variant: "default",
          })
        } else {
          throw new Error(result.error)
        }
      } catch (error) {
        console.error('Error adding item:', error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to add item. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSort = (column: string) => {
    setSortDescriptor(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'ascending' ? 'descending' : 'ascending'
    }))
  }

  const TableRowSkeleton = () => (
    <TableRow className="bg-white hover:bg-purple-50 transition-colors">
      <TableCell className="p-2"><Skeleton className="h-20 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
    </TableRow>
  )

  const GridItemSkeleton = () => (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <Skeleton className="h-64 w-full" />
      </CardHeader>
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/3 mb-2" />
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-6 w-1/3" />
        </div>
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
      <CardFooter className="bg-gray-50 p-4 flex justify-end space-x-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </CardFooter>
    </Card>
  )

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('CSV Import Handler Start');
    const file = event.target.files?.[0]
    if (file && userId) {
      setIsImporting(true);
      try {
        const text = await file.text();
        Papa.parse<CSVItem>(text, {
          header: true,
          complete: async (results) => {
            console.log('Parsed CSV data:', results.data);
            const csvData = results.data;
            let importedCount = 0;
            let errorCount = 0;

            for (const item of csvData) {
              try {
                // Check if type exists in default enum or custom types
                const importedType = item.type || 'Other';
                let finalType = importedType;
                
                if (importedType !== 'Other') {
                  if (!itemTypeEnum.enumValues.includes(importedType as any) && 
                      !customTypes.find(ct => ct.name === importedType)) {
                    // Create new custom type
                    const typeFormData = new FormData();
                    typeFormData.append("name", importedType);
                    const typeResult = await createCustomTypeAction(typeFormData);
                    if (!typeResult.isSuccess) {
                      console.error('Failed to create custom type:', importedType);
                      finalType = 'Other';
                    } else {
                      // Refresh custom types list
                      await loadCustomTypes();
                    }
                  }
                }

                // Check if brand exists in default enum or custom brands
                const importedBrand = item.brand || 'Other';
                let finalBrand = importedBrand;
                
                if (importedBrand !== 'Other') {
                  if (!brandEnum.enumValues.includes(importedBrand as any) && 
                      !customBrands.find(cb => cb.name === importedBrand)) {
                    // Create new custom brand
                    const brandResult = await createCustomBrandAction({
                      name: importedBrand
                    });
                    if (!brandResult.isSuccess) {
                      console.error('Failed to create custom brand:', importedBrand);
                      finalBrand = 'Other';
                    } else {
                      // Refresh custom brands list
                      await loadCustomBrands();
                    }
                  }
                }

                // Check if manufacturer exists in custom manufacturers
                const importedManufacturer = item.manufacturer || null;
                let finalManufacturer = importedManufacturer;
                
                if (importedManufacturer) {
                  if (!customManufacturers.find(cm => cm.name === importedManufacturer)) {
                    // Create new custom manufacturer
                    const manufacturerResult = await createCustomManufacturerAction({
                      name: importedManufacturer
                    });
                    if (!manufacturerResult.isSuccess) {
                      console.error('Failed to create custom manufacturer:', importedManufacturer);
                      finalManufacturer = null;
                    } else {
                      // Refresh custom manufacturers list
                      await loadCustomManufacturers();
                    }
                  }
                }

                const newItem = {
                  id: crypto.randomUUID(),
                  userId,
                  name: item.name || 'Unnamed Item',
                  type: finalType,
                  brand: finalBrand,
                  manufacturer: finalManufacturer,
                  year: item.year ? parseInt(item.year) : null,
                  acquired: item.acquired ? new Date(item.acquired) : new Date(),
                  cost: item.cost ? parseFloat(item.cost) : 0,
                  value: item.value ? parseFloat(item.value) : 0,
                  notes: item.notes || '',
                  isSold: item.isSold?.toLowerCase() === 'true',
                  soldDate: item.soldDate ? new Date(item.soldDate) : undefined,
                  soldPrice: item.soldPrice ? parseFloat(item.soldPrice) : undefined,
                  ebayListed: item.ebayListed ? parseFloat(item.ebayListed) : undefined,
                  ebaySold: item.ebaySold ? parseFloat(item.ebaySold) : undefined,
                };

                console.log('Attempting to import item:', JSON.stringify(newItem, null, 2));
                const result = await createItemAction(newItem);

                if (result.isSuccess) {
                  importedCount++;
                  console.log('Item imported successfully:', result.data);
                } else {
                  console.error('Failed to import item:', result.error);
                  errorCount++;
                }
              } catch (error) {
                console.error('Error importing item:', error, 'Item data:', JSON.stringify(item, null, 2))
                errorCount++;
              }
            }
            
            // Fetch items after import is complete
            await fetchItems();
            
            toast({
              title: "CSV Import Completed",
              description: `Successfully imported ${importedCount} items. ${errorCount} items failed to import.`,
            })
          },
          error: (error: Error, file?: Papa.LocalFile) => {
            console.error('CSV Parse Error:', error)
            toast({
              title: "CSV Import Error",
              description: "There was an error parsing the CSV file. Please check the file format and try again.",
              variant: "destructive",
            })
          }
        })
      } catch (error) {
        console.error('File reading error:', error);
        toast({
          title: "File Reading Error",
          description: "There was an error reading the CSV file. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsImporting(false);
      }
    }
  }

  const handleNewItemTypeChange = (value: string) => {
    console.log('Type selected:', value);
    // Use the selected value directly as it's already the name
    setNewItem(prev => {
      console.log('Setting type to:', value);
      return {
        ...prev,
        type: value
      };
    });
  };

  const handleNewItemBrandChange = (value: string) => {
    console.log('Brand selected:', value);
    // Use the selected value directly as it's already the name
    setNewItem(prev => {
      console.log('Setting brand to:', value);
      return {
        ...prev,
        brand: value
      };
    });
  };

  const handleNewItemManufacturerChange = (value: string) => {
    console.log('Manufacturer selected:', value);
    setNewItem(prev => {
      console.log('Setting manufacturer to:', value);
      return {
        ...prev,
        manufacturer: value
      };
    });
  };

  const handleManufacturerChange = (value: string) => {
    if (editingItem) {
      setEditingItem({ ...editingItem, manufacturer: value });
    }
  };

  console.log('Before Return Statement', {
    hasHandlers: typeof handleCSVImport === 'function',
    stateInitialized: true // This will help verify if we reach this point
  });

  console.log('CatalogPage Component Initialization', {
    isClientSide: typeof window !== 'undefined',
    hasServerActions: typeof getCustomManufacturersAction === 'function'
  });

  return (
    <div className="min-h-screen bg-slate-50 text-foreground">
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
          <h1 className="text-4xl font-serif text-primary">Your Collection Catalog</h1>
          <div className="flex space-x-2">
            <Sheet open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
              <SheetTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Add New Item</SheetTitle>
                  <DialogDescription>
                    Fill in the details below to add a new item to your collection.
                  </DialogDescription>
                </SheetHeader>
                <form onSubmit={handleAddItem} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-primary">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={newItem.name}
                      onChange={handleInputChange}
                      required
                      className="border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium text-primary">Type</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Select 
                          name="type" 
                          value={newItem.type} 
                          onValueChange={handleNewItemTypeChange}
                        >
                          <SelectTrigger className="border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Default Types</SelectLabel>
                              {itemTypeEnum.enumValues.map((type) => (
                                <SelectItem key={`new-type-${type}`} value={type}>{type}</SelectItem>
                              ))}
                            </SelectGroup>
                            <SelectSeparator />
                            <SelectGroup>
                              <SelectLabel>Custom Types</SelectLabel>
                              {customTypes.map((type) => (
                                <SelectItem key={`new-type-custom-${type.id}`} value={type.name}>{type.name}</SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <CustomTypeModal onSuccess={loadCustomTypes} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand" className="text-sm font-medium text-primary">Brand</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Select 
                          name="brand" 
                          value={newItem.brand} 
                          onValueChange={handleNewItemBrandChange}
                        >
                          <SelectTrigger className="border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground">
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Default Brands</SelectLabel>
                              {brandEnum.enumValues.map((brand) => (
                                <SelectItem key={`new-brand-${brand}`} value={brand}>{brand}</SelectItem>
                              ))}
                            </SelectGroup>
                            <SelectSeparator />
                            <SelectGroup>
                              <SelectLabel>Custom Brands</SelectLabel>
                              {customBrands.map((brand) => (
                                <SelectItem key={`new-brand-custom-${brand.id}`} value={brand.name}>{brand.name}</SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <CustomBrandModal onSuccess={loadCustomBrands} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer" className="text-sm font-medium text-primary">Manufacturer</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Select 
                          name="manufacturer" 
                          value={newItem.manufacturer} 
                          onValueChange={handleNewItemManufacturerChange}
                        >
                          <SelectTrigger className="border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground">
                            <SelectValue placeholder="Select manufacturer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Custom Manufacturers</SelectLabel>
                              {customManufacturers.map((manufacturer) => (
                                <SelectItem key={`new-manufacturer-custom-${manufacturer.id}`} value={manufacturer.name}>{manufacturer.name}</SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <CustomManufacturerModal onSuccess={loadCustomManufacturers} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="year">Year</Label>
                    <Select
                      value={newItem.year?.toString() || ""}
                      onValueChange={(value) => setNewItem({ ...newItem, year: value ? parseInt(value) : null })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Year</SelectLabel>
                          {yearOptions.map((year) => (
                            <SelectItem key={year.value} value={year.value}>
                              {year.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acquired" className="text-sm font-medium text-primary">Date Acquired</Label>
                    <Input
                      id="acquired"
                      name="acquired"
                      type="date"
                      value={newItem.acquired}
                      onChange={handleInputChange}
                      required
                      className="border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost" className="text-sm font-medium text-primary">Cost</Label>
                    <Input
                      id="cost"
                      name="cost"
                      type="number"
                      value={newItem.cost}
                      onChange={handleInputChange}
                      required
                      className="border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value" className="text-sm font-medium text-primary">Estimated Value</Label>
                    <Input
                      id="value"
                      name="value"
                      type="number"
                      value={newItem.value}
                      onChange={handleInputChange}
                      required
                      className="border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={newItem.notes}
                      onChange={handleInputChange}
                      className="min-h-[100px] border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="image">Images</Label>
                    <DynamicImageUpload onUpload={handleImageUpload} bucketName="item-images" />
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {newItemImages.map((image, index) => (
                        <div key={index} className="relative">
                          <Image src={image} alt={`Uploaded image ${index + 1}`} width={100} height={100} className="rounded-md" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-0 right-0 h-6 w-6"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Add Item</Button>
                </form>
              </SheetContent>
            </Sheet>
            <Button
              onClick={() => csvInputRef.current?.click()}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full sm:w-auto"
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" /> Import CSV
                </>
              )}
            </Button>
            <input
              type="file"
              ref={csvInputRef}
              className="hidden"
              accept=".csv"
              onChange={handleCSVImport}
              disabled={isImporting}
            />
          </div>
        </div>

        <SummaryPanel
          totalValue={summaryValues.totalValue}
          totalCost={summaryValues.totalCost}
          totalItems={filteredAndSortedItems.length}
          ebayListedValue={summaryValues.ebayListedValue}
          ebaySoldValue={summaryValues.ebaySoldValue}
          showSold={showSold}
        />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="relative w-full md:w-64">
            <Input
              placeholder="Search items..."
              className="pl-10 border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                debouncedSetSearch(e.target.value);
              }}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          </div>
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[140px] border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectGroup>
                  <SelectLabel>Default Types</SelectLabel>
                  {itemTypeEnum.enumValues.map((type) => (
                    <SelectItem key={`filter-type-${type}`} value={type}>{type}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Custom Types</SelectLabel>
                  {customTypes.map((type) => (
                    <SelectItem key={`filter-type-custom-${type.id}`} value={type.name}>{type.name}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-full md:w-[140px] border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground">
                <SelectValue placeholder="Filter by brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                <SelectGroup>
                  <SelectLabel>Default Brands</SelectLabel>
                  {brandEnum.enumValues.map((brand) => (
                    <SelectItem key={`filter-brand-${brand}`} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Custom Brands</SelectLabel>
                  {customBrands.map((brand) => (
                    <SelectItem key={`filter-brand-custom-${brand.id}`} value={brand.name}>{brand.name}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full md:w-[140px] border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground">
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {Array.from(new Set(items.map(item => new Date(item.acquired).getFullYear())))
                  .sort((a, b) => b - a)
                  .map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-sold"
                checked={showSold}
                onCheckedChange={setShowSold}
              />
              <Label htmlFor="show-sold">Show Sold Items</Label>
            </div>
            {showSold && (
              <Select value={soldYearFilter} onValueChange={setSoldYearFilter}>
                <SelectTrigger className="w-full md:w-[140px] border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground">
                  <SelectValue placeholder="Filter sold by year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sold Years</SelectItem>
                  {items
                    .filter(item => item.isSold && item.soldDate)
                    .map(item => new Date(item.soldDate!).getFullYear())
                    .filter((year, index, self) => self.indexOf(year) === index)
                    .sort((a, b) => b - a)
                    .map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {view === 'list' ? (
          <div className="bg-card rounded-lg overflow-hidden border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-24">Image</TableHead>
                  <TableHead className="w-1/4">
                    <Button 
                      variant="ghost" 
                      className="font-bold text-primary hover:bg-accent hover:text-accent-foreground"
                      onClick={() => handleSort('name')}
                    >
                      Item Details <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'name' ? 'opacity-100' : 'opacity-50'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="w-32">
                    <Button 
                      variant="ghost" 
                      className="font-bold text-primary hover:bg-accent hover:text-accent-foreground"
                      onClick={() => handleSort('acquired')}
                    >
                      Acquired <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'acquired' ? 'opacity-100' : 'opacity-50'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="w-24 text-right">
                    <Button 
                      variant="ghost" 
                      className="font-bold text-primary hover:bg-accent hover:text-accent-foreground"
                      onClick={() => handleSort('cost')}
                    >
                      Cost <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'cost' ? 'opacity-100' : 'opacity-50'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="w-24 text-right">
                    <Button 
                      variant="ghost" 
                      className="font-bold text-primary hover:bg-accent hover:text-accent-foreground"
                      onClick={() => handleSort(showSold ? 'soldPrice' : 'value')}
                    >
                      {showSold ? "Sold Price" : "Value"} <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === (showSold ? 'soldPrice' : 'value') ? 'opacity-100' : 'opacity-50'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="w-32 text-right">eBay Sold</TableHead>
                  <TableHead className="w-32 text-right">eBay Listed</TableHead>
                  <TableHead className="w-40">
                    <Button 
                      variant="ghost" 
                      className="font-bold text-primary hover:bg-accent hover:text-accent-foreground"
                      onClick={() => handleSort('updatedAt')}
                    >
                      Last Updated <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'updatedAt' ? 'opacity-100' : 'opacity-50'}`} />
                    </Button>
                  </TableHead>
                  {showSold && (
                    <TableHead className="w-32">
                      <Button 
                        variant="ghost" 
                        className="font-bold text-primary hover:bg-accent hover:text-accent-foreground"
                        onClick={() => handleSort('soldDate')}
                      >
                        Sold Date <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDescriptor.column === 'soldDate' ? 'opacity-100' : 'opacity-50'}`} />
                      </Button>
                    </TableHead>
                  )}
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array(5).fill(0).map((_, index) => <TableRowSkeleton key={index} />)
                  : filteredAndSortedItems.map((item) => (
                      <TableRow key={item.id} className="bg-card hover:bg-muted/50 transition-colors">
                        <TableCell className="p-2">
                          <Link href={`/item/${item.id}`}>
                            <Image
                              src={item.image || placeholderImage}
                              alt={item.name}
                              width={80}
                              height={80}
                              style={{ objectFit: 'cover' }}
                              className="rounded-md cursor-pointer"
                            />
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Popover open={editingItemId === item.id && editingField === 'name'} onOpenChange={(open) => !open && handleEditCancel()}>
                              <PopoverTrigger asChild>
                                <button 
                                  className="text-sm font-medium hover:text-primary transition-colors"
                                  onClick={() => handleEditStart(item, 'name')}
                                >
                                  {item.name}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 bg-card border-border">
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-sm text-primary">Edit Item Name</h4>
                                  <div className="space-y-2">
                                    <Label htmlFor={`name-${item.id}`} className="text-sm font-medium text-primary">Name</Label>
                                    <Input
                                      id={`name-${item.id}`}
                                      value={editingItem?.name || ''}
                                      onChange={handleNameChange}
                                      className="border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground"
                                    />
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline" onClick={handleEditCancel} className="border-input text-primary hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                                    <Button onClick={handleEditSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                            <Popover open={editingItemId === item.id && editingField === 'type'} onOpenChange={(open) => !open && handleEditCancel()}>
                              <PopoverTrigger asChild>
                                <button 
                                  className="text-sm text-muted-foreground hover:text-primary transition-colors block"
                                  onClick={() => handleEditStart(item, 'type')}
                                >
                                  {item.type}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 bg-card border-border">
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-sm text-primary">Edit Item Type</h4>
                                  <div className="space-y-2">
                                    <Label htmlFor={`type-${item.id}`} className="text-sm font-medium text-primary">Type</Label>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1">
                                        <Select value={editingItem?.type || ''} onValueChange={handleTypeChange}>
                                          <SelectTrigger id={`type-${item.id}`} className="border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground">
                                            <SelectValue placeholder="Select type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectGroup>
                                              <SelectLabel>Default Types</SelectLabel>
                                              {itemTypeEnum.enumValues.map((type) => (
                                                <SelectItem key={`edit-type-${type}`} value={type}>{type}</SelectItem>
                                              ))}
                                            </SelectGroup>
                                            <SelectSeparator />
                                            <SelectGroup>
                                              <SelectLabel>Custom Types</SelectLabel>
                                              {customTypes.map((type) => (
                                                <SelectItem key={`edit-type-custom-${type.id}`} value={type.name}>{type.name}</SelectItem>
                                              ))}
                                            </SelectGroup>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <CustomTypeModal onSuccess={loadCustomTypes} />
                                    </div>
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline" onClick={handleEditCancel} className="border-input text-primary hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                                    <Button onClick={handleEditSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                            <Popover open={editingItemId === item.id && editingField === 'brand'} onOpenChange={(open) => !open && handleEditCancel()}>
                              <PopoverTrigger asChild>
                                <button 
                                  className="text-sm text-muted-foreground hover:text-primary transition-colors block"
                                  onClick={() => handleEditStart(item, 'brand')}
                                >
                                  {item.brand}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 bg-card border-border">
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-sm text-primary">Edit Item Brand</h4>
                                  <div className="space-y-2">
                                    <Label htmlFor={`brand-${item.id}`} className="text-sm font-medium text-primary">Brand</Label>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1">
                                        <Select value={editingItem?.brand || ''} onValueChange={handleBrandChange}>
                                          <SelectTrigger id={`brand-${item.id}`} className="border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground">
                                            <SelectValue placeholder="Select brand" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectGroup>
                                              <SelectLabel>Default Brands</SelectLabel>
                                              {brandEnum.enumValues.map((brand) => (
                                                <SelectItem key={`edit-brand-${brand}`} value={brand}>{brand}</SelectItem>
                                              ))}
                                            </SelectGroup>
                                            <SelectSeparator />
                                            <SelectGroup>
                                              <SelectLabel>Custom Brands</SelectLabel>
                                              {customBrands.map((brand) => (
                                                <SelectItem key={`edit-brand-custom-${brand.id}`} value={brand.name}>{brand.name}</SelectItem>
                                              ))}
                                            </SelectGroup>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <CustomBrandModal onSuccess={loadCustomBrands} />
                                    </div>
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline" onClick={handleEditCancel} className="border-input text-primary hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                                    <Button onClick={handleEditSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>

                            <Popover open={editingItemId === item.id && editingField === 'manufacturer'} onOpenChange={(open) => !open && handleEditCancel()}>
                              <PopoverTrigger asChild>
                                <button 
                                  className="text-sm text-muted-foreground hover:text-primary transition-colors block"
                                  onClick={() => handleEditStart(item, 'manufacturer')}
                                >
                                  {item.manufacturer || 'Add manufacturer'}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 bg-card border-border">
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-sm text-primary">Edit Manufacturer</h4>
                                  <div className="space-y-2">
                                    <Label htmlFor={`manufacturer-${item.id}`} className="text-sm font-medium text-primary">Manufacturer</Label>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1">
                                        <Select value={editingItem?.manufacturer || ''} onValueChange={handleManufacturerChange}>
                                          <SelectTrigger id={`manufacturer-${item.id}`} className="border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground">
                                            <SelectValue placeholder="Select manufacturer" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectGroup>
                                              <SelectLabel>Custom Manufacturers</SelectLabel>
                                              {customManufacturers.map((manufacturer) => (
                                                <SelectItem key={`edit-manufacturer-custom-${manufacturer.id}`} value={manufacturer.name}>{manufacturer.name}</SelectItem>
                                              ))}
                                            </SelectGroup>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <CustomManufacturerModal onSuccess={loadCustomManufacturers} />
                                    </div>
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline" onClick={handleEditCancel} className="border-input text-primary hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                                    <Button onClick={handleEditSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>

                            <Popover open={editingItemId === item.id && editingField === 'year'} onOpenChange={(open) => !open && handleEditCancel()}>
                              <PopoverTrigger asChild>
                                <button 
                                  className="text-sm text-muted-foreground hover:text-primary transition-colors block"
                                  onClick={() => handleEditStart(item, 'year')}
                                >
                                  {item.year || 'Add year'}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 bg-card border-border">
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-sm text-primary">Edit Year</h4>
                                  <div className="space-y-2">
                                    <Label htmlFor={`year-${item.id}`} className="text-sm font-medium text-primary">Year</Label>
                                    <Input
                                      id={`year-${item.id}`}
                                      type="number"
                                      min="1900"
                                      max={new Date().getFullYear()}
                                      value={editingItem?.year || ''}
                                      onChange={(e) => setEditingItem(prev => ({ ...prev!, year: parseInt(e.target.value) }))}
                                      className="border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground"
                                    />
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline" onClick={handleEditCancel} className="border-input text-primary hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                                    <Button onClick={handleEditSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Popover open={editingItemId === item.id && editingField === 'acquired'} onOpenChange={(open) => !open && handleEditCancel()}>
                            <PopoverTrigger asChild>
                              <button 
                                className="text-sm hover:text-primary transition-colors"
                                onClick={() => handleEditStart(item, 'acquired')}
                              >
                                {formatDate(item.acquired)}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 bg-card border-border">
                              <div className="space-y-4">
                                <h4 className="font-semibold text-sm text-primary">Edit Acquired Date</h4>
                                  <div className="space-y-2">
                                    <Label htmlFor={`acquired-${item.id}`} className="text-sm font-medium text-primary">Acquired Date</Label>
                                    <Input
                                      id={`acquired-${item.id}`}
                                      type="date"
                                      value={editingItem?.acquired ? new Date(editingItem.acquired).toISOString().split('T')[0] : ''}
                                      onChange={handleAcquiredChange}
                                      className="border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground"
                                    />
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline" onClick={handleEditCancel} className="border-input text-primary hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                                    <Button onClick={handleEditSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell className="text-right">£{item.cost.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            £{(showSold ? (item.soldPrice ?? 0) : item.value).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <span className="whitespace-nowrap">£{item.ebaySold?.toFixed(2) || 'N/A'}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEbayRefresh(item.id, item.name, 'sold')}
                                className="h-8 w-8 p-0"
                                disabled={loadingSoldItemId === item.id}
                              >
                                {loadingSoldItemId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <span className="whitespace-nowrap">£{item.ebayListed?.toFixed(2) || 'N/A'}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEbayRefresh(item.id, item.name, 'listed')}
                                className="h-8 w-8 p-0"
                                disabled={loadingListedItemId === item.id}
                              >
                                {loadingListedItemId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(item.updatedAt)}</TableCell>
                          {showSold && (
                            <TableCell>{item.soldDate ? formatDate(item.soldDate) : 'N/A'}</TableCell>
                          )}
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive-foreground hover:bg-destructive/20"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the item from your collection.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(item.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading
              ? Array(8).fill(0).map((_, index) => <GridItemSkeleton key={index} />)
              : filteredAndSortedItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <Link href={`/item/${item.id}`}>
                      <CardHeader className="p-0">
                        <Image
                          src={item.image || placeholderImage}
                          alt={item.name}
                          width={400}
                          height={400}
                          style={{ objectFit: 'cover', width: '100%', height: '16rem' }}
                          className="cursor-pointer"
                        />
                      </CardHeader>
                    </Link>
                    <CardContent className="p-4">
                      <Popover open={editingItemId === item.id && editingField === 'name'} onOpenChange={(open) => !open && handleEditCancel()}>
                        <PopoverTrigger asChild>
                          <button 
                            className="text-xl font-semibold mb-2 hover:text-primary transition-colors"
                            onClick={() => handleEditStart(item, 'name')}
                          >
                            {item.name}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-card border-border">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-primary">Edit Item Name</h4>
                            <div className="space-y-2">
                              <Label htmlFor={`name-${item.id}`} className="text-sm font-medium text-primary">Name</Label>
                              <Input
                                id={`name-${item.id}`}
                                value={editingItem?.name || ''}
                                onChange={handleNameChange}
                                className="border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={handleEditCancel} className="border-input text-primary hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                              <Button onClick={handleEditSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      <Popover open={editingItemId === item.id && editingField === 'type'} onOpenChange={(open) => !open && handleEditCancel()}>
                        <PopoverTrigger asChild>
                          <button 
                            className="text-sm text-muted-foreground mb-2 block hover:text-primary transition-colors text-left w-full"
                            onClick={() => handleEditStart(item, 'type')}
                          >
                            {item.type}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-card border-border">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-primary">Edit Item Type</h4>
                            <div className="space-y-2">
                              <Label htmlFor={`type-${item.id}`} className="text-sm font-medium text-primary">Type</Label>
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <Select value={editingItem?.type || ''} onValueChange={handleTypeChange}>
                                    <SelectTrigger id={`type-${item.id}`} className="border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground">
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup>
                                        <SelectLabel>Default Types</SelectLabel>
                                        {itemTypeEnum.enumValues.map((type) => (
                                          <SelectItem key={`edit-type-${type}`} value={type}>{type}</SelectItem>
                                        ))}
                                      </SelectGroup>
                                      <SelectSeparator />
                                      <SelectGroup>
                                        <SelectLabel>Custom Types</SelectLabel>
                                        {customTypes.map((type) => (
                                          <SelectItem key={`edit-type-custom-${type.id}`} value={type.name}>{type.name}</SelectItem>
                                        ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <CustomTypeModal onSuccess={loadCustomTypes} />
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={handleEditCancel} className="border-input text-primary hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                              <Button onClick={handleEditSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      <Popover open={editingItemId === item.id && editingField === 'brand'} onOpenChange={(open) => !open && handleEditCancel()}>
                        <PopoverTrigger asChild>
                          <button 
                            className="text-sm text-muted-foreground mb-2 block hover:text-primary transition-colors text-left w-full"
                            onClick={() => handleEditStart(item, 'brand')}
                          >
                            {item.brand}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-card border-border">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-primary">Edit Item Brand</h4>
                            <div className="space-y-2">
                              <Label htmlFor={`brand-${item.id}`} className="text-sm font-medium text-primary">Brand</Label>
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <Select value={editingItem?.brand || ''} onValueChange={handleBrandChange}>
                                    <SelectTrigger id={`brand-${item.id}`} className="border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground">
                                      <SelectValue placeholder="Select brand" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup>
                                        <SelectLabel>Default Brands</SelectLabel>
                                        {brandEnum.enumValues.map((brand) => (
                                          <SelectItem key={`edit-brand-${brand}`} value={brand}>{brand}</SelectItem>
                                        ))}
                                      </SelectGroup>
                                      <SelectSeparator />
                                      <SelectGroup>
                                        <SelectLabel>Custom Brands</SelectLabel>
                                        {customBrands.map((brand) => (
                                          <SelectItem key={`edit-brand-custom-${brand.id}`} value={brand.name}>{brand.name}</SelectItem>
                                        ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <CustomBrandModal onSuccess={loadCustomBrands} />
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={handleEditCancel} className="border-input text-primary hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                              <Button onClick={handleEditSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </CardContent>
                    <CardFooter className="bg-gray-50 p-4 flex justify-end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive-foreground hover:bg-destructive/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the item from your collection.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(item.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                  </Card>
                ))}
          </div>
        )}

        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">Showing {filteredAndSortedItems.length} of {items.length} items</div>
          <div className="flex space-x-2">
            <Button variant="outline" className="border-input text-primary hover:bg-accent hover:text-accent-foreground" disabled>Previous</Button>
            <Button variant="outline" className="border-input text-primary hover:bg-accent hover:text-accent-foreground" disabled>Next</Button>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-border">
        <div className="text-center text-sm text-muted-foreground">
          © 2024 Collectopedia. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

console.log('Component Definition End');

export default CatalogPage;