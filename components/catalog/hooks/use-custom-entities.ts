import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { CustomEntity } from '../utils/schema-adapter';
import { 
  getCustomTypesAction, 
  createCustomTypeAction 
} from '@/actions/custom-types-actions';
import {
  getCustomBrandsAction,
  createCustomBrandAction
} from '@/actions/custom-brands-actions';
import {
  getCustomManufacturersAction,
  createCustomManufacturerAction
} from '@/actions/custom-manufacturers-actions';

interface UseCustomEntitiesProps {
  initialTypes?: CustomEntity[];
  initialBrands?: CustomEntity[];
  initialManufacturers?: CustomEntity[];
}

export function useCustomEntities({
  initialTypes = [],
  initialBrands = [],
  initialManufacturers = []
}: UseCustomEntitiesProps = {}) {
  const [customTypes, setCustomTypes] = useState<CustomEntity[]>(initialTypes);
  const [customBrands, setCustomBrands] = useState<CustomEntity[]>(initialBrands);
  const [customManufacturers, setCustomManufacturers] = useState<CustomEntity[]>(initialManufacturers);
  const [isLoading, setIsLoading] = useState({
    types: false,
    brands: false,
    manufacturers: false
  });
  const { toast } = useToast();

  // Types
  const loadCustomTypes = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, types: true }));
    try {
      const result = await getCustomTypesAction();
      if (result.isSuccess && result.data) {
        setCustomTypes(result.data);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error loading custom types:', error);
      toast({
        title: 'Error',
        description: 'Failed to load custom types',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(prev => ({ ...prev, types: false }));
    }
  }, [toast]);

  const addCustomType = useCallback(async (name: string) => {
    setIsLoading(prev => ({ ...prev, types: true }));
    try {
      const formData = new FormData();
      formData.append('name', name);
      
      const result = await createCustomTypeAction(formData);
      
      if (result.isSuccess) {
        await loadCustomTypes();
        toast({
          title: 'Success',
          description: 'Custom type added successfully',
        });
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error adding custom type:', error);
      toast({
        title: 'Error',
        description: 'Failed to add custom type',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(prev => ({ ...prev, types: false }));
    }
  }, [loadCustomTypes, toast]);

  // Brands
  const loadCustomBrands = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, brands: true }));
    try {
      const result = await getCustomBrandsAction();
      if (result.isSuccess && result.data) {
        setCustomBrands(result.data);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error loading custom brands:', error);
      toast({
        title: 'Error',
        description: 'Failed to load custom brands',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(prev => ({ ...prev, brands: false }));
    }
  }, [toast]);

  const addCustomBrand = useCallback(async (name: string) => {
    setIsLoading(prev => ({ ...prev, brands: true }));
    try {
      const result = await createCustomBrandAction({ name });
      
      if (result.isSuccess) {
        await loadCustomBrands();
        toast({
          title: 'Success',
          description: 'Custom brand added successfully',
        });
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error adding custom brand:', error);
      toast({
        title: 'Error',
        description: 'Failed to add custom brand',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(prev => ({ ...prev, brands: false }));
    }
  }, [loadCustomBrands, toast]);

  // Manufacturers
  const loadCustomManufacturers = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, manufacturers: true }));
    try {
      const result = await getCustomManufacturersAction();
      if (result.isSuccess && result.data) {
        setCustomManufacturers(result.data);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error loading custom manufacturers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load custom manufacturers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(prev => ({ ...prev, manufacturers: false }));
    }
  }, [toast]);

  const addCustomManufacturer = useCallback(async (name: string) => {
    setIsLoading(prev => ({ ...prev, manufacturers: true }));
    try {
      const result = await createCustomManufacturerAction({ name });
      
      if (result.isSuccess) {
        await loadCustomManufacturers();
        toast({
          title: 'Success',
          description: 'Custom manufacturer added successfully',
        });
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error adding custom manufacturer:', error);
      toast({
        title: 'Error',
        description: 'Failed to add custom manufacturer',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(prev => ({ ...prev, manufacturers: false }));
    }
  }, [loadCustomManufacturers, toast]);

  return {
    // Types
    customTypes,
    loadCustomTypes,
    addCustomType,
    isLoadingTypes: isLoading.types,
    
    // Brands
    customBrands,
    loadCustomBrands,
    addCustomBrand,
    isLoadingBrands: isLoading.brands,
    
    // Manufacturers
    customManufacturers,
    loadCustomManufacturers,
    addCustomManufacturer,
    isLoadingManufacturers: isLoading.manufacturers,
  };
} 