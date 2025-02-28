"use client";

import { CustomTypesList } from "@/components/custom-types-list";
import { CustomFranchisesList } from "@/components/custom-franchises-list";
import { CustomBrandsList } from "@/components/custom-brands-list";
import { CSVImport, DeleteUserData } from "@/components/settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Tags, BookmarkIcon, Building2, AlertTriangle, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { createCustomTypeAction, getCustomTypesAction } from '@/actions/custom-types-actions';
import { createCustomFranchiseAction, getCustomFranchisesAction } from '@/actions/custom-franchises-actions';
import { createCustomBrandAction, getCustomBrandsAction } from '@/actions/custom-brands-actions';
import { createItemAction } from '@/actions/items-actions';
import { useToast } from "@/components/ui/use-toast";
import { itemTypeEnum, franchiseEnum } from '@/db/schema/items-schema';
import { DEFAULT_BRANDS } from '@/components/catalog/utils/schema-adapter';
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { CustomizationTab } from "@/components/settings/customization-tab";
import { PreferencesTab } from "@/components/settings/preferences-tab";
import { CollectionsTab } from "@/components/settings/collections-tab";

// Custom UUID generation function that works in browser
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { userId } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [customTypes, setCustomTypes] = useState<{ id: string; name: string }[]>([]);
  const [customFranchises, setCustomFranchises] = useState<{ id: string; name: string }[]>([]);
  const [customBrands, setCustomBrands] = useState<{ id: string; name: string }[]>([]);

  // After mounting, we can safely show the UI that depends on the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Function to toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Function to test item creation with hardcoded data
  const testItemCreation = async () => {
    if (!userId) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to test item creation",
        variant: "destructive",
      });
      return;
    }
    
    // Create a test item with hardcoded values matching our template
    const testItem = {
      id: generateUUID(), // Use our custom UUID generator instead of crypto.randomUUID
      userId: userId,
      name: "Test Item Created Manually",
      type: "Action Figures",
      franchise: "Transformers",
      brand: "Tomy",
      year: 1987,
      condition: "Used - complete" as "New" | "Used - complete" | "Used - item only",
      acquired: new Date('2024-01-01'),
      cost: 100,
      value: 150,
      notes: "Test item description",
      isSold: false,
      soldDate: undefined,
      soldPrice: undefined,
      ebayListed: undefined,
      ebaySold: undefined,
      image: undefined,
      images: []
    };
    
    console.log("TEST DEBUG - Creating test item with hardcoded values:", {
      ...testItem,
      userId: "present", // Don't log actual userId
      acquired: testItem.acquired.toISOString(),
    });
    
    try {
      const result = await createItemAction(testItem);
      
      if (result.isSuccess) {
        console.log("TEST DEBUG - Test item creation succeeded:", result.data);
        toast({
          title: "Test Successful",
          description: "Test item was created successfully",
        });
      } else {
        console.error("TEST DEBUG - Test item creation failed:", result.error);
        toast({
          title: "Test Failed",
          description: result.error || "Failed to create test item",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("TEST DEBUG - Exception during test item creation:", error);
      toast({
        title: "Test Error",
        description: error instanceof Error ? error.message : "Unknown error creating test item",
        variant: "destructive",
      });
    }
  };

  // Load custom types, franchises, and brands on mount
  useEffect(() => {
    const loadCustomEntities = async () => {
      await Promise.all([
        loadCustomTypes(),
        loadCustomFranchises(),
        loadCustomBrands()
      ]);
    };
    loadCustomEntities();
  }, []);

  const loadCustomTypes = async () => {
    const result = await getCustomTypesAction();
    if (result.isSuccess && result.data) {
      setCustomTypes(result.data);
    }
    return result;
  };

  const loadCustomFranchises = async () => {
    const result = await getCustomFranchisesAction();
    if (result.isSuccess && result.data) {
      setCustomFranchises(result.data);
    }
    return result;
  };

  const loadCustomBrands = async () => {
    const result = await getCustomBrandsAction();
    if (result.isSuccess && result.data) {
      setCustomBrands(result.data);
    }
    return result;
  };

  const handleCreateCustomType = async (name: string) => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      const result = await createCustomTypeAction(formData);
      return result.isSuccess;
    } catch (error) {
      console.error("Error creating custom type:", error);
      return false;
    }
  };

  const handleCreateCustomFranchise = async (name: string) => {
    try {
      const result = await createCustomFranchiseAction({ name });
      return result.isSuccess;
    } catch (error) {
      console.error("Error creating custom franchise:", error);
      return false;
    }
  };

  const handleCreateCustomBrand = async (name: string) => {
    try {
      const result = await createCustomBrandAction({ name });
      return result.isSuccess;
    } catch (error) {
      console.error("Error creating custom brand:", error);
      return false;
    }
  };

  const handleAddItem = async (item: any) => {
    try {
      if (!userId) {
        console.error("Authentication error: No userId available");
        toast({
          title: "Authentication Error",
          description: "You must be logged in to add items",
          variant: "destructive",
        });
        return false;
      }

      // Log the exact incoming item before any modifications
      console.log("IMPORT DEBUG - Original item from CSV:", JSON.stringify(item, (key, value) => {
        if (value instanceof Date) return `Date(${value.toISOString()})`;
        return value;
      }, 2));

      // Generate a random ID for the new item
      const itemWithId = {
        id: generateUUID(), // Use our custom UUID generator instead of crypto.randomUUID
        userId, // Set the userId from auth
        ...item
      };
      
      // Log the exact item being sent to createItemAction with detailed type information
      console.log("IMPORT DEBUG - Item being sent to createItemAction:", {
        id: itemWithId.id,
        userId: itemWithId.userId ? "present" : "missing", // Don't log the actual userId
        name: itemWithId.name + ` (${typeof itemWithId.name})`,
        type: itemWithId.type + ` (${typeof itemWithId.type})`,
        franchise: itemWithId.franchise + ` (${typeof itemWithId.franchise})`,
        brand: (itemWithId.brand || "null") + ` (${typeof itemWithId.brand})`,
        year: itemWithId.year + ` (${typeof itemWithId.year})`,
        condition: itemWithId.condition + ` (${typeof itemWithId.condition})`,
        acquired: itemWithId.acquired instanceof Date 
          ? `Date(${itemWithId.acquired.toISOString()})` 
          : `${itemWithId.acquired} (${typeof itemWithId.acquired})`,
        cost: itemWithId.cost + ` (${typeof itemWithId.cost})`,
        value: itemWithId.value + ` (${typeof itemWithId.value})`,
        notes: (itemWithId.notes || "null") + ` (${typeof itemWithId.notes})`,
        isSold: itemWithId.isSold + ` (${typeof itemWithId.isSold})`,
        soldDate: itemWithId.soldDate instanceof Date 
          ? `Date(${itemWithId.soldDate.toISOString()})` 
          : `${itemWithId.soldDate} (${typeof itemWithId.soldDate})`,
        soldPrice: (itemWithId.soldPrice || "null") + ` (${typeof itemWithId.soldPrice})`,
        ebayListed: (itemWithId.ebayListed || "null") + ` (${typeof itemWithId.ebayListed})`,
        ebaySold: (itemWithId.ebaySold || "null") + ` (${typeof itemWithId.ebaySold})`,
        image: (itemWithId.image || "null") + ` (${typeof itemWithId.image})`,
        images: Array.isArray(itemWithId.images) ? `Array(${itemWithId.images.length})` : `${itemWithId.images} (${typeof itemWithId.images})`
      });
      
      const result = await createItemAction(itemWithId);
      
      if (!result.isSuccess) {
        console.error("IMPORT DEBUG - Failed to create item:", result.error);
        toast({
          title: "Error",
          description: result.error || "Failed to save item to database",
          variant: "destructive",
        });
        return false;
      }
      
      console.log("IMPORT DEBUG - Item created successfully:", result.data);
      toast({
        title: "Success",
        description: "Item added successfully",
      });
      
      return result.isSuccess;
    } catch (error) {
      console.error("IMPORT DEBUG - Exception caught:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save item to database",
        variant: "destructive",
      });
      return false;
    }
  };

  if (!mounted) {
    return null; // Avoid rendering theme-dependent UI until mounted
  }

  return (
    <div className="min-h-screen flex-1 flex flex-col gap-4 p-4 md:gap-8 md:p-6 
      bg-white dark:bg-black/30 dark:text-foreground transition-colors duration-200">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl dark:text-foreground">Settings</h1>
        <Button
          variant="outline" 
          size="icon"
          onClick={toggleTheme}
          className="rounded-full w-10 h-10 dark:bg-card/50 dark:text-foreground dark:border-border dark:hover:bg-card/80 dark:hover:border-primary/40"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-purple-400" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      <Tabs defaultValue="customization" className="flex-1 h-full">
        <div className="flex justify-start mb-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md bg-muted dark:bg-background/30 rounded-lg p-1">
            <TabsTrigger value="customization" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all hover:text-purple-400 data-[state=active]:bg-white dark:data-[state=active]:bg-card/50 data-[state=active]:text-foreground dark:data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <Tags className="h-4 w-4" />
              Customization
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all hover:text-purple-400 data-[state=active]:bg-white dark:data-[state=active]:bg-card/50 data-[state=active]:text-foreground dark:data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all hover:text-purple-400 data-[state=active]:bg-white dark:data-[state=active]:bg-card/50 data-[state=active]:text-foreground dark:data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <BookmarkIcon className="h-4 w-4" />
              Collections
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="customization" className="h-full flex-1">
          <div className="rounded-lg border dark:border-border bg-card/50 dark:bg-card/60 p-6 shadow-sm">
            <div className="flex flex-col space-y-8">
              <div className="space-y-2">
                <h1 className="text-xl font-semibold">Customization</h1>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Manage your custom content types, franchises, and brands.
                </p>
              </div>
              <CustomizationTab
                onSave={() => {
                  //toast({
                  //  title: "Success",
                  //  description: "Your preferences have been saved successfully.",
                  //})
                }}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="h-full flex-1">
          <div className="rounded-lg border dark:border-border bg-card/50 dark:bg-card/60 p-6 shadow-sm">
            <div className="flex flex-col space-y-8">
              <div className="space-y-2">
                <h1 className="text-xl font-semibold">Preferences</h1>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Manage your account and application preferences.
                </p>
              </div>
              <PreferencesTab />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="collections" className="h-full flex-1">
          <div className="rounded-lg border dark:border-border bg-card/50 dark:bg-card/60 p-6 shadow-sm">
            <div className="flex flex-col space-y-8">
              <div className="space-y-2">
                <h1 className="text-xl font-semibold">Collections</h1>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Manage your collections and sub-collections.
                </p>
              </div>
              <CollectionsTab />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 