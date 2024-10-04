"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowLeft, RefreshCw, Edit, Loader2 } from "lucide-react"
import { getItemByIdAction, updateItemAction } from "@/actions/items-actions"
import { SelectItem as SelectItemType } from "@/db/schema/items-schema"
import { useToast } from "@/components/ui/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const placeholderImage = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23CCCCCC'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' alignment-baseline='middle' font-family='sans-serif' fill='%23666666'%3ENo Image%3C/text%3E%3C/svg%3E`

// Mock data for value over time (replace with real data later)
const valueData = [
  { date: '2023-01', value: 4500 },
  { date: '2023-02', value: 4600 },
  { date: '2023-03', value: 4700 },
  { date: '2023-04', value: 4800 },
  { date: '2023-05', value: 4900 },
  { date: '2023-06', value: 5000 },
]

// Mock data for related items (replace with real data later)
const relatedItems = [
  { id: 2, name: "Barbie Dreamhouse (1962)", image: placeholderImage, value: 3000 },
  { id: 3, name: "Ken Doll - First Edition (1961)", image: placeholderImage, value: 2500 },
  { id: 4, name: "Barbie Bubble Cut (1961)", image: placeholderImage, value: 1800 },
]

interface ItemDetailsPageProps {
  id: string
}

export default function ItemDetailsPage({ id }: ItemDetailsPageProps) {
  const router = useRouter()
  const [item, setItem] = useState<SelectItemType | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (id) {
      fetchItem(id)
    }
  }, [id])

  const fetchItem = async (itemId: string) => {
    setIsLoading(true)
    const result = await getItemByIdAction(itemId)
    if (result.isSuccess && result.data) {
      setItem(result.data)
    }
    setIsLoading(false)
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
      const { name, value } = e.target;
      setItem({
        ...item,
        [name]: name === 'value' || name === 'cost' ? parseFloat(value) || 0 : value
      });
    }
  }

  const handleEbayRefresh = async (type: 'sold' | 'listed') => {
    // Implement eBay API call here
    console.log(`Refresh eBay ${type} data for item with id: ${item?.id}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDF7F5] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto" />
          <p className="mt-4 text-lg text-purple-800">Loading item details...</p>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#FDF7F5] flex items-center justify-center">
        <p className="text-lg text-red-600">Error: Item not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDF7F5]">
      <main className="container mx-auto px-4 py-12">
        <Link href="/catalog" className="inline-flex items-center text-purple-700 hover:text-purple-500 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Catalog
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="relative aspect-square">
            <Image
              src={item.image || placeholderImage}
              alt={item.name}
              layout="fill"
              objectFit="cover"
              className="rounded-lg shadow-lg"
            />
          </div>
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-serif text-purple-900 mb-2">{item.name}</h1>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">{item.type}</Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">{item.brand}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Estimated Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <Popover open={editingField === 'value'} onOpenChange={(open) => !open && handleEditCancel()}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-normal"
                        onClick={() => handleEditStart('value')}
                      >
                        <span className="text-3xl font-bold text-purple-700">
                          ${typeof item.value === 'number' ? item.value.toFixed(2) : parseFloat(item.value).toFixed(2)}
                        </span>
                        <Edit className="ml-2 h-4 w-4" />
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
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Purchase Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <Popover open={editingField === 'cost'} onOpenChange={(open) => !open && handleEditCancel()}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-normal"
                        onClick={() => handleEditStart('cost')}
                      >
                        <span className="text-3xl font-bold">
                          ${typeof item.cost === 'number' ? item.cost.toFixed(2) : parseFloat(item.cost).toFixed(2)}
                        </span>
                        <Edit className="ml-2 h-4 w-4" />
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
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">eBay Sold</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">${item.ebaySold?.toFixed(2) || 'N/A'}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEbayRefresh('sold')}
                      className="text-purple-500 hover:text-purple-700 hover:bg-purple-100"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">eBay Listed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">${item.ebayListed?.toFixed(2) || 'N/A'}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEbayRefresh('listed')}
                      className="text-purple-500 hover:text-purple-700 hover:bg-purple-100"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Item Details</h2>
              <p className="text-gray-600">
                <span className="font-semibold">Date Acquired:</span> {new Date(item.acquired).toLocaleDateString()}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Last Updated:</span> {new Date(item.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="notes" className="mt-12">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="value-chart">Value Chart</TabsTrigger>
          </TabsList>
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Item Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Popover open={editingField === 'notes'} onOpenChange={(open) => !open && handleEditCancel()}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left font-normal p-0 h-auto"
                      onClick={() => handleEditStart('notes')}
                    >
                      <div className="flex items-start">
                        <div className="max-h-40 overflow-y-auto pr-2 flex-grow">
                          <p className="text-gray-600 whitespace-pre-wrap">
                            {item.notes || 'No notes available.'}
                          </p>
                        </div>
                        <Edit className="ml-2 h-4 w-4 flex-shrink-0" />
                      </div>
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
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="value-chart">
            <Card>
              <CardHeader>
                <CardTitle>Value Over Time</CardTitle>
                <CardDescription>Track the estimated value of your item over the past 6 months</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={valueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <section className="mt-12">
          <h2 className="text-2xl font-serif text-purple-900 mb-6">Related Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedItems.map((relatedItem) => (
              <Card key={relatedItem.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="p-0">
                  <Image
                    src={relatedItem.image}
                    alt={relatedItem.name}
                    width={200}
                    height={200}
                    layout="responsive"
                    className="object-cover"
                  />
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg mb-2">{relatedItem.name}</CardTitle>
                  <p className="font-semibold text-purple-700">Value: ${relatedItem.value.toFixed(2)}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="w-full text-purple-700 hover:bg-purple-100">
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-gray-200">
        <div className="text-center text-sm text-gray-500">
          © 2024 Collectopedia. All rights reserved.
        </div>
      </footer>
    </div>
  )
}