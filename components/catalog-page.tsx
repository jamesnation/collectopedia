"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Package, Search, PlusCircle, Filter, Edit, Trash2, RefreshCw, ChevronDown, ArrowUpDown, LayoutGrid, LayoutList, Loader2 } from "lucide-react"
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

const collectionValueData = [
  { date: '2023-01', value: 2000 },
  { date: '2023-02', value: 2200 },
  { date: '2023-03', value: 2400 },
  { date: '2023-04', value: 2600 },
  { date: '2023-05', value: 2800 },
  { date: '2023-06', value: 3105 },
]

export default function CatalogPage() {
  const [ebayValueType, setEbayValueType] = useState("active")
  const [isChartOpen, setIsChartOpen] = useState(false)
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    type: '',
    acquired: '',
    cost: '',
    value: '',
    image: null as File | null
  })
  const [view, setView] = useState('list')
  const [items, setItems] = useState<SelectItemType[]>([])
  const { userId } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null)
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [editingItem, setEditingItem] = useState<SelectItemType | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newItemImage, setNewItemImage] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      fetchItems()
    }
  }, [userId])

  const fetchItems = async () => {
    setIsLoading(true)
    if (userId) {
      const result = await getItemsByUserIdAction(userId)
      if (result.isSuccess && result.data) {
        setItems(result.data)
      }
    }
    setIsLoading(false)
  }

  const totalCollectionValue = items.reduce((sum, item) => sum + item.value, 0)
  const totalEbayListedValue = items.reduce((sum, item) => sum + (item.ebayListed || 0), 0)
  const totalEbaySoldValue = items.reduce((sum, item) => sum + (item.ebaySold || 0), 0)

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
        const result = await updateItemAction(editingItem.id, editingItem);
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
      setEditingItem({ ...editingItem, type: value as "Doll" | "Building Set" | "Trading Card" | "Die-cast Car" | "Action Figure" });
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

  const handleEbayRefresh = async (id: string, type: 'sold' | 'listed') => {
    // Implement eBay API call here
    console.log(`Refresh eBay ${type} data for item with id: ${id}`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewItem(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewItem(prev => ({ ...prev, image: e.target.files![0] }))
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (userId) {
      setIsLoading(true)
      try {
        const result = await createItemAction({
          ...newItem,
          id: crypto.randomUUID(),
          userId,
          cost: parseInt(newItem.cost),
          type: newItem.type as "Doll" | "Building Set" | "Trading Card" | "Die-cast Car" | "Action Figure",
          acquired: new Date(newItem.acquired),
          value: parseInt(newItem.value),
          image: newItemImage, // Use the uploaded image URL
        })
        if (result.isSuccess) {
          setIsAddItemOpen(false)
          setNewItem({ name: '', type: '', acquired: '', cost: '', value: '', image: null })
          setNewItemImage(null)
          await fetchItems()
        }
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleImageUpload = (url: string) => {
    setNewItemImage(url)
  }

  const TableRowSkeleton = () => (
    <TableRow className="bg-white hover:bg-purple-50 transition-colors">
      <TableCell><Skeleton className="h-16 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
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

  return (
    <div className="min-h-screen bg-[#FDF7F5]">
      <main className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-serif text-purple-900">Your Collection Catalog</h1>
          <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-700 text-white hover:bg-purple-600">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#FDF7F5] border-purple-200">
              <DialogHeader>
                <DialogTitle className="text-2xl font-serif text-purple-900">Add New Item</DialogTitle>
                <DialogDescription>
                  Fill in the details of your new collection item.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddItem} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-purple-700">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={newItem.name}
                    onChange={handleInputChange}
                    required
                    className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium text-purple-700">Type</Label>
                  <Select name="type" value={newItem.type} onValueChange={(value) => handleInputChange({ target: { name: 'type', value } } as any)}>
                    <SelectTrigger className="border-purple-300 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Doll">Doll</SelectItem>
                      <SelectItem value="Building Set">Building Set</SelectItem>
                      <SelectItem value="Trading Card">Trading Card</SelectItem>
                      <SelectItem value="Die-cast Car">Die-cast Car</SelectItem>
                      <SelectItem value="Action Figure">Action Figure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="acquired" className="text-sm font-medium text-purple-700">Date Acquired</Label>
                  <Input
                    id="acquired"
                    name="acquired"
                    type="date"
                    value={newItem.acquired}
                    onChange={handleInputChange}
                    required
                    className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost" className="text-sm font-medium text-purple-700">Cost</Label>
                  <Input
                    id="cost"
                    name="cost"
                    type="number"
                    value={newItem.cost}
                    onChange={handleInputChange}
                    required
                    className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value" className="text-sm font-medium text-purple-700">Estimated Value</Label>
                  <Input
                    id="value"
                    name="value"
                    type="number"
                    value={newItem.value}
                    onChange={handleInputChange}
                    required
                    className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <DynamicImageUpload onUpload={handleImageUpload} bucketName="item-images" />
                <Button 
                  type="submit" 
                  className="w-full bg-purple-700 text-white hover:bg-purple-600"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Item'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-white shadow-xl mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl font-bold mb-2">${totalCollectionValue.toFixed(2)}</div>
                <div className="text-sm text-gray-500">Total Collection Value</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">{items.length}</div>
                <div className="text-sm text-gray-500">Total Items</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">${totalEbayListedValue.toFixed(2)}</div>
                <div className="text-sm text-gray-500">eBay Listed Value</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">${totalEbaySoldValue.toFixed(2)}</div>
                <div className="text-sm text-gray-500">eBay Sold Value</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Collapsible
          open={isChartOpen}
          onOpenChange={setIsChartOpen}
          className="mb-8"
        >
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="flex items-center justify-between w-full">
              Collection Value Over Time
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isChartOpen ? 'transform rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <Card>
              <CardContent className="p-6">
                {/* <DynamicResponsiveContainer width="100%" height={300}>
                  <DynamicLineChart data={collectionValueData}>
                    <DynamicCartesianGrid strokeDasharray="3 3" />
                    <DynamicXAxis dataKey="date" />
                    <DynamicYAxis />
                    <DynamicTooltip />
                    <DynamicLine type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </DynamicLineChart>
                </DynamicResponsiveContainer> */}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full md:w-64">
            <Input
              placeholder="Search items..."
              className="pl-10 border-purple-300 focus:border-purple-500 focus:ring-purple-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white rounded-md p-1">
              <Toggle
                pressed={view === 'list'}
                onPressedChange={() => setView('list')}
                aria-label="List view"
                className={`${view === 'list' ? 'bg-purple-100 text-purple-700' : ''} p-2 rounded-md`}
              >
                <LayoutList className="h-5 w-5" />
              </Toggle>
              <Toggle
                pressed={view === 'grid'}
                onPressedChange={() => setView('grid')}
                aria-label="Grid view"
                className={`${view === 'grid' ? 'bg-purple-100 text-purple-700' : ''} p-2 rounded-md`}
              >
                <LayoutGrid className="h-5 w-5" />
              </Toggle>
            </div>
            <Select>
              <SelectTrigger className="w-[180px] border-purple-300 focus:border-purple-500 focus:ring-purple-500">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
            </Select>
            <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-100">
              <Filter className="mr-2 h-4 w-4" /> More Filters
            </Button>
          </div>
        </div>

        {view === 'list' ? (
          <div className="bg-[#FDF7F5] rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-purple-50">
                  <TableHead>Image</TableHead>
                  <TableHead>
                    <Button variant="ghost" className="font-bold text-purple-700">
                      Name <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>
                    <Button variant="ghost" className="font-bold text-purple-700">
                      Acquired <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button variant="ghost" className="font-bold text-purple-700">
                      Cost <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button variant="ghost" className="font-bold text-purple-700">
                      Value <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button variant="ghost" className="font-bold text-purple-700">
                      eBay Sold <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button variant="ghost" className="font-bold text-purple-700">
                      eBay Listed <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array(5).fill(0).map((_, index) => <TableRowSkeleton key={index} />)
                  : items.map((item) => (
                      <TableRow key={item.id} className="bg-white hover:bg-purple-50 transition-colors">
                        <TableCell>
                          <Link href={`/item/${item.id}`}>
                            <Image
                              src={item.image || placeholderImage}
                              alt={item.name}
                              width={100}
                              height={100}
                              className="object-cover rounded-md cursor-pointer"
                            />
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">
                          <Popover open={editingItemId === item.id && editingField === 'name'} onOpenChange={(open) => !open && handleEditCancel()}>
                            <PopoverTrigger asChild>
                              <button 
                                className="text-sm font-medium hover:text-purple-700 transition-colors"
                                onClick={() => handleEditStart(item, 'name')}
                              >
                                {item.name}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 bg-[#FDF7F5] border-purple-200">
                              <div className="space-y-4">
                                <h4 className="font-semibold text-sm text-purple-900">Edit Item Name</h4>
                                <div className="space-y-2">
                                  <Label htmlFor={`name-${item.id}`} className="text-sm font-medium text-purple-700">Name</Label>
                                  <Input
                                    id={`name-${item.id}`}
                                    value={editingItem?.name || ''}
                                    onChange={handleNameChange}
                                    className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                                  />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={handleEditCancel} className="border-purple-300 text-purple-700 hover:bg-purple-100">Cancel</Button>
                                  <Button onClick={handleEditSave} className="bg-purple-700 text-white hover:bg-purple-600">Save</Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell>
                          <Popover open={editingItemId === item.id && editingField === 'type'} onOpenChange={(open) => !open && handleEditCancel()}>
                            <PopoverTrigger asChild>
                              <button 
                                className="text-sm hover:text-purple-700 transition-colors"
                                onClick={() => handleEditStart(item, 'type')}
                              >
                                {item.type}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 bg-[#FDF7F5] border-purple-200">
                              <div className="space-y-4">
                                <h4 className="font-semibold text-sm text-purple-900">Edit Item Type</h4>
                                <div className="space-y-2">
                                  <Label htmlFor={`type-${item.id}`} className="text-sm font-medium text-purple-700">Type</Label>
                                  <Select value={editingItem?.type || ''} onValueChange={handleTypeChange}>
                                    <SelectTrigger id={`type-${item.id}`} className="border-purple-300 focus:border-purple-500 focus:ring-purple-500">
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Doll">Doll</SelectItem>
                                      <SelectItem value="Building Set">Building Set</SelectItem>
                                      <SelectItem value="Trading Card">Trading Card</SelectItem>
                                      <SelectItem value="Die-cast Car">Die-cast Car</SelectItem>
                                      <SelectItem value="Action Figure">Action Figure</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={handleEditCancel} className="border-purple-300 text-purple-700 hover:bg-purple-100">Cancel</Button>
                                  <Button onClick={handleEditSave} className="bg-purple-700 text-white hover:bg-purple-600">Save</Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell>
                          <Popover open={editingItemId === item.id && editingField === 'acquired'} onOpenChange={(open) => !open && handleEditCancel()}>
                            <PopoverTrigger asChild>
                              <button 
                                className="text-sm hover:text-purple-700 transition-colors"
                                onClick={() => handleEditStart(item, 'acquired')}
                              >
                                {new Date(item.acquired).toLocaleDateString()}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 bg-[#FDF7F5] border-purple-200">
                              <div className="space-y-4">
                                <h4 className="font-semibold text-sm text-purple-900">Edit Acquired Date</h4>
                                <div className="space-y-2">
                                  <Label htmlFor={`acquired-${item.id}`} className="text-sm font-medium text-purple-700">Acquired Date</Label>
                                  <Input
                                    id={`acquired-${item.id}`}
                                    type="date"
                                    value={editingItem?.acquired ? new Date(editingItem.acquired).toISOString().split('T')[0] : ''}
                                    onChange={handleAcquiredChange}
                                    className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                                  />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={handleEditCancel} className="border-purple-300 text-purple-700 hover:bg-purple-100">Cancel</Button>
                                  <Button onClick={handleEditSave} className="bg-purple-700 text-white hover:bg-purple-600">Save</Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell className="text-right">
                          <Popover open={editingItemId === item.id && editingField === 'cost'} onOpenChange={(open) => !open && handleEditCancel()}>
                            <PopoverTrigger asChild>
                              <button 
                                className="text-sm hover:text-purple-700 transition-colors"
                                onClick={() => handleEditStart(item, 'cost')}
                              >
                                ${item.cost.toFixed(2)}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 bg-[#FDF7F5] border-purple-200">
                              <div className="space-y-4">
                                <h4 className="font-semibold text-sm text-purple-900">Edit Item Cost</h4>
                                <div className="space-y-2">
                                  <Label htmlFor={`cost-${item.id}`} className="text-sm font-medium text-purple-700">Cost</Label>
                                  <Input
                                    id={`cost-${item.id}`}
                                    type="number"
                                    value={editingItem?.cost || ''}
                                    onChange={handleCostChange}
                                    className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                                  />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={handleEditCancel} className="border-purple-300 text-purple-700 hover:bg-purple-100">Cancel</Button>
                                  <Button onClick={handleEditSave} className="bg-purple-700 text-white hover:bg-purple-600">Save</Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell className="text-right font-bold text-purple-700">
                          <Popover open={editingItemId === item.id && editingField === 'value'} onOpenChange={(open) => !open && handleEditCancel()}>
                            <PopoverTrigger asChild>
                              <button 
                                className="text-sm font-bold text-purple-700 hover:text-purple-600 transition-colors"
                                onClick={() => handleEditStart(item, 'value')}
                              >
                                ${item.value.toFixed(2)}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 bg-[#FDF7F5] border-purple-200">
                              <div className="space-y-4">
                                <h4 className="font-semibold text-sm text-purple-900">Edit Item Value</h4>
                                <div className="space-y-2">
                                  <Label htmlFor={`value-${item.id}`} className="text-sm font-medium text-purple-700">Value</Label>
                                  <Input
                                    id={`value-${item.id}`}
                                    type="number"                                    value={editingItem?.value || ''}
                                    onChange={handleValueChange}
                                    className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                                  />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={handleEditCancel} className="border-purple-300 text-purple-700 hover:bg-purple-100">Cancel</Button>
                                  <Button onClick={handleEditSave} className="bg-purple-700 text-white hover:bg-purple-600">Save</Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell className="text-right">
                          ${item.ebaySold?.toFixed(2) || 'N/A'}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEbayRefresh(item.id, 'sold')}
                            className="ml-2 text-purple-500 hover:text-purple-700 hover:bg-purple-100"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          ${item.ebayListed?.toFixed(2) || 'N/A'}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEbayRefresh(item.id, 'listed')}
                            className="ml-2 text-purple-500 hover:text-purple-700 hover:bg-purple-100"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditStart(item, 'name')}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                              disabled={isLoading && loadingItemId === item.id}
                            >
                              {isLoading && loadingItemId === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Edit className="h-4 w-4" />
                              )}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-100"
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
                          </div>
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
              : items.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <Link href={`/item/${item.id}`}>
                      <CardHeader className="p-0">
                        <Image
                          src={item.image || placeholderImage}
                          alt={item.name}
                          width={400}
                          height={400}
                          className="w-full h-64 object-cover cursor-pointer"
                        />
                      </CardHeader>
                    </Link>
                    <CardContent className="p-4">
                      <Popover open={editingItemId === item.id && editingField === 'name'} onOpenChange={(open) => !open && handleEditCancel()}>
                        <PopoverTrigger asChild>
                          <button 
                            className="text-xl font-semibold mb-2 hover:text-purple-700 transition-colors"
                            onClick={() => handleEditStart(item, 'name')}
                          >
                            {item.name}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-[#FDF7F5] border-purple-200">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-purple-900">Edit Item Name</h4>
                            <div className="space-y-2">
                              <Label htmlFor={`name-${item.id}`} className="text-sm font-medium text-purple-700">Name</Label>
                              <Input
                                id={`name-${item.id}`}
                                value={editingItem?.name || ''}
                                onChange={handleNameChange}
                                className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={handleEditCancel} className="border-purple-300 text-purple-700 hover:bg-purple-100">Cancel</Button>
                              <Button onClick={handleEditSave} className="bg-purple-700 text-white hover:bg-purple-600">Save</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      <Popover open={editingItemId === item.id && editingField === 'type'} onOpenChange={(open) => !open && handleEditCancel()}>
                        <PopoverTrigger asChild>
                          <button 
                            className="text-sm text-gray-500 mb-2 block hover:text-purple-700 transition-colors"
                            onClick={() => handleEditStart(item, 'type')}
                          >
                            Type: {item.type}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-[#FDF7F5] border-purple-200">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-purple-900">Edit Item Type</h4>
                            <div className="space-y-2">
                              <Label htmlFor={`type-${item.id}`} className="text-sm font-medium text-purple-700">Type</Label>
                              <Select value={editingItem?.type || ''} onValueChange={handleTypeChange}>
                                <SelectTrigger id={`type-${item.id}`} className="border-purple-300 focus:border-purple-500 focus:ring-purple-500">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Doll">Doll</SelectItem>
                                  <SelectItem value="Building Set">Building Set</SelectItem>
                                  <SelectItem value="Trading Card">Trading Card</SelectItem>
                                  <SelectItem value="Die-cast Car">Die-cast Car</SelectItem>
                                  <SelectItem value="Action Figure">Action Figure</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={handleEditCancel} className="border-purple-300 text-purple-700 hover:bg-purple-100">Cancel</Button>
                              <Button onClick={handleEditSave} className="bg-purple-700 text-white hover:bg-purple-600">Save</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      <Popover open={editingItemId === item.id && editingField === 'acquired'} onOpenChange={(open) => !open && handleEditCancel()}>
                        <PopoverTrigger asChild>
                          <button 
                            className="text-sm text-gray-500 mb-2 block hover:text-purple-700 transition-colors"
                            onClick={() => handleEditStart(item, 'acquired')}
                          >
                            Acquired: {new Date(item.acquired).toLocaleDateString()}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-[#FDF7F5] border-purple-200">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-purple-900">Edit Acquired Date</h4>
                            <div className="space-y-2">
                              <Label htmlFor={`acquired-${item.id}`} className="text-sm font-medium text-purple-700">Acquired Date</Label>
                              <Input
                                id={`acquired-${item.id}`}
                                type="date"
                                value={editingItem?.acquired ? new Date(editingItem.acquired).toISOString().split('T')[0] : ''}
                                onChange={handleAcquiredChange}
                                className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={handleEditCancel} className="border-purple-300 text-purple-700 hover:bg-purple-100">Cancel</Button>
                              <Button onClick={handleEditSave} className="bg-purple-700 text-white hover:bg-purple-600">Save</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      <div className="flex justify-between items-center mb-2">
                        <Popover open={editingItemId === item.id && editingField === 'cost'} onOpenChange={(open) => !open && handleEditCancel()}>
                          <PopoverTrigger asChild>
                            <button 
                              className="text-sm hover:text-purple-700 transition-colors"
                              onClick={() => handleEditStart(item, 'cost')}
                            >
                              Cost: ${item.cost.toFixed(2)}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 bg-[#FDF7F5] border-purple-200">
                            <div className="space-y-4">
                              <h4 className="font-semibold text-sm text-purple-900">Edit Item Cost</h4>
                              <div className="space-y-2">
                                <Label htmlFor={`cost-${item.id}`} className="text-sm font-medium text-purple-700">Cost</Label>
                                <Input
                                  id={`cost-${item.id}`}
                                  type="number"
                                  value={editingItem?.cost || ''}
                                  onChange={handleCostChange}
                                  className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={handleEditCancel} className="border-purple-300 text-purple-700 hover:bg-purple-100">Cancel</Button>
                                <Button onClick={handleEditSave} className="bg-purple-700 text-white hover:bg-purple-600">Save</Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <Popover open={editingItemId === item.id && editingField === 'value'} onOpenChange={(open) => !open && handleEditCancel()}>
                          <PopoverTrigger asChild>
                            <button 
                              className="text-lg font-bold text-purple-700 hover:text-purple-600 transition-colors"
                              onClick={() => handleEditStart(item, 'value')}
                            >
                              Value: ${item.value.toFixed(2)}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 bg-[#FDF7F5] border-purple-200">
                            <div className="space-y-4">
                              <h4 className="font-semibold text-sm text-purple-900">Edit Item Value</h4>
                              <div className="space-y-2">
                                <Label htmlFor={`value-${item.id}`} className="text-sm font-medium text-purple-700">Value</Label>
                                <Input
                                  id={`value-${item.id}`}
                                  type="number"
                                  value={editingItem?.value || ''}
                                  onChange={handleValueChange}
                                  className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={handleEditCancel} className="border-purple-300 text-purple-700 hover:bg-purple-100">Cancel</Button>
                                <Button onClick={handleEditSave} className="bg-purple-700 text-white hover:bg-purple-600">Save</Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span>eBay Sold: ${item.ebaySold?.toFixed(2) || 'N/A'}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEbayRefresh(item.id, 'sold')}
                          className="text-purple-500 hover:text-purple-700 hover:bg-purple-100 p-1"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>eBay Listed: ${item.ebayListed?.toFixed(2) || 'N/A'}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEbayRefresh(item.id, 'listed')}
                          className="text-purple-500 hover:text-purple-700 hover:bg-purple-100 p-1"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 p-4 flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStart(item, 'name')}
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                        disabled={isLoading && loadingItemId === item.id}
                      >
                        {isLoading && loadingItemId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Edit className="h-4 w-4" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-100"
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
          <div className="text-sm text-gray-500">Showing {items.length} of {items.length} items</div>
          <div className="flex space-x-2">
            <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-100" disabled>Previous</Button>
            <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-100" disabled>Next</Button>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-gray-200">
        <div className="text-center text-sm text-gray-500">
          © 2024 Collectopedia. All rights reserved.
        </div>
      </footer>
    </div>
  )
}