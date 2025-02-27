"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { deleteUserDataAction } from "@/actions/delete-user-data";

export function DeleteUserData() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setConfirmText("");
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setConfirmText("");
  };

  const handleDeleteData = async () => {
    if (confirmText !== "DELETE") {
      toast({
        title: "Confirmation Failed",
        description: "Please type DELETE to confirm",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteUserDataAction();

      if (result.isSuccess) {
        toast({
          title: "Data Deleted",
          description: "All your collection data has been successfully deleted",
        });
        handleCloseDialog();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete your data",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <h3 className="text-lg font-medium">Delete All My Data</h3>
        <p className="text-sm text-muted-foreground">
          This will permanently delete all your collection items, custom types, brands, and franchises.
        </p>
      </div>
      
      <Button 
        variant="destructive" 
        onClick={handleOpenDialog}
        className="w-full sm:w-auto"
      >
        <AlertTriangle className="mr-2 h-4 w-4" />
        Delete My Data
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete All Your Data
            </DialogTitle>
            <DialogDescription>
              This action will permanently delete:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>All items in your collection</li>
                <li>All custom types you&#39;ve created</li>
                <li>All custom brands you&#39;ve created</li>
                <li>All custom franchises you&#39;ve created</li>
              </ul>
              <p className="mt-2 font-semibold text-destructive">
                This action cannot be undone.
              </p>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-delete" className="text-destructive">
                Type DELETE to confirm
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="border-destructive"
              />
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteData}
              disabled={confirmText !== "DELETE" || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete All My Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 