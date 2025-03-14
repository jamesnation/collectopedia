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
        // Add diagnostic logs for image data
        console.log('[ITEMS DATA] Successfully fetched items:', result.data.length);
        
        // Check the first few items for image data
        const sampleItems = result.data.slice(0, 5);
        console.log('[ITEMS DATA] Sample items image data:', 
          sampleItems.map(item => ({
            id: item.id.substring(0, 8) + '...',
            name: item.name,
            hasDirectImage: Boolean(item.image),
            imageValue: item.image ? (typeof item.image === 'string' ? 
              (item.image.length > 50 ? item.image.substring(0, 50) + '...' : item.image) : 
              'non-string-value') : null
          }))
        );
        
        // Count items with images
        const itemsWithImage = result.data.filter(item => Boolean(item.image)).length;
        console.log(`[ITEMS DATA] ${itemsWithImage} out of ${result.data.length} items have a direct image value`);
        
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
      console.log('🔄 USE_CATALOG_ITEMS - Adding item:', item.name);
      
      const newItem = {
        ...item,
        id: crypto.randomUUID(),
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: item.notes || '',
        condition: item.condition || "Used",
      } as CatalogItem;
      
      const schemaItem = mapCatalogItemToSchemaItem(newItem);
      
      // Enhanced debug logging
      console.log('🔄 USE_CATALOG_ITEMS - Mapped item to schema:', {
        id: schemaItem.id,
        name: schemaItem.name,
        userId: schemaItem.userId,
        // Include more properties as needed for debugging
      });
      
      console.log('🔄 USE_CATALOG_ITEMS - Calling createItemAction...');
      const result = await createItemAction(schemaItem);
      console.log('🔄 USE_CATALOG_ITEMS - createItemAction result:', result);
      
      if (result.isSuccess) {
        console.log('✅ USE_CATALOG_ITEMS - Item added successfully, fetching items...');
        await fetchItems();
        toast({
          title: "Success",
          description: "Item added successfully to your collection.",
        });
        return true;
      } else {
        console.error('❌ USE_CATALOG_ITEMS - Error from createItemAction:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ USE_CATALOG_ITEMS - Error adding item:', error);
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
        condition: (itemUpdate.condition || currentItem.condition) as "New" | "Used",
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