import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { CustomEntity } from '../utils/schema-adapter';
import { 
  getCustomTypesAction, 
  createCustomTypeAction 
} from '@/actions/custom-types-actions';
import { 
  getCustomFranchisesAction,
  createCustomFranchiseAction
} from '@/actions/custom-franchises-actions';
import {
  getCustomBrandsAction,
  createCustomBrandAction
} from '@/actions/custom-brands-actions';

interface UseCustomEntitiesProps {
  initialTypes?: CustomEntity[];
  initialFranchises?: CustomEntity[];
  initialBrands?: CustomEntity[];
}

export function useCustomEntities({
  initialTypes = [],
  initialFranchises = [],
  initialBrands = []
}: UseCustomEntitiesProps = {}) {
  const [customTypes, setCustomTypes] = useState<CustomEntity[]>(initialTypes);
  const [customFranchises, setCustomFranchises] = useState<CustomEntity[]>(initialFranchises);
  const [customBrands, setCustomBrands] = useState<CustomEntity[]>(initialBrands);
  const [isLoading, setIsLoading] = useState({
    types: false,
    franchises: false,
    brands: false
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

  // Franchises
  const loadCustomFranchises = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, franchises: true }));
    try {
      const result = await getCustomFranchisesAction();
      if (result.isSuccess && result.data) {
        setCustomFranchises(result.data);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error loading custom franchises:', error);
      toast({
        title: 'Error',
        description: 'Failed to load custom franchises',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(prev => ({ ...prev, franchises: false }));
    }
  }, [toast]);

  const addCustomFranchise = useCallback(async (name: string) => {
    setIsLoading(prev => ({ ...prev, franchises: true }));
    try {
      const result = await createCustomFranchiseAction({ name });
      
      if (result.isSuccess) {
        await loadCustomFranchises();
        toast({
          title: 'Success',
          description: 'Custom franchise added successfully',
        });
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error adding custom franchise:', error);
      toast({
        title: 'Error',
        description: 'Failed to add custom franchise',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(prev => ({ ...prev, franchises: false }));
    }
  }, [loadCustomFranchises, toast]);

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

  return {
    // Types
    customTypes,
    loadCustomTypes,
    addCustomType,
    isLoadingTypes: isLoading.types,
    
    // Franchises
    customFranchises,
    loadCustomFranchises,
    addCustomFranchise,
    isLoadingFranchises: isLoading.franchises,
    
    // Brands
    customBrands,
    loadCustomBrands,
    addCustomBrand,
    isLoadingBrands: isLoading.brands,
  };
} 