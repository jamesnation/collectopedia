"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function DeleteUserData() {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteData = async () => {
    try {
      setIsDeleting(true);
      // This would be replaced with an actual API call
      console.log("Deleting user data...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("User data deleted successfully");
    } catch (error) {
      console.error("Error deleting user data:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
        This will permanently delete all your collection data, including items, custom types, franchises, and brands.
        This action cannot be undone.
      </p>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive" 
            className="flex items-center gap-2 dark:bg-red-500/80 dark:hover:bg-red-500 dark:text-white"
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete All Data"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="dark:bg-card dark:text-foreground dark:border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-foreground">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-muted-foreground">
              This action cannot be undone. This will permanently delete all your collection data
              and remove all records from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-card/50 dark:text-foreground dark:border-primary/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteData}
              className="dark:bg-red-500/80 dark:hover:bg-red-500 dark:text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 