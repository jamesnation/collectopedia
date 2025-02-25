import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Loader2 } from "lucide-react";
import { createCustomFranchiseAction } from "@/actions/custom-franchises-actions";
import { useToast } from "@/components/ui/use-toast";

interface CustomFranchiseModalProps {
  onSuccess?: () => void;
}

export function CustomFranchiseModal({ onSuccess }: CustomFranchiseModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSubmitting(true);

    try {
      console.log('Creating custom franchise:', formData);
      const result = await createCustomFranchiseAction({
        name: formData.name,
        description: formData.description
      });
      console.log('Create custom franchise result:', result);

      if (result.isSuccess) {
        toast({
          title: "Success",
          description: "Custom franchise created successfully",
        });
        setFormData({ name: "", description: "" });
        if (onSuccess) {
          await onSuccess();
        }
        setIsOpen(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating custom franchise:', error);
      toast({
        title: "Error",
        description: "Failed to create custom franchise",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <PlusCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Custom Franchise</DialogTitle>
          <DialogDescription>
            Create a new custom franchise for your collection items.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Franchise Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Franchise"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 