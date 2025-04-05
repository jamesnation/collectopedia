import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { CustomEntity } from '../utils/schema-adapter';
import { SelectCustomAttribute } from '@/db/schema';
import { getCustomAttributesAction } from '@/actions/custom-attribute-actions';

interface UseCustomEntitiesProps {
  initialTypes?: CustomEntity[];
  initialFranchises?: CustomEntity[];
  initialBrands?: CustomEntity[];
}

type AttributeType = 'brand' | 'franchise' | 'type';

export function useCustomEntities({
  initialTypes = [],
  initialFranchises = [],
  initialBrands = []
}: UseCustomEntitiesProps = {}) {
  const [customTypes, setCustomTypes] = useState<SelectCustomAttribute[]>(initialTypes as SelectCustomAttribute[]);
  const [customFranchises, setCustomFranchises] = useState<SelectCustomAttribute[]>(initialFranchises as SelectCustomAttribute[]);
  const [customBrands, setCustomBrands] = useState<SelectCustomAttribute[]>(initialBrands as SelectCustomAttribute[]);
  const [isLoading, setIsLoading] = useState({
    types: false,
    franchises: false,
    brands: false
  });
  const { toast } = useToast();

  const fetchEntities = useCallback(async (type: AttributeType) => {
    setIsLoading(prev => ({ ...prev, [pluralize(type)]: true }));
    try {
      const result = await getCustomAttributesAction(type);
      if (result.isSuccess && result.data) {
        if (type === 'type') setCustomTypes(result.data);
        else if (type === 'franchise') setCustomFranchises(result.data);
        else if (type === 'brand') setCustomBrands(result.data);
        return result.data;
      } else {
        throw new Error(result.error || `Failed to load custom ${pluralize(type)}`);
      }
    } catch (error: any) {
      console.error(`Error loading custom ${pluralize(type)}:`, error);
      toast({
        title: 'Error',
        description: error.message || `Failed to load custom ${pluralize(type)}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(prev => ({ ...prev, [pluralize(type)]: false }));
    }
  }, [toast]);

  const loadCustomTypes = useCallback(() => fetchEntities('type'), [fetchEntities]);
  const loadCustomFranchises = useCallback(() => fetchEntities('franchise'), [fetchEntities]);
  const loadCustomBrands = useCallback(() => fetchEntities('brand'), [fetchEntities]);

  return {
    customTypes,
    loadCustomTypes,
    isLoadingTypes: isLoading.types,
    customFranchises,
    loadCustomFranchises,
    isLoadingFranchises: isLoading.franchises,
    customBrands,
    loadCustomBrands,
    isLoadingBrands: isLoading.brands,
  };
}

const pluralize = (s: string) => {
    if (s === 'type') return 'types';
    if (s === 'franchise') return 'franchises';
    if (s === 'brand') return 'brands';
    return s;
}; 