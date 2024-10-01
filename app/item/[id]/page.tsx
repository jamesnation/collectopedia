"use client"

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Edit, RefreshCw, Package } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

// Add this constant for the placeholder image
const placeholderImage = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23CCCCCC'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' alignment-baseline='middle' font-family='sans-serif' fill='%23666666'%3ENo Image%3C/text%3E%3C/svg%3E`

// This would typically come from an API or database
const toyData = [
  { id: 1, name: "Vintage Barbie", type: "Doll", acquired: "2023-01-15", cost: 150, value: 1200, ebaySold: 1100, ebayList: 1300, image: placeholderImage, notes: "Excellent condition, original packaging." },
  // ... other items ...
]

export default function ItemDetails({ params }: { params: { id: string } }) {
  const id = parseInt(params.id)
  const item = toyData.find(toy => toy.id === id)

  if (!item) {
    return <div>Item not found</div>
  }

  const handleEbayRefresh = (type: 'sold' | 'listed') => {
    console.log(`Refresh eBay ${type} data for item with id: ${item.id}`)
    // Implement eBay API call here
  }

  return (
    <div className="min-h-screen bg-[#FDF7F5]">
      <main className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <Link href="/notes" className="text-purple-700 hover:text-purple-500 flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Catalog
          </Link>
          <h1 className="text-4xl font-serif text-purple-900">Item Details</h1>
        </div>

        <Card className="bg-white shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="text-3xl font-serif text-purple-900 flex items-center">
              <Package className="mr-2 h-6 w-6" />
              {item.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-8">
            <div>
              <Image
                src={item.image || placeholderImage}
                alt={item.name}
                width={600}
                height={600}
                className="rounded-lg object-cover w-full h-auto"
              />
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-purple-700">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><span className="font-medium">Type:</span> {item.type}</p>
                  <p><span className="font-medium">Acquired:</span> {new Date(item.acquired).toLocaleDateString()}</p>
                  <p><span className="font-medium">Cost:</span> ${item.cost.toFixed(2)}</p>
                  <p><span className="font-medium">Estimated Value:</span> ${item.value.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-purple-700">eBay Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p><span className="font-medium">eBay Sold:</span> ${item.ebaySold.toFixed(2)}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEbayRefresh('sold')}
                      className="text-purple-500 hover:text-purple-700 hover:bg-purple-100"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <p><span className="font-medium">eBay Listed:</span> ${item.ebayList.toFixed(2)}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEbayRefresh('listed')}
                      className="text-purple-500 hover:text-purple-700 hover:bg-purple-100"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-purple-700">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="notes"
                    placeholder="Add your notes here..."
                    className="mt-2"
                    rows={5}
                    defaultValue={item.notes}
                  />
                </CardContent>
              </Card>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button className="bg-purple-700 text-white hover:bg-purple-600">
              <Edit className="mr-2 h-4 w-4" /> Edit Item
            </Button>
          </CardFooter>
        </Card>
      </main>

      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-gray-200">
        <div className="text-center text-sm text-gray-500">
          © 2024 Collectopedia. All rights reserved.
        </div>
      </footer>
    </div>
  )
}