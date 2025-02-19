import { useEffect, useState, useCallback } from "react";
import { SelectCustomType } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { updateCustomTypeAction, deleteCustomTypeAction, getCustomTypesAction, createCustomTypeAction } from "@/actions/custom-types-actions";
import { useAuth } from "@clerk/nextjs";
import { PlusCircle, Pencil, Trash2, Save, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

console.log('CustomTypesList Component Imports:', {
  hasServerActions: typeof getCustomTypesAction !== 'undefined',
  environment: typeof window !== 'undefined' ? 'client' : 'server'
});

interface CustomTypesListProps {
  onTypesChange?: () => void;
}

export function CustomTypesList({ onTypesChange }: CustomTypesListProps) {
  console.log('CustomTypesList Render:', {
    environment: typeof window !== 'undefined' ? 'client' : 'server',
    hasServerActions: typeof getCustomTypesAction !== 'undefined'
  });

  const [types, setTypes] = useState<SelectCustomType[]>([]);
  const [newType, setNewType] = useState("");
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const { userId } = useAuth();
  const { toast } = useToast();

  const loadTypes = useCallback(async () => {
    if (!userId) return;
    const result = await getCustomTypesAction();
    if (result.isSuccess && result.data) {
      console.log('Loaded types:', result.data.length);
      setTypes(result.data);
      onTypesChange?.();
    } else {
      console.error('Failed to load types:', result.error);
      toast({
        title: "Error",
        description: "Failed to load custom types",
        variant: "destructive",
      });
    }
  }, [userId, onTypesChange, toast]);

  useEffect(() => {
    if (userId) {
      loadTypes();
    }
  }, [userId, loadTypes]);

  async function handleAddType() {
    if (!newType.trim()) return;

    try {
      const formData = new FormData();
      formData.append("name", newType);
      
      const result = await createCustomTypeAction(formData);
      
      if (result.isSuccess) {
        toast({
          title: "Success",
          description: "Custom type created successfully",
        });
        setNewType("");
        loadTypes();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create custom type",
        variant: "destructive",
      });
    }
  }

  async function handleDelete(typeId: string) {
    try {
      const formData = new FormData();
      formData.append("id", typeId);
      
      const result = await deleteCustomTypeAction(formData);
      
      if (result.isSuccess) {
        toast({
          title: "Success",
          description: "Custom type deleted successfully",
        });
        loadTypes();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete custom type",
        variant: "destructive",
      });
    }
  }

  async function handleSaveEdit() {
    if (!editingTypeId || !editValue.trim()) return;

    try {
      const formData = new FormData();
      formData.append("id", editingTypeId);
      formData.append("name", editValue);

      const result = await updateCustomTypeAction(formData);
      
      if (result.isSuccess) {
        toast({
          title: "Success",
          description: "Custom type updated successfully",
        });
        setEditingTypeId(null);
        setEditValue("");
        loadTypes();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update custom type",
        variant: "destructive",
      });
    }
  }

  function startEditing(type: SelectCustomType) {
    setEditingTypeId(type.id);
    setEditValue(type.name);
  }

  function cancelEdit() {
    setEditingTypeId(null);
    setEditValue("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Label htmlFor="new-type" className="sr-only">
          New Type
        </Label>
        <Input
          id="new-type"
          placeholder="Enter new type"
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleAddType} disabled={!newType.trim()}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Type
        </Button>
      </div>

      {types.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No types added yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((type) => (
              <TableRow key={type.id}>
                <TableCell>
                  {editingTypeId === type.id ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="max-w-sm"
                    />
                  ) : (
                    type.name
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingTypeId === type.id ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={handleSaveEdit}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => startEditing(type)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Custom Type</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &ldquo;{type.name}&rdquo;? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(type.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
} 