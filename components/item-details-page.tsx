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
import { ArrowLeft, Edit, Loader2, Save, ChevronLeft, ChevronRight, X } from "lucide-react"
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
import { getCustomBrandsAction } from "@/actions/custom-brands-actions"

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

// Add type definition at the top
type ItemCondition = "New" | "Used";

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
  const [customBrands, setCustomBrands] = useState<{ id: string; name: string }[]>([])
  const yearOptions = generateYearOptions()

  const defaultBrands = [
    'DC',
    'Filmation',
    'Funko',
    'Games Workshop',
    'Hasbro',
    'Kenner',
    'Marvel',
    'Matchbox',
    'Mattel',
    'Medium',
    'Playmates',
    'Senate',
    'Sunbow',
    'Super7',
    'Takara',
    'Tomy'
  ];

  // Update conditionOptions definition
  const conditionOptions: ItemCondition[] = [
    "New",
    "Used"
  ];

  useEffect(() => {
    if (id) {
      fetchItem(id)
      fetchSoldItem(id)
      fetchImages(id)
      loadCustomBrands()
    }
  }, [id])

  useEffect(() => {
    if (item) {
      fetchRelatedItems(item.franchise, item.id, item.isSold)
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

  const fetchRelatedItems = async (franchise: string, itemId: string, isSold: boolean) => {
    const result = await getRelatedItemsAction(franchise, itemId, isSold)
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

  const loadCustomBrands = async () => {
    const result = await getCustomBrandsAction();
    if (result.isSuccess && result.data) {
      setCustomBrands(result.data);
    }
  };

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
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto" />
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
    <div className="min-h-screen bg-slate-50 dark:bg-black/30">
      <main className="container mx-auto px-4 py-12">
        <Link href="/my-collection" className="inline-flex items-center text-purple-400 hover:text-primary/50 mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
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
            <Popover open={editingField === 'name'} onOpenChange={(open) => !open && handleEditCancel()}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="p-0 h-auto font-normal text-2xl font-bold font-serif mb-4 dark:text-foreground group"
                  onClick={() => handleEditStart('name')}
                >
                  <span>{item.name}</span>
                  <Edit className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-purple-400">Edit Item Name</h4>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-purple-400">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={item.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                    <Button onClick={handleEditSave} className="bg-primary/70 text-primary-foreground hover:bg-primary/60">Save</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border dark:border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Estimated Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <Popover open={editingField === 'value'} onOpenChange={(open) => !open && handleEditCancel()}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-normal group"
                        onClick={() => handleEditStart('value')}
                      >
                        <span className="text-4xl font-bold text-purple-400">
                          ${typeof item.value === 'number' ? item.value.toFixed(2) : parseFloat(item.value).toFixed(2)}
                        </span>
                        <Edit className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
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
                            className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                          <Button onClick={handleEditSave} className="bg-primary/70 text-primary-foreground hover:bg-primary/60">Save</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>
              <Card className="border dark:border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Purchase Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <Popover open={editingField === 'cost'} onOpenChange={(open) => !open && handleEditCancel()}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-normal group"
                        onClick={() => handleEditStart('cost')}
                      >
                        <span className="text-4xl font-bold">
                          ${typeof item.cost === 'number' ? item.cost.toFixed(2) : parseFloat(item.cost).toFixed(2)}
                        </span>
                        <Edit className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
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
                            className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                          <Button onClick={handleEditSave} className="bg-primary/70 text-primary-foreground hover:bg-primary/60">Save</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>
            </div>
            
            <Card className="border dark:border-border shadow-sm dark:bg-card/60">
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Status & Acquisition</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Date Acquired</Label>
                      <p>{item && new Date(item.acquired).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Collection Status</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="item-status"
                          checked={isSold}
                          onCheckedChange={handleSoldToggle}
                        />
                        <span className={`text-sm ${isSold ? "text-rose-500 font-medium" : "text-emerald-600 font-medium"}`}>
                          {isSold ? 'Sold' : 'In Collection'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground">Item Information</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <div className="flex items-center">
                        <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">{item.type}</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Franchise</Label>
                      <p>{item.franchise}</p>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Brand</Label>
                      <Popover open={editingField === 'brand'} onOpenChange={(open) => !open && handleEditCancel()}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="p-0 h-auto font-normal text-left justify-start w-full group"
                            onClick={() => handleEditStart('brand')}
                          >
                            <span>{item.brand || 'Not specified'}</span>
                            <Edit className="ml-2 h-3.5 w-3.5 inline opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                          <h4 className="font-semibold text-sm text-purple-400">Edit Brand</h4>
                          <div className="space-y-2 mt-2">
                            <Label htmlFor="brand" className="text-sm font-medium text-purple-400">Brand</Label>
                            <Select
                              value={item.brand || ""}
                              onValueChange={(value) => {
                                if (item) {
                                  const updatedItem = {
                                    ...item,
                                    brand: value
                                  };
                                  setItem(updatedItem);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select brand" />
                              </SelectTrigger>
                              <SelectContent className="dark:bg-black/90">
                                <SelectGroup>
                                  <SelectLabel>Default Brands</SelectLabel>
                                  {defaultBrands.map((brand) => (
                                    <SelectItem key={brand} value={brand}>
                                      {brand}
                                    </SelectItem>
                                  ))}
                                  {customBrands.length > 0 && (
                                    <>
                                      <SelectLabel>Custom Brands</SelectLabel>
                                      {customBrands.map((brand) => (
                                        <SelectItem key={brand.id} value={brand.name}>
                                          {brand.name}
                                        </SelectItem>
                                      ))}
                                    </>
                                  )}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end space-x-2 mt-4">
                            <Button variant="outline" onClick={handleEditCancel}>Cancel</Button>
                            <Button onClick={handleEditSave}>Save</Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Year</Label>
                      <Popover open={editingField === 'year'} onOpenChange={(open) => !open && handleEditCancel()}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="p-0 h-auto font-normal text-left justify-start w-full group"
                            onClick={() => handleEditStart('year')}
                          >
                            <span>{item.year || 'Not specified'}</span>
                            <Edit className="ml-2 h-3.5 w-3.5 inline opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-purple-400">Edit Year</h4>
                            <div className="space-y-2">
                              <Label htmlFor="year" className="text-sm font-medium text-purple-400">Year</Label>
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
                                <SelectTrigger>
                                  <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-black/90">
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
                              <Button variant="outline" onClick={handleEditCancel} className="border-input text-primary/70 hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                              <Button onClick={handleEditSave} className="bg-primary/70 text-primary-foreground hover:bg-primary/60">Save</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Condition</Label>
                      <Popover open={editingField === 'condition'} onOpenChange={(open) => !open && handleEditCancel()}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="p-0 h-auto font-normal text-left justify-start w-full group"
                            onClick={() => handleEditStart('condition')}
                          >
                            <span>{item.condition || 'Not specified'}</span>
                            <Edit className="ml-2 h-3.5 w-3.5 inline opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-purple-400">Edit Condition</h4>
                            <div className="space-y-2">
                              <Label htmlFor="condition" className="text-sm font-medium text-purple-400">Condition</Label>
                              <Select
                                value={item.condition}
                                onValueChange={(value: ItemCondition) => {
                                  if (item) {
                                    const updatedItem = {
                                      ...item,
                                      condition: value as ItemCondition
                                    };
                                    setItem(updatedItem);
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-black/90">
                                  <SelectGroup>
                                    <SelectLabel>Condition</SelectLabel>
                                    {conditionOptions.map((condition) => (
                                      <SelectItem key={condition} value={condition}>
                                        {condition}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={handleEditCancel} className="border-input text-primary/70 hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                              <Button onClick={handleEditSave} className="bg-primary/70 text-primary-foreground hover:bg-primary/60">Save</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {isSold && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-muted-foreground">Sale Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="sold-price" className="text-xs text-muted-foreground">Sold Price</Label>
                        <Input
                          id="sold-price"
                          type="number"
                          placeholder="Enter sold price"
                          value={soldPrice}
                          onChange={(e) => setSoldPrice(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="sold-date" className="text-xs text-muted-foreground">Sold Date</Label>
                        <Input
                          id="sold-date"
                          type="date"
                          value={soldDate}
                          onChange={(e) => setSoldDate(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Button onClick={handleSaveSoldDetails} className="w-full bg-primary/70 text-primary-foreground hover:bg-primary/60">
                      <Save className="w-4 h-4 mr-2" /> Save Sold Details
                    </Button>
                  </div>
                )}
                
                {item.isSold && item.soldPrice && item.soldDate && !isSold && (
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Sale Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Sold Price</Label>
                        <p className="font-semibold text-purple-400">${item.soldPrice.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Sold Date</Label>
                        <p className="font-semibold text-purple-400">{new Date(item.soldDate).toLocaleDateString()}</p>
                      </div>
                    </div>
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
                      className="w-full justify-start text-left font-normal p-4 bg-muted/30 hover:bg-muted/50 rounded-md group"
                      onClick={() => handleEditStart('notes')}
                    >
                      <div className="flex items-start">
                        <div className="max-h-40 overflow-y-auto pr-2 flex-grow">
                          <p className="text-muted-foreground whitespace-pre-wrap">
                            {item && (item.notes || 'No notes available. Click to add notes about this item.')}
                          </p>
                        </div>
                        <Edit className="ml-2 h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 dark:bg-black/90 dark:border-border">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm text-foreground">Edit Notes</h4>
                      <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium text-foreground">Notes</Label>
                        <textarea
                          id="notes"
                          name="notes"
                          value={item ? (item.notes || '') : ''}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-transparent"
                          rows={4}
                          placeholder="Add notes about this item..."
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={handleEditCancel} className="border-input text-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                        <Button onClick={handleEditSave} className="bg-primary/70 text-primary-foreground hover:bg-primary/60">Save</Button>
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
                <Card key={relatedItem.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 dark:bg-card/60 dark:border-border">
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
                    <p className="font-semibold text-primary/70">
                      {relatedItem.isSold 
                        ? `Sold: $${relatedItem.soldPrice?.toFixed(2) || 'N/A'}` 
                        : `Value: $${relatedItem.value.toFixed(2)}`}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/item/${relatedItem.id}`} passHref scroll={true}>
                      <Button variant="ghost" className="w-full text-primary/70 hover:bg-accent hover:text-accent-foreground">
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