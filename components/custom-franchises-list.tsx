import { useEffect, useState, useCallback } from "react";
import { SelectCustomFranchise } from "@/db/schema/custom-franchises-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { createCustomFranchiseAction, updateCustomFranchiseAction, deleteCustomFranchiseAction, getCustomFranchisesAction } from "@/actions/custom-franchises-actions";
import { useAuth } from "@clerk/nextjs";
import { PlusCircle, Pencil, Trash2, Save, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

console.log('CustomFranchisesList Component Imports:', {
  hasServerActions: typeof getCustomFranchisesAction !== 'undefined',
  environment: typeof window !== 'undefined' ? 'client' : 'server'
});

interface CustomFranchisesListProps {
  onFranchisesChange?: () => void;
}

export function CustomFranchisesList({ onFranchisesChange }: CustomFranchisesListProps) {
  console.log('CustomFranchisesList Render - Checking for quote escaping issues');

  const [franchises, setFranchises] = useState<SelectCustomFranchise[]>([]);
  const [newFranchise, setNewFranchise] = useState("");
  const [editingFranchiseId, setEditingFranchiseId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const { userId } = useAuth();
  const { toast } = useToast();

  const loadFranchises = useCallback(async () => {
    if (!userId) return;
    const result = await getCustomFranchisesAction();
    if (result.isSuccess && result.data) {
      console.log('Loaded franchises:', result.data.length);
      setFranchises(result.data);
      onFranchisesChange?.();
    } else {
      console.error('Failed to load franchises:', result.error);
      toast({
        title: "Error",
        description: "Failed to load custom franchises",
        variant: "destructive",
      });
    }
  }, [userId, onFranchisesChange, toast]);

  useEffect(() => {
    if (userId) {
      loadFranchises();
    }
  }, [userId, loadFranchises]);

  async function handleAddFranchise() {
    if (!newFranchise.trim()) return;

    try {
      const result = await createCustomFranchiseAction({
        name: newFranchise,
      });
      
      if (result.isSuccess) {
        toast({
          title: "Success",
          description: "Custom franchise created successfully",
        });
        setNewFranchise("");
        loadFranchises();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create custom franchise",
        variant: "destructive",
      });
    }
  }

  async function handleDelete(franchiseId: string) {
    try {
      const result = await deleteCustomFranchiseAction(franchiseId);
      
      if (result.isSuccess) {
        toast({
          title: "Success",
          description: "Custom franchise deleted successfully",
        });
        loadFranchises();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete custom franchise",
        variant: "destructive",
      });
    }
  }

  async function handleSaveEdit() {
    if (!editingFranchiseId || !editValue.trim()) return;

    try {
      const result = await updateCustomFranchiseAction({
        id: editingFranchiseId,
        name: editValue,
      });
      
      if (result.isSuccess) {
        toast({
          title: "Success",
          description: "Custom franchise updated successfully",
        });
        setEditingFranchiseId(null);
        setEditValue("");
        loadFranchises();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update custom franchise",
        variant: "destructive",
      });
    }
  }

  function startEditing(franchise: SelectCustomFranchise) {
    setEditingFranchiseId(franchise.id);
    setEditValue(franchise.name);
  }

  function cancelEdit() {
    setEditingFranchiseId(null);
    setEditValue("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Label htmlFor="new-franchise" className="sr-only">
          New Franchise
        </Label>
        <Input
          id="new-franchise"
          placeholder="Enter new franchise"
          value={newFranchise}
          onChange={(e) => setNewFranchise(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleAddFranchise} disabled={!newFranchise.trim()}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Franchise
        </Button>
      </div>

      {franchises.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No franchises added yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {franchises.map((franchise) => (
              <TableRow key={franchise.id}>
                <TableCell>
                  {editingFranchiseId === franchise.id ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="max-w-sm"
                    />
                  ) : (
                    franchise.name
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingFranchiseId === franchise.id ? (
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
                      <Button variant="ghost" size="sm" onClick={() => startEditing(franchise)}>
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
                            <AlertDialogTitle>Delete Custom Franchise</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &ldquo;{franchise.name}&rdquo;? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(franchise.id)}
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