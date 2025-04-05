// Added 2024-04-04: Reusable modal for creating/editing custom attributes.
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  // DialogTrigger, // Trigger will be handled by parent component
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import {
  createCustomAttributeAction,
  updateCustomAttributeAction
} from "@/actions/custom-attribute-actions"; // Use new generic actions
import { useToast } from "@/components/ui/use-toast";
import type { SelectCustomAttribute } from "@/db/schema"; // Use new schema type

// Define the possible attribute types
type AttributeType = 'brand' | 'franchise' | 'type';

// Define the props for the modal
interface CustomAttributeModalProps {
  isOpen: boolean; // Controlled by parent
  onOpenChange: (isOpen: boolean) => void; // Notify parent of close requests
  mode: 'create' | 'edit'; // Determines if creating or editing
  attributeType: AttributeType; // 'brand', 'franchise', or 'type'
  initialData?: SelectCustomAttribute; // Data needed for editing
  onSuccess?: () => void; // Callback on successful operation
}

// Helper function to capitalize attribute type for UI text
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function CustomAttributeModal({
  isOpen,
  onOpenChange,
  mode,
  attributeType,
  initialData,
  onSuccess
}: CustomAttributeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  // Effect to reset form when modal opens or initial data changes
  useEffect(() => {
    if (isOpen) {
      setValidationErrors({}); // Clear previous errors
      if (mode === 'edit' && initialData) {
        setFormData({
          name: initialData.name || "",
          description: initialData.description || "",
        });
      } else {
        // Reset for create mode
        setFormData({ name: "", description: "" });
      }
    }
  }, [isOpen, mode, initialData]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors({}); // Clear previous errors

    // Construct FormData based on mode
    const payload = new FormData();
    payload.append("name", formData.name);
    // Only append description if it's not empty, otherwise let backend handle default/null
    if (formData.description) {
       payload.append("description", formData.description);
    }

    let result;
    try {
      if (mode === 'create') {
        payload.append("attribute_type", attributeType);
        result = await createCustomAttributeAction(payload);
      } else if (mode === 'edit' && initialData?.id) {
        payload.append("id", initialData.id);
        result = await updateCustomAttributeAction(payload);
      } else {
        throw new Error("Invalid mode or missing initial data for edit.");
      }

      // Handle action result
      if (result.isSuccess) {
        toast({
          title: "Success",
          description: `Custom ${capitalize(attributeType)} ${mode === 'create' ? 'created' : 'updated'} successfully`,
        });
        onOpenChange(false); // Close modal on success
        await onSuccess?.(); // Trigger callback if provided
      } else {
         setValidationErrors(result.validationErrors || {});
         throw new Error(result.error || "An unknown error occurred.");
      }
    } catch (error: any) {
       console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} custom ${attributeType}:`, error);
       toast({
         title: "Error",
         description: error.message || `Failed to ${mode} custom ${attributeType}`,
         variant: "destructive",
       });
       // Keep modal open if validation errors occurred
        if (!validationErrors || Object.keys(validationErrors).length === 0) {
            onOpenChange(false); // Close modal only if it's not a validation error shown inline
        }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic UI text based on mode and type
  const actionText = mode === 'create' ? 'Create' : 'Update';
  const titleText = `${actionText} Custom ${capitalize(attributeType)}`;
  const descriptionText = `${actionText} a custom ${attributeType} for your collection items.`;
  const buttonText = `${actionText} ${capitalize(attributeType)}`;

  return (
    // Dialog component is controlled externally via isOpen/onOpenChange props
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* DialogTrigger is removed - parent component will trigger opening */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titleText}</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>
        {/* Display general validation errors if they exist */}
         {validationErrors._errors && (
             <div className="text-red-500 text-sm mt-2">
                 {validationErrors._errors.join(', ')}
             </div>
         )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              aria-invalid={!!validationErrors?.name}
              aria-describedby={validationErrors?.name ? "name-error" : undefined}
            />
             {validationErrors?.name && (
                 <p id="name-error" className="text-red-500 text-sm">{validationErrors.name.join(', ')}</p>
             )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              aria-invalid={!!validationErrors?.description}
               aria-describedby={validationErrors?.description ? "description-error" : undefined}
            />
             {validationErrors?.description && (
                 <p id="description-error" className="text-red-500 text-sm">{validationErrors.description.join(', ')}</p>
             )}
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {actionText}ing...
              </>
            ) : (
              buttonText
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
