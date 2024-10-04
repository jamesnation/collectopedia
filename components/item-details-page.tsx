"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/components/ui/use-toast"
import { Edit, RefreshCw, ArrowLeft } from "lucide-react"
import { getItemByIdAction, updateItemAction } from "@/actions/items-actions"
import { SelectItem as SelectItemType } from "@/db/schema/items-schema"

const placeholderImage = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23CCCCCC'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' alignment-baseline='middle' font-family='sans-serif' fill='%23666666'%3ENo Image%3C/text%3E%3C/svg%3E`

interface ItemDetailsPageProps {
  id: string
}

export default function ItemDetailsPage({ id }: ItemDetailsPageProps) {
  const router = useRouter()
  const [item, setItem] = useState<SelectItemType | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (id) {
      fetchItem(id)
    }
  }, [id])

  const fetchItem = async (itemId: string) => {
    const result = await getItemByIdAction(itemId)
    if (result.isSuccess && result.data) {
      setItem(result.data)
    }
  }

  const handleEditStart = (field: string) => {
    setEditingField(field)
  }

  const handleEditCancel = () => {
    setEditingField(null)
  }

  const handleEditSave = async () => {
    if (item) {
      try {
        const result = await updateItemAction(item.id, item)
        if (result.isSuccess) {
          setEditingField(null)
          toast({
            title: "Item updated",
            description: "Your changes have been saved successfully.",
          })
        } else {
          throw new Error('Action failed')
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update item. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (item) {
      setItem({ ...item, [e.target.name]: e.target.value })
    }
  }

  const handleTypeChange = (value: string) => {
    if (item) {
      setItem({ ...item, type: value as SelectItemType['type'] })
    }
  }

  const handleEbayRefresh = async (type: 'sold' | 'listed') => {
    // Implement eBay API call here
    console.log(`Refresh eBay ${type} data for item with id: ${item?.id}`)
  }

  if (!item) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-[#FDF7F5] py-12">
      <div className="container mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-purple-700 hover:text-purple-600 hover:bg-purple-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative h-[500px] w-full">
            <Image
              src={item.image || placeholderImage}
              alt={item.name}
              layout="fill"
              objectFit="cover"
              className="rounded-lg shadow-lg"
            />
          </div>

          <Card className="bg-white shadow-xl">
            <CardContent className="p-6 space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-500">Name</Label>
                <Popover open={editingField === 'name'} onOpenChange={(open) => !open && handleEditCancel()}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left font-normal"
                      onClick={() => handleEditStart('name')}
                    >
                      <span className="text-2xl font-semibold text-purple-900">{item.name}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm text-purple-900">Edit Item Name</h4>
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-purple-700">Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={item.name}
                          onChange={handleInputChange}
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

              <div>
                <Label className="text-sm font-medium text-gray-500">Type</Label>
                <Popover open={editingField === 'type'} onOpenChange={(open) => !open && handleEditCancel()}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left font-normal"
                      onClick={() => handleEditStart('type')}
                    >
                      <span className="text-lg text-purple-700">{item.type}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm text-purple-900">Edit Item Type</h4>
                      <div className="space-y-2">
                        <Label htmlFor="type" className="text-sm font-medium text-purple-700">Type</Label>
                        <Select value={item.type} onValueChange={handleTypeChange}>
                          <SelectTrigger id="type" className="border-purple-300 focus:border-purple-500 focus:ring-purple-500">
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
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Acquired Date</Label>
                <Popover open={editingField === 'acquired'} onOpenChange={(open) => !open && handleEditCancel()}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left font-normal"
                      onClick={() => handleEditStart('acquired')}
                    >
                      <span className="text-lg text-purple-700">{new Date(item.acquired).toLocaleDateString()}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm text-purple-900">Edit Acquired Date</h4>
                      <div className="space-y-2">
                        <Label htmlFor="acquired" className="text-sm font-medium text-purple-700">Acquired Date</Label>
                        <Input
                          id="acquired"
                          name="acquired"
                          type="date"
                          value={new Date(item.acquired).toISOString().split('T')[0]}
                          onChange={handleInputChange}
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

              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Cost</Label>
                  <Popover open={editingField === 'cost'} onOpenChange={(open) => !open && handleEditCancel()}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="justify-start text-left font-normal"
                        onClick={() => handleEditStart('cost')}
                      >
                        <span className="text-lg text-purple-700">${item.cost.toFixed(2)}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-purple-900">Edit Item Cost</h4>
                        <div className="space-y-2">
                          <Label htmlFor="cost" className="text-sm font-medium text-purple-700">Cost</Label>
                          <Input
                            id="cost"
                            name="cost"
                            type="number"
                            value={item.cost}
                            onChange={handleInputChange}
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
                <div>
                  <Label className="text-sm font-medium text-gray-500">Estimated Value</Label>
                  <Popover open={editingField === 'value'} onOpenChange={(open) => !open && handleEditCancel()}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="justify-start text-left font-normal"
                        onClick={() => handleEditStart('value')}
                      >
                        <span className="text-xl font-bold text-purple-700">${item.value.toFixed(2)}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-purple-900">Edit Item Value</h4>
                        <div className="space-y-2">
                          <Label htmlFor="value" className="text-sm font-medium text-purple-700">Value</Label>
                          <Input
                            id="value"
                            name="value"
                            type="number"
                            value={item.value}
                            onChange={handleInputChange}
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
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-sm font-medium text-gray-500">eBay Sold</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg text-purple-700">${item.ebaySold?.toFixed(2) || 'N/A'}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEbayRefresh('sold')}
                      className="text-purple-500 hover:text-purple-700 hover:bg-purple-100 p-1"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">eBay Listed</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg text-purple-700">${item.ebayListed?.toFixed(2) || 'N/A'}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEbayRefresh('listed')}
                      className="text-purple-500 hover:text-purple-700 hover:bg-purple-100 p-1"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Notes</Label>
                <Popover open={editingField === 'notes'} onOpenChange={(open) => !open && handleEditCancel()}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left font-normal"
                      onClick={() => handleEditStart('notes')}
                    >
                      <span className="text-lg text-purple-700">{item.notes || 'No notes'}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm text-purple-900">Edit Notes</h4>
                      <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium text-purple-700">Notes</Label>
                        <textarea
                          id="notes"
                          name="notes"
                          value={item.notes || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={4}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}