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
        <h3 className="text-lg font-medium dark:text-white">Delete All My Data</h3>
        <p className="text-sm text-muted-foreground dark:text-gray-400">
          This will permanently delete all your collection items, custom types, brands, and franchises.
        </p>
      </div>
      
      <Button 
        variant="destructive" 
        onClick={handleOpenDialog}
        className="w-full sm:w-auto dark:bg-red-900/80 dark:hover:bg-red-900"
      >
        <AlertTriangle className="mr-2 h-4 w-4" />
        Delete My Data
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900/80 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <AlertTriangle className="h-5 w-5 text-destructive dark:text-red-400" />
              Delete All Your Data
            </DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              This action will permanently delete:
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <ul className="list-disc pl-5 space-y-2 text-sm dark:text-gray-300">
              <li>All your collection items</li>
              <li>All your custom types</li>
              <li>All your custom franchises</li>
              <li>All your custom brands</li>
            </ul>
            
            <div className="mt-4 space-y-2">
              <Label htmlFor="confirm-delete" className="text-sm font-medium dark:text-gray-300">
                Type <span className="font-bold">DELETE</span> to confirm
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                className="dark:bg-gray-800/50 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isDeleting}
              className="dark:bg-transparent dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteData}
              disabled={isDeleting || confirmText !== "DELETE"}
              className="dark:bg-red-900/80 dark:hover:bg-red-900"
            >
              {isDeleting ? "Deleting..." : "Delete All My Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 