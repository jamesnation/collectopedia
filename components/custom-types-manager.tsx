import { useEffect, useState, useCallback } from "react";
import { SelectCustomType } from "@/db/schema";
import { CustomTypeModal } from "./custom-type-modal";
import { CustomTypesList } from "./custom-types-list";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@clerk/nextjs";
import { getCustomTypesByUserId } from "@/db/queries/custom-types-queries";

interface CustomTypesManagerProps {
  onTypeSelect?: (typeId: string) => void;
  selectedTypeId?: string;
  showSelect?: boolean;
}

export function CustomTypesManager({ onTypeSelect, selectedTypeId, showSelect = true }: CustomTypesManagerProps) {
  const [types, setTypes] = useState<SelectCustomType[]>([]);
  const { userId } = useAuth();

  const loadTypes = useCallback(async () => {
    if (!userId) return;
    const customTypes = await getCustomTypesByUserId(userId);
    setTypes(customTypes);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadTypes();
    }
  }, [userId, loadTypes]);

  function handleTypeCreated() {
    loadTypes();
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Custom Types</h2>
        <CustomTypeModal onSuccess={handleTypeCreated} />
      </div>

      {showSelect && (
        <div className="grid gap-2">
          <label htmlFor="type-select" className="text-sm font-medium">
            Select Type
          </label>
          <Select
            value={selectedTypeId}
            onValueChange={(value) => onTypeSelect?.(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              {types.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <CustomTypesList onTypesChange={loadTypes} />
    </div>
  );
} 