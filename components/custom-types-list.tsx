import { useEffect, useState } from "react";
import { SelectCustomType } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { updateCustomTypeAction, deleteCustomTypeAction } from "@/actions/custom-types-actions";
import { useAuth } from "@clerk/nextjs";
import { getCustomTypesByUserId } from "@/db/queries/custom-types-queries";

interface CustomTypesListProps {
  onTypesChange?: () => void;
}

export function CustomTypesList({ onTypesChange }: CustomTypesListProps) {
  const [types, setTypes] = useState<SelectCustomType[]>([]);
  const [editingType, setEditingType] = useState<SelectCustomType | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { userId } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadTypes();
    }
  }, [userId]);

  async function loadTypes() {
    if (!userId) return;
    const customTypes = await getCustomTypesByUserId(userId);
    setTypes(customTypes);
    onTypesChange?.();
  }

  async function handleEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingType) return;

    const formData = new FormData(event.currentTarget);
    formData.append("id", editingType.id);
    
    const result = await updateCustomTypeAction(formData);
    
    if (result.isSuccess) {
      toast({
        title: "Success",
        description: "Custom type updated successfully",
      });
      setIsEditDialogOpen(false);
      loadTypes();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update custom type",
        variant: "destructive",
      });
    }
  }

  async function handleDelete(type: SelectCustomType) {
    const formData = new FormData();
    formData.append("id", type.id);
    
    const result = await deleteCustomTypeAction(formData);
    
    if (result.isSuccess) {
      toast({
        title: "Success",
        description: "Custom type deleted successfully",
      });
      loadTypes();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete custom type",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="grid gap-4">
      <h2 className="text-2xl font-bold">Your Custom Types</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {types.map((type) => (
          <Card key={type.id}>
            <CardHeader>
              <CardTitle>{type.name}</CardTitle>
              {type.description && (
                <CardDescription>{type.description}</CardDescription>
              )}
            </CardHeader>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingType(type);
                  setIsEditDialogOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(type)}
              >
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Type</DialogTitle>
            <DialogDescription>
              Make changes to your custom type.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingType?.name}
                placeholder="Enter type name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingType?.description || ""}
                placeholder="Enter type description (optional)"
              />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 