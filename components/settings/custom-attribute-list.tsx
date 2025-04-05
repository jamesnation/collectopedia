"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, Loader2, AlertCircle } from "lucide-react";
import {
  getCustomAttributesAction,
  deleteCustomAttributeAction
} from "@/actions/custom-attribute-actions"; // Use new generic actions
import type { SelectCustomAttribute } from "@/db/schema"; // Use new schema type
import { CustomAttributeModal } from "@/components/custom-attribute-modal"; // Import the modal
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Define the possible attribute types
type AttributeType = 'brand' | 'franchise' | 'type';

// Props for the list component
interface CustomAttributeListProps {
  attributeType: AttributeType; // Determines which attributes to show
}

// Helper function to capitalize attribute type for UI text
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const pluralize = (s: string) => s.endsWith('s') ? s + 'es' : s + 's'; // Simple pluralization

export function CustomAttributeList({ attributeType }: CustomAttributeListProps) {
  const [attributes, setAttributes] = useState<SelectCustomAttribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAttribute, setSelectedAttribute] = useState<SelectCustomAttribute | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Store ID being deleted
  const { toast } = useToast();

  // Function to fetch attributes
  const fetchAttributes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getCustomAttributesAction(attributeType);
      if (result.isSuccess && result.data) {
        setAttributes(result.data);
      } else {
        throw new Error(result.error || `Failed to fetch ${pluralize(attributeType)}`);
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error Fetching Data",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [attributeType, toast]);

  // Fetch attributes on mount and when type changes
  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  // Handlers for modal actions
  const handleAdd = () => {
    setModalMode('create');
    setSelectedAttribute(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (attribute: SelectCustomAttribute) => {
    setModalMode('edit');
    setSelectedAttribute(attribute);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchAttributes(); // Re-fetch the list after successful create/update
  };

  // Handler for deleting an attribute
  const handleDelete = async (id: string) => {
    setIsDeleting(id); // Indicate which item is being deleted
    try {
      const payload = new FormData();
      payload.append("id", id);
      const result = await deleteCustomAttributeAction(payload);

      if (result.isSuccess) {
        toast({
          title: "Success",
          description: `${capitalize(attributeType)} deleted successfully`,
        });
        fetchAttributes(); // Refresh the list
      } else {
        throw new Error(result.error || `Failed to delete ${attributeType}`);
      }
    } catch (error: any) {
      console.error(`Error deleting ${attributeType}:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to delete ${attributeType}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null); // Reset deleting indicator
    }
  };

  // Dynamic UI text
  const title = `Manage Custom ${capitalize(pluralize(attributeType))}`;
  const description = `View, add, edit, or delete your custom ${pluralize(attributeType)}.`;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg font-medium">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleAdd} disabled={isLoading}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New {capitalize(attributeType)}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading {pluralize(attributeType)}...</span>
            </div>
          )}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-6 text-destructive">
              <AlertCircle className="h-6 w-6 mb-2" />
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchAttributes} className="mt-2">
                Retry
              </Button>
            </div>
          )}
          {!isLoading && !error && attributes.length === 0 && (
            <div className="text-center text-muted-foreground py-6">
              No custom {pluralize(attributeType)} found. Add one to get started!
            </div>
          )}
          {!isLoading && !error && attributes.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attributes.map((attr) => (
                  <TableRow key={attr.id}>
                    <TableCell className="font-medium">{attr.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {attr.description || "-"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(attr)}
                        disabled={isDeleting === attr.id}
                        aria-label={`Edit ${attr.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive/90"
                            disabled={isDeleting === attr.id}
                            aria-label={`Delete ${attr.name}`}
                          >
                            {isDeleting === attr.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the custom {attributeType} &quot;{attr.name}&quot;.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting === attr.id}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(attr.id)}
                              disabled={isDeleting === attr.id}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeleting === attr.id ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Render the reusable modal */}
      <CustomAttributeModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        attributeType={attributeType}
        initialData={selectedAttribute}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}
