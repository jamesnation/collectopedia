/**
 * Add Item Form Component
 * 
 * Form for adding new items to the collection.
 * Updated to use named exports per TypeScript standards.
 */

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
import { itemTypeEnum, franchiseEnum } from "@/db/schema/items-schema"
import { CatalogItem } from '../utils/schema-adapter'
import { generateYearOptions } from "@/lib/utils"
import { CustomTypeModal } from "@/components/custom-type-modal"
import { CustomFranchiseModal } from "@/components/custom-franchise-modal"
import { CustomBrandModal } from "@/components/custom-brand-modal"
import { CONDITION_OPTIONS, DEFAULT_BRANDS } from '../utils/schema-adapter'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { X } from 'lucide-react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { CustomEntity } from "../filter-controls/filter-types"
import { 
  createCostValueSchema, 
  createNullableStringSchema, 
  createRequiredStringSchema 
} from '../utils/form-utils'
import { useToast } from "@/components/ui/use-toast"

// Dynamically import the image upload component to avoid SSR issues
const DynamicImageUpload = dynamic(() => import('@/components/image-upload'), { ssr: false })

// Define the form schema with Zod
const formSchema = z.object({
  name: createRequiredStringSchema(1, "Name is required").max(100, "Name must be less than 100 characters"),
  type: createRequiredStringSchema(1, "Type is required"),
  franchise: createRequiredStringSchema(1, "Franchise is required"),
  brand: z.string().optional(),
  year: z.preprocess(
    // Convert empty string to undefined
    (val) => val === '' ? undefined : val,
    z.string().optional()
  ),
  condition: z.enum(["New", "Used"]),
  acquired: z.preprocess(
    // Ensure consistent date format or default to today
    (val) => {
      if (!val || val === '') return new Date().toISOString().split('T')[0];
      return val;
    },
    z.string()
  ),
  cost: createCostValueSchema(),
  value: createCostValueSchema(),
  notes: createNullableStringSchema(),
})

type FormValues = z.infer<typeof formSchema>

export interface AddItemFormProps {
  onSubmit: (data: Omit<CatalogItem, 'id'>) => Promise<CatalogItem>
  onCancel?: () => void
  customTypes: CustomEntity[]
  customFranchises: CustomEntity[]
  customBrands: CustomEntity[]
  onLoadCustomTypes: () => Promise<void>
  onLoadCustomFranchises: () => Promise<void>
  onLoadCustomBrands: () => Promise<void>
  isSubmitting?: boolean
}

export function AddItemForm({
  onSubmit,
  onCancel,
  customTypes,
  customFranchises,
  customBrands,
  onLoadCustomTypes,
  onLoadCustomFranchises,
  onLoadCustomBrands,
  isSubmitting = false,
}: AddItemFormProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isLoadingTypes, setIsLoadingTypes] = useState(false)
  const [isLoadingFranchises, setIsLoadingFranchises] = useState(false)
  const [isLoadingBrands, setIsLoadingBrands] = useState(false)
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)
  const yearOptions = generateYearOptions()
  const { toast } = useToast()

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      franchise: "",
      brand: "",
      year: "",
      condition: "Used",
      acquired: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD
      cost: 0,
      value: 0,
      notes: "",
    },
  })

  // Load custom types if empty
  const handleLoadCustomTypes = async () => {
    if (customTypes.length === 0 && !isLoadingTypes) {
      setIsLoadingTypes(true)
      await onLoadCustomTypes()
      setIsLoadingTypes(false)
    }
  }

  // Load custom franchises if empty
  const handleLoadCustomFranchises = async () => {
    if (customFranchises.length === 0 && !isLoadingFranchises) {
      setIsLoadingFranchises(true)
      await onLoadCustomFranchises()
      setIsLoadingFranchises(false)
    }
  }

  // Load custom brands if empty
  const handleLoadCustomBrands = async () => {
    if (customBrands.length === 0 && !isLoadingBrands) {
      setIsLoadingBrands(true)
      await onLoadCustomBrands()
      setIsLoadingBrands(false)
    }
  }

  // Handle image upload
  const handleImageUpload = (url: string) => {
    setUploadedImages(prev => [...prev, url])
    
    // Show user feedback for each successful upload
    toast({
      title: "Image Uploaded",
      description: `Image ${uploadedImages.length + 1} added successfully. ${uploadedImages.length === 0 ? 'This will be the primary image.' : ''}`,
      duration: 3000,
    })
    
    // Add warning toast if too many images are uploaded (only in production)
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && uploadedImages.length >= 2) {
      toast({
        title: "Performance Notice",
        description: "Adding many images at once may cause timeouts. For best results, add your first 2-3 images now, and add more after creating the item.",
        duration: 6000,
      });
    }
  }

  // Handle image removal
  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  /**
   * Map form values to a database entity with proper type conversions
   * But ONLY include the primary image, not all images
   */
  const mapFormToEntity = (
    values: FormValues, 
    imageUrls: string[] = []
  ): Omit<CatalogItem, 'id'> => {
    // Only take the first image as the primary image - this is key!
    const primaryImage = imageUrls.length > 0 ? imageUrls[0] : null;
    
    return {
      userId: '', // Will be set by the server
      name: values.name,
      type: values.type,
      franchise: values.franchise,
      brand: values.brand || null,
      year: values.year ? parseInt(values.year, 10) : null,
      condition: values.condition,
      acquired: values.acquired ? new Date(values.acquired) : new Date(),
      cost: typeof values.cost === 'number' ? values.cost : 0,
      value: typeof values.value === 'number' ? values.value : 0,
      notes: values.notes || null,
      image: primaryImage, // Include ONLY the primary image
      // Don't include the full images array - we'll add them individually after
      createdAt: new Date(),
      updatedAt: new Date(),
      isSold: false,
      soldPrice: null,
      soldDate: null,
    };
  };

  // Form submission handler
  const handleFormSubmit = async (values: FormValues) => {
    try {
      // Set local submitting state
      setIsSubmittingForm(true)
      
      // Create a copy of uploadedImages to avoid mutation during async operations
      const imagesToUpload = [...uploadedImages];
      const hasPrimaryImage = imagesToUpload.length > 0;
      
      console.log(`[ADD-FORM] Submitting form for item: ${values.name}, image count: ${imagesToUpload.length}`);
      
      // Show a toast to let the user know the form is submitting
      toast({
        title: "Processing",
        description: hasPrimaryImage 
          ? `Adding item with primary image, please wait...` 
          : "Adding item...",
        duration: 5000,
      });
      
      try {
        // Step 1: Create the item with ONLY the primary image - like item-details does
        const newItem = mapFormToEntity(values, imagesToUpload);
        console.log(`[ADD-FORM] Creating item with primary image only`);
        
        // Submit the item with just the primary image
        const createdItem = await onSubmit(newItem);
        console.log(`[ADD-FORM] Item created successfully: ${createdItem.id}`);
        
        // Show initial success message
        toast({
          title: "Success",
          description: "Item created successfully!",
          duration: 3000,
        });
        
        // Reset form immediately for better UX
        form.reset();
        
        // Step 2: Add additional images one by one
        const additionalImages = imagesToUpload.slice(1);
        if (additionalImages.length > 0) {
          toast({
            title: "Processing",
            description: `Adding ${additionalImages.length} additional image(s) in the background...`,
            duration: 5000,
          });
          
          console.log(`[ADD-FORM] Adding ${additionalImages.length} additional images`);
          
          try {
            // Import the image action
            const { createImageAction } = await import("@/actions/images-actions");
            
            // Process one image at a time for reliability
            for (let i = 0; i < additionalImages.length; i++) {
              const url = additionalImages[i];
              try {
                // Add a small delay between images to prevent overwhelming the server
                if (i > 0) await new Promise(r => setTimeout(r, 500));
                
                console.log(`[ADD-FORM] Adding image ${i+1}/${additionalImages.length}`);
                await createImageAction({
                  url,
                  itemId: createdItem.id,
                  userId: createdItem.userId,
                  order: i + 1 // Primary image is order 0
                });
              } catch (imgError) {
                console.error(`[ADD-FORM] Error adding image ${i+1}:`, imgError);
                // Continue with other images even if one fails
              }
            }
            
            console.log(`[ADD-FORM] Successfully added ${additionalImages.length} additional images`);
            toast({
              title: "Success",
              description: `Added ${additionalImages.length} additional image(s)`,
              duration: 3000,
            });
          } catch (imagesError) {
            console.error(`[ADD-FORM] Error processing additional images:`, imagesError);
            toast({
              title: "Partial Success",
              description: "Item was created but some images couldn't be uploaded.",
              variant: "default",
              duration: 5000,
            });
          }
        }
        
        // Clear uploaded images after everything is done
        setUploadedImages([]);
      } catch (error) {
        console.error(`[ADD-FORM] Error during submission:`, error);
        
        // Show error toast
        toast({
          title: "Error",
          description: error instanceof Error 
            ? error.message 
            : "Failed to add item. Please try again.",
          variant: "destructive",
          duration: 8000,
        });
      } finally {
        // Always reset submitting state
        setIsSubmittingForm(false);
      }
    } catch (formError) {
      console.error("Form error:", formError);
      toast({
        title: "Error",
        description: "Please check the form for errors.",
        variant: "destructive"
      });
      setIsSubmittingForm(false);
    }
  }

  // Handle cancel with force reset option
  const handleCancel = () => {
    // If the form is stuck in submitting state, force reset
    if (isSubmittingForm) {
      setIsSubmittingForm(false);
      toast({
        title: "Cancelled",
        description: "Form submission was cancelled.",
        duration: 3000,
      });
    }
    
    // Call the provided onCancel function
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Optimus Prime" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Type Field */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <Select 
                  onOpenChange={handleLoadCustomTypes} 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Default Types</SelectLabel>
                      {itemTypeEnum.enumValues.map(type => (
                        <SelectItem key={`type-${type}`} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Custom Types</SelectLabel>
                      {isLoadingTypes ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        customTypes.map(type => (
                          <SelectItem key={`custom-type-${type.id}`} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <div className="flex justify-end mt-1">
                <CustomTypeModal onSuccess={onLoadCustomTypes} />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Franchise Field */}
        <FormField
          control={form.control}
          name="franchise"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Franchise</FormLabel>
              <FormControl>
                <Select 
                  onOpenChange={handleLoadCustomFranchises} 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Franchise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Default Franchises</SelectLabel>
                      {franchiseEnum.enumValues.map(franchise => (
                        <SelectItem key={`franchise-${franchise}`} value={franchise}>
                          {franchise}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Custom Franchises</SelectLabel>
                      {isLoadingFranchises ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        customFranchises.map(franchise => (
                          <SelectItem key={`custom-franchise-${franchise.id}`} value={franchise.name}>
                            {franchise.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <div className="flex justify-end mt-1">
                <CustomFranchiseModal onSuccess={onLoadCustomFranchises} />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Brand Field */}
        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand</FormLabel>
              <FormControl>
                <Select 
                  onOpenChange={handleLoadCustomBrands} 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Default Brands</SelectLabel>
                      {DEFAULT_BRANDS.map(brand => (
                        <SelectItem key={`brand-${brand}`} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Custom Brands</SelectLabel>
                      {isLoadingBrands ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        customBrands.map(brand => (
                          <SelectItem key={`custom-brand-${brand.id}`} value={brand.name}>
                            {brand.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <div className="flex justify-end mt-1">
                <CustomBrandModal onSuccess={onLoadCustomBrands} />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Two columns for Year and Condition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Year Field */}
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <FormControl>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Year</SelectLabel>
                        {yearOptions.map(year => (
                          <SelectItem key={`year-${year.value}`} value={year.value}>
                            {year.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Condition Field */}
          <FormField
            control={form.control}
            name="condition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condition</FormLabel>
                <FormControl>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Condition</SelectLabel>
                        {CONDITION_OPTIONS.map(condition => (
                          <SelectItem key={`condition-${condition}`} value={condition}>
                            {condition}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Two columns for Acquired Date and Cost */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Acquired Date Field */}
          <FormField
            control={form.control}
            name="acquired"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date Acquired</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Cost Field */}
          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    placeholder="0.00" 
                    value={field.value === 0 ? '' : field.value}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      // Pass the raw value to let the schema preprocessing handle conversion
                      field.onChange(rawValue === '' ? 0 : parseFloat(rawValue));
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the amount you paid (0 if unknown or gift)
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Value Field */}
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Value</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  placeholder="0.00" 
                  value={field.value === 0 ? '' : field.value}
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    // Pass the raw value to let the schema preprocessing handle conversion
                    field.onChange(rawValue === '' ? 0 : parseFloat(rawValue));
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground mt-1">
                Estimate the current market value of this item
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes Field */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any additional notes about this item here..." 
                  className="min-h-32" 
                  // Handle null values by converting to empty string for the textarea
                  value={field.value === null ? '' : field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image Upload Field */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Images</Label>
          
          <div className="p-3 bg-muted/50 rounded-md">
            <DynamicImageUpload onUpload={handleImageUpload} bucketName="item-images" />
          </div>
          
          {uploadedImages.length > 0 && (
            <div className="mt-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group bg-card border rounded-md overflow-hidden aspect-square">
                    <Image 
                      src={image} 
                      alt={`Uploaded image ${index + 1}`} 
                      fill
                      className="object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200"></div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-80 hover:opacity-100 shadow-sm"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {index === 0 && (
                      <div className="absolute bottom-1 left-1 bg-primary/80 text-primary-foreground text-xs px-2 py-0.5 rounded-sm">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {uploadedImages.length === 0 && (
            <div className="text-center p-4 border border-dashed rounded-md bg-muted/30 text-muted-foreground text-sm">
              No images uploaded yet. Upload images to showcase your item.
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-2 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting && !isSubmittingForm}
            >
              {isSubmittingForm ? "Force Cancel" : "Cancel"}
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isSubmittingForm || isSubmitting}
            className={(isSubmittingForm || isSubmitting) ? "opacity-80" : ""}
          >
            {isSubmittingForm || isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding{uploadedImages.length > 0 ? " item..." : "..."}
              </>
            ) : (
              'Add Item'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
} 