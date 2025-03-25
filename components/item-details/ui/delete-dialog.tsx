/**
 * Delete Dialog Component
 * 
 * Displays a confirmation dialog before deleting an item to prevent accidental deletions.
 */

import React from 'react'
import { Button } from "@/components/ui/button"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"

interface DeleteDialogProps {
  onDelete: () => Promise<void>
}

export default function DeleteDialog({ onDelete }: DeleteDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="text-muted-foreground hover:text-destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-1" />
          <span className="text-xs">Delete</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="dark:bg-card dark:border-border">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this item?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the item from your collection.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="dark:bg-card dark:border-border dark:text-foreground dark:hover:bg-muted/40">Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 