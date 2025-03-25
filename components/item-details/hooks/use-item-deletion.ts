/**
 * Hook for managing item deletion
 * 
 * This hook manages:
 * - Deleting an item
 * - Error handling for deletion
 * - Navigation after successful deletion
 */

import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { deleteItemAction } from '@/actions/items-actions'

export function useItemDeletion(itemId: string | undefined) {
  const router = useRouter()
  const { toast } = useToast()
  
  // Delete the item
  const handleDelete = async () => {
    if (!itemId) return
    
    try {
      const result = await deleteItemAction(itemId)
      
      if (result.isSuccess) {
        toast({
          title: "Item deleted",
          description: "The item has been deleted successfully.",
        })
        
        // Navigate back to the collection page
        router.push('/my-collection')
      } else {
        throw new Error(result.error || 'Failed to delete item')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  return { handleDelete }
} 