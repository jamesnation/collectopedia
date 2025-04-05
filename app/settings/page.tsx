"use client";

import { CSVImport, DeleteUserData } from "@/components/settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Tags, BookmarkIcon, Building2, AlertTriangle, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { CustomizationTab } from "@/components/settings/customization-tab";
import { PreferencesTab } from "@/components/settings/preferences-tab";
import { CollectionsTab } from "@/components/settings/collections-tab";

export default function SettingsPage() {
  const { toast } = useToast();
  const { userId } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can safely show the UI that depends on the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Avoid rendering theme-dependent UI until mounted
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Settings</h1>

      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 dark:bg-background/30 dark:text-muted-foreground dark:border dark:border-border rounded-lg">
          {/* Preferences Tab */}
          <TabsTrigger value="preferences" className="dark:data-[state=active]:bg-card/50 dark:data-[state=active]:text-foreground hover:text-purple-400">
            <Settings className="w-4 h-4 mr-2" /> Preferences
          </TabsTrigger>
          {/* Collections Tab */}
          <TabsTrigger value="collections" className="dark:data-[state=active]:bg-card/50 dark:data-[state=active]:text-foreground hover:text-purple-400">
            <BookmarkIcon className="w-4 h-4 mr-2" /> Collections
          </TabsTrigger>
          {/* Customization Tab */}
          <TabsTrigger value="customization" className="dark:data-[state=active]:bg-card/50 dark:data-[state=active]:text-foreground hover:text-purple-400">
            <Tags className="w-4 h-4 mr-2" /> Customization
          </TabsTrigger>
          {/* Danger Zone Tab */}
          <TabsTrigger value="dangerZone" className="dark:data-[state=active]:bg-destructive/20 dark:data-[state=active]:text-destructive hover:text-destructive">
            <AlertTriangle className="w-4 h-4 mr-2" /> Danger Zone
          </TabsTrigger>
        </TabsList>

        {/* Preferences Content */}
        <TabsContent value="preferences">
           <PreferencesTab />
        </TabsContent>

        {/* Collections Content */}
        <TabsContent value="collections">
           <CollectionsTab />
        </TabsContent>

        {/* Customization Content */}
        <TabsContent value="customization">
          <CustomizationTab /> 
        </TabsContent>

        {/* Danger Zone Content */}
        <TabsContent value="dangerZone">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription className="text-destructive/80">
                Warning: Actions performed here are irreversible.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DeleteUserData />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 