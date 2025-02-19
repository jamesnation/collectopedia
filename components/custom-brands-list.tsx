import { useEffect, useState } from "react";
import { SelectCustomBrand } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { createCustomBrandAction, updateCustomBrandAction, deleteCustomBrandAction, getCustomBrandsAction } from "@/actions/custom-brands-actions";
import { useAuth } from "@clerk/nextjs";
import { PlusCircle, Pencil, Trash2, Save, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

console.log('CustomBrandsList Component Imports:', {
  hasServerActions: typeof getCustomBrandsAction !== 'undefined',
  environment: typeof window !== 'undefined' ? 'client' : 'server'
});

interface CustomBrandsListProps {
  onBrandsChange?: () => void;
}

export function CustomBrandsList({ onBrandsChange }: CustomBrandsListProps) {
  console.log('CustomBrandsList Render:', {
    environment: typeof window !== 'undefined' ? 'client' : 'server',
    hasServerActions: typeof getCustomBrandsAction !== 'undefined'
  });

  const [brands, setBrands] = useState<SelectCustomBrand[]>([]);
  const [newBrand, setNewBrand] = useState("");
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const { userId } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadBrands();
    }
  }, [userId]);

  async function loadBrands() {
    if (!userId) return;
    const result = await getCustomBrandsAction();
    if (result.isSuccess && result.data) {
      console.log('Loaded brands:', result.data.length);
      setBrands(result.data);
      onBrandsChange?.();
    } else {
      console.error('Failed to load brands:', result.error);
      toast({
        title: "Error",
        description: "Failed to load custom brands",
        variant: "destructive",
      });
    }
  }

  async function handleAddBrand() {
    if (!newBrand.trim()) return;

    try {
      const result = await createCustomBrandAction({
        name: newBrand,
      });
      
      if (result.isSuccess) {
        toast({
          title: "Success",
          description: "Custom brand created successfully",
        });
        setNewBrand("");
        loadBrands();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create custom brand",
        variant: "destructive",
      });
    }
  }

  async function handleDelete(brandId: string) {
    try {
      const result = await deleteCustomBrandAction(brandId);
      
      if (result.isSuccess) {
        toast({
          title: "Success",
          description: "Custom brand deleted successfully",
        });
        loadBrands();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete custom brand",
        variant: "destructive",
      });
    }
  }

  async function handleSaveEdit() {
    if (!editingBrandId || !editValue.trim()) return;

    try {
      const result = await updateCustomBrandAction({
        id: editingBrandId,
        name: editValue,
      });
      
      if (result.isSuccess) {
        toast({
          title: "Success",
          description: "Custom brand updated successfully",
        });
        setEditingBrandId(null);
        setEditValue("");
        loadBrands();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update custom brand",
        variant: "destructive",
      });
    }
  }

  function startEditing(brand: SelectCustomBrand) {
    setEditingBrandId(brand.id);
    setEditValue(brand.name);
  }

  function cancelEdit() {
    setEditingBrandId(null);
    setEditValue("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Label htmlFor="new-brand" className="sr-only">
          New Brand
        </Label>
        <Input
          id="new-brand"
          placeholder="Enter new brand"
          value={newBrand}
          onChange={(e) => setNewBrand(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleAddBrand} disabled={!newBrand.trim()}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Brand
        </Button>
      </div>

      {brands.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No brands added yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell>
                  {editingBrandId === brand.id ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="max-w-sm"
                    />
                  ) : (
                    brand.name
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingBrandId === brand.id ? (
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
                      <Button variant="ghost" size="sm" onClick={() => startEditing(brand)}>
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
                            <AlertDialogTitle>Delete Custom Brand</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{brand.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(brand.id)}
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