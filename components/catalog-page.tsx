"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Package, Search, ArrowUpDown, PlusCircle, Filter, Trash2, RefreshCw, Edit, ChevronDown } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

const toyData = [
  { id: 1, name: "Vintage Barbie", type: "Doll", acquired: "2023-01-15", cost: 150, value: 1200, ebaySold: 1100, ebayList: 1300, image: "/placeholder.svg?height=150&width=150" },
  { id: 2, name: "LEGO Millennium Falcon", type: "Building Set", acquired: "2022-11-30", cost: 800, value: 950, ebaySold: 900, ebayList: 1000, image: "/placeholder.svg?height=150&width=150" },
  { id: 3, name: "Pokémon Charizard Card", type: "Trading Card", acquired: "2023-03-22", cost: 500, value: 750, ebaySold: 700, ebayList: 800, image: "/placeholder.svg?height=150&width=150" },
  { id: 4, name: "Hot Wheels '67 Camaro", type: "Die-cast Car", acquired: "2023-02-14", cost: 5, value: 25, ebaySold: 20, ebayList: 30, image: "/placeholder.svg?height=150&width=150" },
  { id: 5, name: "Transformers Optimus Prime", type: "Action Figure", acquired: "2022-12-25", cost: 100, value: 180, ebaySold: 170, ebayList: 200, image: "/placeholder.svg?height=150&width=150" },
]

const collectionValueData = [
  { date: '2023-01', value: 2000 },
  { date: '2023-02', value: 2200 },
  { date: '2023-03', value: 2400 },
  { date: '2023-04', value: 2600 },
  { date: '2023-05', value: 2800 },
  { date: '2023-06', value: 3105 },
]

export function CatalogPageComponent() {
  const [ebayValueType, setEbayValueType] = useState("active")
  const [isChartOpen, setIsChartOpen] = useState(false)

  const totalCollectionValue = toyData.reduce((sum, toy) => sum + toy.value, 0)
  const totalEbayListedValue = toyData.reduce((sum, toy) => sum + toy.ebayList, 0)
  const totalEbaySoldValue = toyData.reduce((sum, toy) => sum + toy.ebaySold, 0)

  const handleDelete = (id: number) => {
    console.log(`Delete item with id: ${id}`)
    // Implement delete functionality here
  }

  const handleEdit = (id: number) => {
    console.log(`Edit item with id: ${id}`)
    // Implement edit functionality here
  }

  const handleEbayRefresh = (id: number) => {
    console.log(`Refresh eBay data for item with id: ${id}`)
    // Implement eBay API call here
  }

  return (
    <div className="min-h-screen bg-[#FDF7F5]">
      <header className="container mx-auto py-4 px-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Package className="h-8 w-8 text-purple-700" />
          <span className="text-2xl font-bold text-purple-700">Collectopedia</span>
        </div>
        <nav className="hidden md:flex space-x-6">
          <Link href="/dashboard" className="text-purple-700 hover:text-purple-500">Dashboard</Link>
          <Link href="/catalog" className="text-purple-700 hover:text-purple-500">Catalog</Link>
        </nav>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Welcome, Collector</span>
          <Button variant="outline" className="border-purple-700 text-purple-700 hover:bg-purple-100">Log out</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-serif text-purple-900">Your Collection Catalog</h1>
          <Button className="bg-purple-700 text-white hover:bg-purple-600">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
          </Button>
        </div>

        <Card className="bg-white shadow-xl mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl font-bold mb-2">${totalCollectionValue.toFixed(2)}</div>
                <div className="text-sm text-gray-500">Total Collection Value</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">{toyData.length}</div>
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
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={collectionValueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
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
          <div className="flex items-center space-x-2">
            <Select>
              <SelectTrigger className="w-[180px] border-purple-300 focus:border-purple-500 focus:ring-purple-500">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="doll">Doll</SelectItem>
                <SelectItem value="building-set">Building Set</SelectItem>
                <SelectItem value="trading-card">Trading Card</SelectItem>
                <SelectItem value="die-cast-car">Die-cast Car</SelectItem>
                <SelectItem value="action-figure">Action Figure</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-100">
              <Filter className="mr-2 h-4 w-4" /> More Filters
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <RadioGroup defaultValue="active" onValueChange={setEbayValueType} className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="active" id="active" />
              <Label htmlFor="active">eBay Active Listings</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sold" id="sold" />
              <Label htmlFor="sold">eBay Sold Listings</Label>
            </div>
          </RadioGroup>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
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
                  <TableHead className="text-right">eBay API</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {toyData.map((toy) => (
                  <TableRow key={toy.id} className="hover:bg-purple-50 transition-colors">
                    <TableCell>
                      <img
                        src={toy.image}
                        alt={toy.name}
                        className="w-[150px] h-[150px] object-cover rounded-md"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{toy.name}</TableCell>
                    <TableCell>{toy.type}</TableCell>
                    <TableCell>{new Date(toy.acquired).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">${toy.cost.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold text-purple-700">${toy.value.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      ${ebayValueType === "active" ? toy.ebayList.toFixed(2) : toy.ebaySold.toFixed(2)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEbayRefresh(toy.id)}
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
                          onClick={() => handleEdit(toy.id)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(toy.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">Showing {toyData.length} of {toyData.length} items</div>
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