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
import { useToast } from "@/components/ui/use-toast";
import { deleteUserDataAction } from "@/actions/delete-user-data";
import { useRouter } from "next/navigation";

export function DeleteUserData() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDeleteData = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteUserDataAction();
      
      if (result.isSuccess) {
        toast({
          title: "Data deleted successfully",
          description: "All your collection data has been permanently deleted.",
        });
        // Refresh the page to show empty state
        router.refresh();
      } else {
        throw new Error(result.error || "Failed to delete data");
      }
    } catch (error) {
      console.error("Error deleting user data:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete data. Please try again.",
        variant: "destructive",
      });
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
        <AlertDialogContent className="dark:bg-card dark:text-foreground dark:border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-foreground">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-muted-foreground">
              This action cannot be undone. This will permanently delete all your collection data
              and remove all records from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-card/50 dark:text-foreground dark:border-border">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteData}
              className="dark:bg-red-500/80 dark:hover:bg-red-500 dark:text-white"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 