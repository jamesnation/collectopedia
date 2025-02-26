"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Edit, Trash, Save, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createCustomBrandAction, getCustomBrandsAction, updateCustomBrandAction, deleteCustomBrandAction } from "@/actions/custom-brands-actions";
import { useToast } from "@/components/ui/use-toast";

export function CustomBrandsList() {
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [newBrandName, setNewBrandName] = useState("");
  const [editingBrand, setEditingBrand] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const result = await getCustomBrandsAction();
      if (result.isSuccess && result.data) {
        setBrands(result.data);
      }
    } catch (error) {
      console.error("Error loading brands:", error);
    }
  };

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await createCustomBrandAction({ name: newBrandName });
      if (result.isSuccess && result.data) {
        setBrands([...brands, result.data]);
        setNewBrandName("");
        toast({
          title: "Brand added",
          description: "Custom brand has been added successfully.",
        });
      } else {
        throw new Error(result.error || "Failed to add brand");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add brand. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditBrand = (brand: { id: string; name: string }) => {
    setEditingBrand(brand);
  };

  const handleSaveEdit = async () => {
    if (!editingBrand) return;
    
    setIsLoading(true);
    try {
      const result = await updateCustomBrandAction({
        id: editingBrand.id,
        name: editingBrand.name
      });
      if (result.isSuccess) {
        setBrands(brands.map(b => b.id === editingBrand.id ? editingBrand : b));
        setEditingBrand(null);
        toast({
          title: "Brand updated",
          description: "Custom brand has been updated successfully.",
        });
      } else {
        throw new Error(result.error || "Failed to update brand");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update brand. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;
    
    setIsLoading(true);
    try {
      const result = await deleteCustomBrandAction(id);
      if (result.isSuccess) {
        setBrands(brands.filter(b => b.id !== id));
        toast({
          title: "Brand deleted",
          description: "Custom brand has been deleted successfully.",
        });
      } else {
        throw new Error(result.error || "Failed to delete brand");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete brand. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          placeholder="Add new brand..."
          value={newBrandName}
          onChange={(e) => setNewBrandName(e.target.value)}
          className="max-w-sm"
        />
        <Button 
          onClick={handleAddBrand} 
          disabled={isLoading || !newBrandName.trim()}
          className="flex items-center"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Brand
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Brand Name</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {brands.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                No custom brands added yet
              </TableCell>
            </TableRow>
          ) : (
            brands.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell>
                  {editingBrand?.id === brand.id ? (
                    <Input
                      value={editingBrand.name}
                      onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                    />
                  ) : (
                    brand.name
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {editingBrand?.id === brand.id ? (
                      <>
                        <Button size="icon" variant="ghost" onClick={handleSaveEdit} disabled={isLoading}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingBrand(null)} disabled={isLoading}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => handleEditBrand(brand)} disabled={isLoading}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteBrand(brand.id)} disabled={isLoading}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 