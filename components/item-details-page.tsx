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
import { ArrowLeft, RefreshCw, Edit, Loader2, Save, ChevronLeft, ChevronRight, X } from "lucide-react"
import { getItemByIdAction, updateItemAction } from "@/actions/items-actions"
import { createSoldItemAction, getSoldItemByItemIdAction, updateSoldItemAction } from "@/actions/sold-items-actions"
import { SelectItem as SelectItemType } from "@/db/schema/items-schema"
import { SelectSoldItem } from "@/db/schema/sold-items-schema"
import { useToast } from "@/components/ui/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { getRelatedItemsAction } from "@/actions/items-actions"
import { getImagesByItemIdAction, createImageAction, deleteImageAction } from "@/actions/images-actions"
import { SelectImage } from "@/db/schema/images-schema"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import DynamicImageUpload from "@/components/image-upload"
import { generateYearOptions } from "@/lib/utils"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface ItemDetailsPageProps {
  id: string
}

export default function ItemDetailsPage({ id }: ItemDetailsPageProps) {
  const router = useRouter()
  const [item, setItem] = useState<SelectItemType | null>(null)
  const [soldItem, setSoldItem] = useState<SelectSoldItem | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const [isSold, setIsSold] = useState(false)
  const [soldPrice, setSoldPrice] = useState("")
  const [soldDate, setSoldDate] = useState("")
  const [relatedItems, setRelatedItems] = useState<SelectItemType[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [images, setImages] = useState<SelectImage[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const yearOptions = generateYearOptions()

  useEffect(() => {
    if (id) {
      fetchItem(id)
      fetchSoldItem(id)
      fetchImages(id)
    }
  }, [id])

  useEffect(() => {
    if (item) {
      fetchRelatedItems(item.brand, item.id, item.isSold)
    }
  }, [item])

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const fetchItem = async (itemId: string) => {
    setIsLoading(true)
    const result = await getItemByIdAction(itemId)
    if (result.isSuccess && result.data) {
      setItem(result.data)
      setIsSold(result.data.isSold) // Set initial isSold state
    }
    setIsLoading(false)
  }

  const fetchSoldItem = async (itemId: string) => {
    const result = await getSoldItemByItemIdAction(itemId)
    if (result.isSuccess && result.data) {
      setSoldItem(result.data)
      setIsSold(true)
      setSoldPrice(result.data.soldPrice.toString())
      setSoldDate(new Date(result.data.soldDate).toISOString().split('T')[0])
    }
  }

  const fetchRelatedItems = async (brand: string, itemId: string, isSold: boolean) => {
    const result = await getRelatedItemsAction(brand, itemId, isSold)
    if (result.isSuccess && result.data) {
      setRelatedItems(result.data)
    }
  }

  const fetchImages = async (itemId: string) => {
    const result = await getImagesByItemIdAction(itemId)
    if (result.isSuccess && result.data) {
      setImages(result.data)
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

  const handleSoldToggle = async (checked: boolean) => {
    setIsSold(checked)
    if (item) {
      try {
        const updatedItem = { ...item, isSold: checked }
        const result = await updateItemAction(item.id, updatedItem)
        if (result.isSuccess) {
          setItem(updatedItem)
          toast({
            title: checked ? "Item marked as sold" : "Item unmarked as sold",
            description: checked ? "The item has been marked as sold." : "The item has been unmarked as sold.",
          })
        } else {
          throw new Error('Failed to update item sold status')
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update item sold status. Please try again.",
          variant: "destructive",
        })
        setIsSold(!checked) // Revert the toggle if update fails
      }
    }
    if (!checked) {
      setSoldPrice("")
      setSoldDate("")
      setSoldItem(null)
    }
  }

  const handleSaveSoldDetails = async () => {
    if (item && isSold) {
      try {
        const updatedItem = {
          ...item,
          isSold: true,
          soldPrice: parseInt(soldPrice),
          soldDate: new Date(soldDate),  // Add this line
        }
        const result = await updateItemAction(item.id, updatedItem)

        if (result.isSuccess && result.data) {
          setItem(result.data[0])
          toast({
            title: "Sold details saved",
            description: "The item has been marked as sold and details saved.",
          })
        } else {
          throw new Error(result.error || 'Action failed')
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save sold details. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleImageUpload = async (url: string) => {
    if (item) {
      try {
        // Create a new image entry
        const imageResult = await createImageAction({
          itemId: item.id,
          userId: item.userId,
          url: url,
        });

        if (imageResult.isSuccess && imageResult.data) {
          // Add the new image to the images array
          setImages(prevImages => {
            if (imageResult.data) {
              return [...prevImages, imageResult.data];
            }
            return prevImages;
          });
          toast({
            title: "Image uploaded",
            description: "Your new image has been added to the item.",
          });
        } else {
          throw new Error('Failed to create image entry');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        toast({
          title: "Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleImageDelete = async (imageId: string) => {
    try {
      const result = await deleteImageAction(imageId);
      if (result.isSuccess) {
        setImages(prevImages => prevImages.filter(img => img.id !== imageId));
        setCurrentImageIndex(prevIndex => Math.min(prevIndex, images.length - 2));
        toast({
          title: "Image deleted",
          description: "The image has been removed from the item.",
        });
      } else {
        throw new Error('Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-lg text-foreground">Loading item details...</p>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-lg text-destructive">Error: Item not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto px-4 py-12">
        <Link href="/my-collection" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collection
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="relative aspect-square">
              <Image
                src={images[currentImageIndex]?.url || item?.image || placeholderImage}
                alt={`${item?.name} - Image ${currentImageIndex + 1}`}
                layout="fill"
                objectFit="cover"
                className="rounded-lg shadow-lg"
              />
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background"
                    onClick={() => setCurrentImageIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : images.length - 1))}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background"
                    onClick={() => setCurrentImageIndex(prevIndex => (prevIndex < images.length - 1 ? prevIndex + 1 : 0))}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="absolute bottom-2 right-2 bg-background bg-opacity-70 hover:bg-opacity-100"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Images
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-foreground">Edit Item Images</h4>
                    <DynamicImageUpload onUpload={handleImageUpload} bucketName="item-images" />
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {images.map((image, index) => (
                        <div key={index} className="relative">
                          <Image src={image.url} alt={`Image ${index + 1}`} width={100} height={100} className="rounded-md" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-0 right-0 h-6 w-6"
                            onClick={() => handleImageDelete(image.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {images.length > 1 && (
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <div className="flex w-max space-x-4 p-4">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative w-20 h-20 rounded-md overflow-hidden ${
                        index === currentImageIndex ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={`${item?.name} - Thumbnail ${index + 1}`}
                        layout="fill"
                        objectFit="cover"
                      />
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </div>
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-serif text-foreground mb-2">{item.name}</h1>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">{item.type}</Badge>
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">{item.brand}</Badge>
                {item.manufacturer && (
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground">{item.manufacturer}</Badge>
                )}
                {item.year && (
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground">{item.year}</Badge>
                )}
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
                        <span className="text-3xl font-bold text-primary">
                          ${typeof item.value === 'number' ? item.value.toFixed(2) : parseFloat(item.value).toFixed(2)}
                        </span>
                        <Edit className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-foreground">Edit Item Value</h4>
                        <div className="space-y-2">
                          <Label htmlFor="value" className="text-sm font-medium text-foreground">Value</Label>
                          <Input
                            id="value"
                            name="value"
                            type="number"
                            value={item.value}
                            onChange={handleInputChange}
                            className="border-input"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                          <Button onClick={handleEditSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
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
                        <h4 className="font-semibold text-sm text-foreground">Edit Item Cost</h4>
                        <div className="space-y-2">
                          <Label htmlFor="cost" className="text-sm font-medium text-foreground">Cost</Label>
                          <Input
                            id="cost"
                            name="cost"
                            type="number"
                            value={item.cost}
                            onChange={handleInputChange}
                            className="border-input"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                          <Button onClick={handleEditSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
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
                      className="text-primary hover:text-primary/80 hover:bg-accent"
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
                      className="text-primary hover:text-primary/80 hover:bg-accent"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Date Acquired:</span> {item && new Date(item.acquired).toLocaleDateString()}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="item-status" className="text-sm font-semibold">Status:</Label>
                    <Switch
                      id="item-status"
                      checked={isSold}
                      onCheckedChange={handleSoldToggle}
                    />
                    <span className="text-sm text-muted-foreground">{isSold ? 'Sold' : 'In Collection'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">Manufacturer:</span>
                      <Popover open={editingField === 'manufacturer'} onOpenChange={(open) => !open && handleEditCancel()}>
                        <PopoverTrigger asChild>
                          <button 
                            className="ml-2 text-sm hover:text-primary transition-colors"
                            onClick={() => handleEditStart('manufacturer')}
                          >
                            {item.manufacturer || 'Add manufacturer'}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-card border-border">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-primary">Edit Manufacturer</h4>
                            <div className="space-y-2">
                              <Label htmlFor="manufacturer" className="text-sm font-medium text-primary">Manufacturer</Label>
                              <Input
                                id="manufacturer"
                                name="manufacturer"
                                value={item.manufacturer || ''}
                                onChange={handleInputChange}
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
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">Year:</span>
                      <Popover open={editingField === 'year'} onOpenChange={(open) => !open && handleEditCancel()}>
                        <PopoverTrigger asChild>
                          <button 
                            className="ml-2 text-sm hover:text-primary transition-colors"
                            onClick={() => handleEditStart('year')}
                          >
                            {item.year || 'Add year'}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-card border-border">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-primary">Edit Year</h4>
                            <div className="space-y-2">
                              <Label htmlFor="year" className="text-sm font-medium text-primary">Year</Label>
                              <Select
                                value={item.year?.toString() || ""}
                                onValueChange={(value) => {
                                  if (item) {
                                    const updatedItem = {
                                      ...item,
                                      year: value ? parseInt(value) : null
                                    };
                                    setItem(updatedItem);
                                  }
                                }}
                              >
                                <SelectTrigger className="border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground">
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
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={handleEditCancel} className="border-input text-primary hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                              <Button onClick={handleEditSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </p>
                  </div>
                </div>

                {isSold && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <Label htmlFor="sold-price" className="text-sm font-semibold">Sold Price:</Label>
                        <Input
                          id="sold-price"
                          type="number"
                          placeholder="Enter sold price"
                          value={soldPrice}
                          onChange={(e) => setSoldPrice(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="sold-date" className="text-sm font-semibold">Sold Date:</Label>
                        <Input
                          id="sold-date"
                          type="date"
                          value={soldDate}
                          onChange={(e) => setSoldDate(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Button onClick={handleSaveSoldDetails} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      <Save className="w-4 h-4 mr-2" /> Save Sold Details
                    </Button>
                  </div>
                )}
                {item.isSold && item.soldPrice && item.soldDate && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">Sold Price:</span> ${item.soldPrice.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">Sold Date:</span> {new Date(item.soldDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
                          <p className="text-muted-foreground whitespace-pre-wrap">
                            {item.notes || 'No notes available.'}
                          </p>
                        </div>
                        <Edit className="ml-2 h-4 w-4 flex-shrink-0" />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm text-foreground">Edit Notes</h4>
                      <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium text-foreground">Notes</Label>
                        <textarea
                          id="notes"
                          name="notes"
                          value={item.notes || ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          rows={4}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                        <Button onClick={handleEditSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <section className="mt-12">
          <h2 className="text-2xl font-serif text-foreground mb-6">Related Items</h2>
          {relatedItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedItems.map((relatedItem) => (
                <Card key={relatedItem.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="p-0">
                    <Image
                      src={relatedItem.image || placeholderImage}
                      alt={relatedItem.name}
                      width={200}
                      height={200}
                      layout="responsive"
                      className="object-cover"
                    />
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-2">{relatedItem.name}</CardTitle>
                    <p className="font-semibold text-primary">
                      {relatedItem.isSold 
                        ? `Sold: $${relatedItem.soldPrice?.toFixed(2) || 'N/A'}` 
                        : `Value: $${relatedItem.value.toFixed(2)}`}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/item/${relatedItem.id}`} passHref scroll={true}>
                      <Button variant="ghost" className="w-full text-primary hover:bg-accent hover:text-accent-foreground">
                        View Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p>No related items found.</p>
          )}
        </section>
      </main>

      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-border">
        <div className="text-center text-sm text-muted-foreground">
          © 2024 Collectopedia. All rights reserved.
        </div>
      </footer>
    </div>
  )
}