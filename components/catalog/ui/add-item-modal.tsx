/**
 * Add Item Modal Component
 * 
 * A modal dialog for adding new items to the collection.
 * This component has been simplified to use a direct approach without complex promise handling.
 */

"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus, AlertTriangle } from "lucide-react"
import { AddItemForm } from './add-item-form'
import { CatalogItem } from '../utils/item-types'
import { CustomEntity } from "../filter-controls/filter-types"
import { useAddItemMutation } from '../hooks/use-catalog-queries'
import { useToast } from '@/components/ui/use-toast'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export interface AddItemModalProps {
  customTypes: CustomEntity[]
  customFranchises: CustomEntity[]
  customBrands: CustomEntity[]
  onLoadCustomTypes: () => Promise<void>
  onLoadCustomFranchises: () => Promise<void>
  onLoadCustomBrands: () => Promise<void>
  isLoading?: boolean
  trigger?: React.ReactNode
}

// Error type for localStorage
interface StoredError {
  message: string;
  time: string;
  stack: string | null;
}

export function AddItemModal({
  customTypes,
  customFranchises,
  customBrands,
  onLoadCustomTypes,
  onLoadCustomFranchises,
  onLoadCustomBrands,
  isLoading = false,
  trigger
}: AddItemModalProps) {
  const [open, setOpen] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [lastError, setLastError] = useState<StoredError | null>(null)
  const { toast } = useToast()
  
  // Get the mutation hook from React Query
  const { mutate: addItem, isPending, isSuccess, isError, reset } = useAddItemMutation()
  
  // Check for stored errors on component mount
  useEffect(() => {
    const checkForStoredErrors = () => {
      try {
        const storedError = localStorage.getItem('lastAddItemError')
        if (storedError) {
          const errorData = JSON.parse(storedError) as StoredError
          setLastError(errorData)
          
          // Show a notification that an error was found
          toast({
            title: "Previous Error Found",
            description: "We found an error from your last attempt to add an item.",
            variant: "destructive",
            action: (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowErrorDialog(true)}
              >
                View Error
              </Button>
            )
          })
        }
      } catch (e) {
        console.error("Error retrieving stored error:", e)
      }
    }
    
    checkForStoredErrors()
  }, [toast])
  
  // Clear error when dialog is closed
  const handleClearError = () => {
    localStorage.removeItem('lastAddItemError')
    setLastError(null)
    setShowErrorDialog(false)
  }
  
  // Close modal on successful submission
  useEffect(() => {
    if (isSuccess) {
      console.error('[MODAL] Item added successfully, closing modal');
      setOpen(false);
      
      // Reset mutation state
      reset();
    }
  }, [isSuccess, reset]);
  
  // Close modal on error with a delay (to allow error to be seen)
  useEffect(() => {
    if (isError) {
      // Don't auto-close on error
      console.error('[MODAL] Error occurred in mutation');
    }
  }, [isError]);

  // Simple submission handler - just forwards to the mutation and returns a promise
  const handleSubmit = async (formData: Omit<CatalogItem, 'id'>) => {
    console.error(`[MODAL] Submitting form data for: ${formData.name}`);
    
    // Create a promise that resolves when the mutation completes
    return new Promise<CatalogItem>((resolve, reject) => {
      // Track if the mutation has completed
      let isCompleted = false;
      
      // Call the mutation
      addItem(formData, {
        onSuccess: (data) => {
          if (!isCompleted) {
            isCompleted = true;
            resolve(data);
          }
        },
        onError: (error) => {
          if (!isCompleted) {
            isCompleted = true;
            reject(error);
          }
        }
      });
      
      // Set a safety timeout
      setTimeout(() => {
        if (!isCompleted) {
          const timeoutError = new Error("Mutation timeout - the operation may still be processing");
          reject(timeoutError);
        }
      }, 30000); // 30 second safety timeout
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(newOpen) => {
        // Only allow closing if we're not in the middle of submission
        if (isPending && newOpen === false) {
          toast({
            title: "Please wait",
            description: "Item is still being added...",
            variant: "default"
          });
          return; // Prevent closing while submitting
        }
        
        // Proceed with state change
        setOpen(newOpen);
        
        // If closing the modal, reset mutation state
        if (!newOpen) {
          reset();
        }
      }}>
        <DialogTrigger asChild>
          <div className="flex items-center">
            {trigger || (
              <Button 
                className="bg-violet-600 hover:bg-violet-700 text-white"
                disabled={false} // Never disable the button
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            )}
            
            {lastError && (
              <Button
                variant="outline"
                size="sm"
                className="ml-2 text-red-500 border-red-300"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowErrorDialog(true)
                }}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Show Last Error
              </Button>
            )}
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Add New Item</DialogTitle>
          </DialogHeader>
          <AddItemForm 
            onSubmit={handleSubmit} 
            onCancel={() => {
              if (!isPending) {
                setOpen(false);
              } else {
                toast({
                  title: "Please wait",
                  description: "Item is still being added...",
                  variant: "default"
                });
              }
            }}
            customTypes={customTypes}
            customFranchises={customFranchises}
            customBrands={customBrands}
            onLoadCustomTypes={onLoadCustomTypes}
            onLoadCustomFranchises={onLoadCustomFranchises}
            onLoadCustomBrands={onLoadCustomBrands}
            isSubmitting={isPending}
          />
        </DialogContent>
      </Dialog>
      
      {/* Error Display Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Error Adding Item
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-500">
              This error occurred at {lastError?.time ? new Date(lastError.time).toLocaleString() : 'unknown time'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4 space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800">
              <h3 className="font-semibold mb-1">Error Message:</h3>
              <p>{lastError?.message || 'Unknown error'}</p>
            </div>
            
            {lastError?.stack && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                <h3 className="font-semibold mb-1">Error Details:</h3>
                <pre className="whitespace-pre-wrap text-xs overflow-x-auto">
                  {lastError.stack}
                </pre>
              </div>
            )}
            
            <div className="p-4 bg-amber-50 border border-amber-200 rounded">
              <h3 className="font-semibold mb-1">Troubleshooting Tips:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Large images may cause timeouts - try using smaller images</li>
                <li>The server has a 3-minute timeout - very large operations may fail</li>
                <li>Network issues can interrupt uploads - check your connection</li>
                <li>If the error persists, try adding the item with fewer images first</li>
              </ul>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleClearError}>
              Dismiss & Clear Error
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 