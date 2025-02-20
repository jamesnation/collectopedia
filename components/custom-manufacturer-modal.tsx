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
import { createCustomManufacturerAction } from "@/actions/custom-manufacturers-actions";
import { useToast } from "@/components/ui/use-toast";

interface CustomManufacturerModalProps {
  onSuccess?: () => void;
}

export function CustomManufacturerModal({ onSuccess }: CustomManufacturerModalProps) {
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
      console.log('Creating custom manufacturer:', formData);
      const result = await createCustomManufacturerAction({
        name: formData.name,
        description: formData.description
      });
      console.log('Create custom manufacturer result:', result);

      if (result.isSuccess) {
        toast({
          title: "Success",
          description: "Custom manufacturer created successfully",
        });
        setFormData({ name: "", description: "" });
        setIsOpen(false);
        await onSuccess?.();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating custom manufacturer:', error);
      toast({
        title: "Error",
        description: "Failed to create custom manufacturer",
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
          <DialogTitle>Add Custom Manufacturer</DialogTitle>
          <DialogDescription>
            Create a new custom manufacturer for your collection items.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Manufacturer Name</Label>
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
              "Create Manufacturer"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 