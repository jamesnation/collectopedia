import { useState, useCallback } from 'react';
import { CatalogItem } from '../utils/schema-adapter';
import { SelectItem } from '@/db/schema/items-schema';
import { getItemsByUserIdAction, getItemByIdAction, createItemAction, updateItemAction, deleteItemAction } from '@/actions/items-actions';
import { useAuth } from '@clerk/nextjs';

interface UseCatalogItemsProps {
  initialItems: SelectItem[];
}

export function useCatalogItems({ initialItems = [] }: UseCatalogItemsProps) {
  const [items, setItems] = useState<CatalogItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const { userId } = useAuth();

  const fetchItems = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const result = await getItemsByUserIdAction(userId);
      if (result.isSuccess && result.data) {
        setItems(result.data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const addItem = useCallback(async (newItem: Omit<CatalogItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const itemToCreate = {
        ...newItem,
        id: crypto.randomUUID(),
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        acquired: newItem.acquired instanceof Date ? newItem.acquired : new Date(newItem.acquired),
        notes: newItem.notes || '',
        isSold: newItem.isSold || false,
        soldDate: newItem.soldDate || undefined,
        soldPrice: newItem.soldPrice || undefined,
        image: newItem.image || newItem.images?.[0],
        images: newItem.images || []
      };

      const result = await createItemAction(itemToCreate);
      
      if (result.isSuccess && result.data) {
        setItems(prev => [...prev, result.data]);
      }
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const updateItem = useCallback(async (id: string, itemUpdate: Partial<CatalogItem>) => {
    if (!userId) return;
    
    setLoadingItemId(id);
    try {
      // Get current item for comparison
      const currentItem = items.find(item => item.id === id);
      if (!currentItem) {
        throw new Error('Item not found');
      }

      // Convert acquired date if it's a string
      const processedUpdate = {
        ...itemUpdate,
        acquired: itemUpdate.acquired ? 
          (itemUpdate.acquired instanceof Date ? itemUpdate.acquired : new Date(itemUpdate.acquired)) 
          : undefined
      };

      const result = await updateItemAction(id, processedUpdate);
      
      if (result.isSuccess && result.data) {
        const updatedItem = result.data[0];
        if (updatedItem) {
          setItems(prev => prev.map(item => 
            item.id === id ? updatedItem : item
          ));
        }
      }
    } catch (error) {
      console.error('Error updating item:', error);
    } finally {
      setLoadingItemId(null);
    }
  }, [userId, items]);

  const deleteItem = useCallback(async (id: string) => {
    if (!userId) return;
    
    setLoadingItemId(id);
    try {
      const result = await deleteItemAction(id);
      
      if (result.isSuccess) {
        setItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setLoadingItemId(null);
    }
  }, [userId]);

  return {
    items,
    isLoading,
    loadingItemId,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    setItems
  };
} 