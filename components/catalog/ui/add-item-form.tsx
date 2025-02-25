"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectSeparator, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { itemTypeEnum, brandEnum } from "@/db/schema/items-schema"
import { CatalogItem } from '../utils/schema-adapter'
import { generateYearOptions } from "@/lib/utils"
import { CustomTypeModal } from "@/components/custom-type-modal"
import { CustomBrandModal } from "@/components/custom-brand-modal"
import { CustomManufacturerModal } from "@/components/custom-manufacturer-modal"
import { CONDITION_OPTIONS } from '../utils/schema-adapter'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { X } from 'lucide-react'

// Dynamically import the image upload component to avoid SSR issues
const DynamicImageUpload = dynamic(() => import('@/components/image-upload'), { ssr: false })

interface AddItemFormProps {
  onSubmit: (item: Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>
  customTypes: { id: string; name: string }[]
  customBrands: { id: string; name: string }[]
  customManufacturers: { id: string; name: string }[]
  onLoadCustomTypes: () => void
  onLoadCustomBrands: () => void
  onLoadCustomManufacturers: () => void
  isLoading: boolean
}

export function AddItemForm({
  onSubmit,
  customTypes,
  customBrands,
  customManufacturers,
  onLoadCustomTypes,
  onLoadCustomBrands,
  onLoadCustomManufacturers,
  isLoading
}: AddItemFormProps) {
  const [newItem, setNewItem] = useState<{
    name: string
    type: string
    brand: string
    manufacturer: string
    year: number | null
    condition: "New" | "Used - complete" | "Used - item only"
    acquired: string
    cost: string
    value: string
    notes: string
    image: string | null
  }>({
    name: "",
    type: "",
    brand: "",
    manufacturer: "",
    year: null,
    condition: "Used - complete",
    acquired: new Date().toISOString().split('T')[0],
    cost: "",
    value: "",
    notes: "",
    image: null
  })
  
  const [newItemImages, setNewItemImages] = useState<string[]>([])
  const yearOptions = generateYearOptions()
  
  // Default manufacturers list
  const defaultManufacturers = [
    'DC', 'Filmation', 'Funko', 'Games Workshop', 'Hasbro', 'Kenner',
    'Marvel', 'Matchbox', 'Mattel', 'Medium', 'Playmates', 'Senate',
    'Sunbow', 'Super7', 'Takara', 'Tomy'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleTypeChange = (value: string) => {
    setNewItem(prev => ({
      ...prev,
      type: value
    }))
  }

  const handleBrandChange = (value: string) => {
    setNewItem(prev => ({
      ...prev,
      brand: value
    }))
  }

  const handleManufacturerChange = (value: string) => {
    setNewItem(prev => ({
      ...prev,
      manufacturer: value
    }))
  }

  const handleYearChange = (value: string) => {
    setNewItem(prev => ({
      ...prev,
      year: value ? parseInt(value) : null
    }))
  }

  const handleConditionChange = (value: string) => {
    setNewItem(prev => ({
      ...prev,
      condition: value as "New" | "Used - complete" | "Used - item only"
    }))
  }

  const handleImageUpload = (url: string) => {
    setNewItemImages(prev => [...prev, url])
  }

  const handleRemoveImage = (index: number) => {
    setNewItemImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Parse numeric values
    const cost = parseFloat(newItem.cost) || 0
    const value = parseFloat(newItem.value) || 0
    
    // Create the item object
    const itemToSubmit = {
      userId: '', // This will be set by the hook
      name: newItem.name,
      type: newItem.type || 'Other',
      brand: newItem.brand || 'Other',
      manufacturer: newItem.manufacturer || null,
      year: newItem.year,
      condition: newItem.condition,
      acquired: new Date(newItem.acquired || new Date()),
      cost,
      value,
      notes: newItem.notes,
      image: newItemImages[0] || null,
      images: newItemImages,
      isSold: false,
      soldPrice: null,
      soldDate: null,
      ebaySold: null,
      ebayListed: null
    }
    
    const success = await onSubmit(itemToSubmit)
    
    if (success) {
      // Reset form
      setNewItem({
        name: "",
        type: "",
        brand: "",
        manufacturer: "",
        year: null,
        condition: "Used - complete",
        acquired: new Date().toISOString().split('T')[0],
        cost: "",
        value: "",
        notes: "",
        image: null
      })
      setNewItemImages([])
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
              onValueChange={handleTypeChange}
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
          <CustomTypeModal onSuccess={onLoadCustomTypes} />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="brand" className="text-sm font-medium text-primary">Brand</Label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Select 
              name="brand" 
              value={newItem.brand} 
              onValueChange={handleBrandChange}
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
          <CustomBrandModal onSuccess={onLoadCustomBrands} />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="manufacturer">Manufacturer</Label>
        <div className="flex gap-2">
          <Select
            value={newItem.manufacturer || ""}
            onValueChange={handleManufacturerChange}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select manufacturer" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Default Manufacturers</SelectLabel>
                {defaultManufacturers.map((manufacturer) => (
                  <SelectItem key={manufacturer} value={manufacturer}>
                    {manufacturer}
                  </SelectItem>
                ))}
                {customManufacturers.length > 0 && (
                  <>
                    <SelectLabel>Custom Manufacturers</SelectLabel>
                    {customManufacturers.map((manufacturer) => (
                      <SelectItem key={manufacturer.id} value={manufacturer.name}>
                        {manufacturer.name}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
          <CustomManufacturerModal onSuccess={onLoadCustomManufacturers} />
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="year">Year</Label>
        <Select
          value={newItem.year?.toString() || ""}
          onValueChange={handleYearChange}
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
      
      <div className="grid gap-2">
        <Label htmlFor="condition">Condition</Label>
        <Select
          value={newItem.condition}
          onValueChange={handleConditionChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Condition</SelectLabel>
              {CONDITION_OPTIONS.map((condition) => (
                <SelectItem key={condition} value={condition}>
                  {condition}
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
      
      <Button 
        type="submit" 
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={isLoading}
      >
        {isLoading ? 'Adding...' : 'Add Item'}
      </Button>
    </form>
  )
} 