import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { CatalogItem, mapSchemaItemToCatalogItem, mapCatalogItemToSchemaItem } from '../utils/schema-adapter';
import { SelectItem } from '@/db/schema/items-schema';
import { useToast } from '@/components/ui/use-toast';
import { 
  getItemsByUserIdAction, 
  createItemAction, 
  updateItemAction, 
  deleteItemAction 
} from '@/actions/items-actions';

interface UseCatalogItemsProps {
  initialItems?: SelectItem[];
}

export function useCatalogItems({ initialItems = [] }: UseCatalogItemsProps = {}) {
  const [items, setItems] = useState<CatalogItem[]>(
    initialItems.map(mapSchemaItemToCatalogItem)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const { userId } = useAuth();
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const result = await getItemsByUserIdAction(userId);
      if (result.isSuccess && result.data) {
        const catalogItems = result.data.map(mapSchemaItemToCatalogItem);
        setItems(catalogItems);
        return catalogItems;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
      toast({
        title: "Error",
        description: "Failed to load your items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  const addItem = useCallback(async (item: Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!userId) return false;
    
    setIsLoading(true);
    try {
      const newItem = {
        ...item,
        id: crypto.randomUUID(),
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: item.notes || '',
        condition: item.condition || "Used - complete",
      } as CatalogItem;
      
      const schemaItem = mapCatalogItemToSchemaItem(newItem);
      
      // Debug logging
      console.log('Original item soldPrice type:', item.soldPrice === null ? 'null' : typeof item.soldPrice);
      console.log('New item soldPrice type:', newItem.soldPrice === null ? 'null' : typeof newItem.soldPrice);
      console.log('Schema item soldPrice type:', schemaItem.soldPrice === undefined ? 'undefined' : typeof schemaItem.soldPrice);
      
      const result = await createItemAction(schemaItem);
      
      if (result.isSuccess) {
        await fetchItems();
        toast({
          title: "Success",
          description: "Item added successfully to your collection.",
        });
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, fetchItems, toast]);

  const updateItem = useCallback(async (id: string, itemUpdate: Partial<CatalogItem>) => {
    setLoadingItemId(id);
    try {
      const currentItem = items.find(item => item.id === id);
      if (!currentItem) throw new Error("Item not found");
      
      // Debug logging for eBay values
      if ('ebayListed' in itemUpdate) {
        console.log('updateItem - ebayListed before:', currentItem.ebayListed, 'type:', typeof currentItem.ebayListed);
        console.log('updateItem - ebayListed update:', itemUpdate.ebayListed, 'type:', typeof itemUpdate.ebayListed);
      }
      
      if ('ebaySold' in itemUpdate) {
        console.log('updateItem - ebaySold before:', currentItem.ebaySold, 'type:', typeof currentItem.ebaySold);
        console.log('updateItem - ebaySold update:', itemUpdate.ebaySold, 'type:', typeof itemUpdate.ebaySold);
      }
      
      const updatedItem = {
        ...currentItem,
        ...itemUpdate,
        notes: (itemUpdate.notes !== undefined ? itemUpdate.notes : currentItem.notes) || '',
        condition: (itemUpdate.condition || currentItem.condition) as "New" | "Used - complete" | "Used - item only",
        updatedAt: new Date()
      };
      
      const schemaItem = mapCatalogItemToSchemaItem(updatedItem);
      
      // Debug logging
      console.log('Current item soldPrice type:', currentItem.soldPrice === null ? 'null' : typeof currentItem.soldPrice);
      console.log('Updated item soldPrice type:', updatedItem.soldPrice === null ? 'null' : typeof updatedItem.soldPrice);
      console.log('Schema item soldPrice type:', schemaItem.soldPrice === undefined ? 'undefined' : typeof schemaItem.soldPrice);
      
      if ('ebayListed' in itemUpdate || 'ebaySold' in itemUpdate) {
        console.log('Updating eBay values in schema item:', {
          ebayListed: schemaItem.ebayListed,
          ebaySold: schemaItem.ebaySold
        });
      }
      
      const result = await updateItemAction(id, schemaItem);
      
      if (result.isSuccess) {
        setItems(prevItems => 
          prevItems.map(item => item.id === id ? updatedItem : item)
        );
        
        toast({
          title: "Success",
          description: "Item updated successfully.",
        });
        
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoadingItemId(null);
    }
  }, [items, toast]);

  const deleteItem = useCallback(async (id: string) => {
    setLoadingItemId(id);
    try {
      const result = await deleteItemAction(id);
      
      if (result.isSuccess) {
        setItems(prevItems => prevItems.filter(item => item.id !== id));
        
        toast({
          title: "Item deleted",
          description: "The item has been removed from your collection.",
        });
        
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoadingItemId(null);
    }
  }, [toast]);

  return {
    items,
    isLoading,
    loadingItemId,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    setItems,
  };
} 