"use client";

import { CustomTypesList } from "@/components/custom-types-list";
import { CustomFranchisesList } from "@/components/custom-franchises-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Tags, BookmarkIcon, Building2 } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="h-full flex-1 flex flex-col gap-4 p-4 md:gap-8 md:p-6 bg-white">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Settings</h1>
      </div>
      
      <Tabs defaultValue="customization" className="h-full space-y-6">
        <div className="space-y-4">
          <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-gray-100/80 p-1 text-muted-foreground w-full sm:w-auto">
            <TabsTrigger value="customization" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all hover:text-primary data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <Tags className="h-4 w-4" />
              Customization
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all hover:text-primary data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all hover:text-primary data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <BookmarkIcon className="h-4 w-4" />
              Collections
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="customization" className="h-full flex-1 space-y-6">
          <div className="grid gap-6">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Manage Types & Franchises</CardTitle>
                <CardDescription>
                  Customize the types and franchises for your collection items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="types" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="types">Types</TabsTrigger>
                    <TabsTrigger value="franchises">Franchises</TabsTrigger>
                  </TabsList>
                  <TabsContent value="types">
                    <CustomTypesList />
                  </TabsContent>
                  <TabsContent value="franchises">
                    <CustomFranchisesList />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="h-full flex-1 space-y-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Display Preferences
              </CardTitle>
              <CardDescription>
                Customize how your collection is displayed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Display preferences will be added in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collections" className="h-full flex-1 space-y-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookmarkIcon className="h-5 w-5" />
                Collection Management
              </CardTitle>
              <CardDescription>
                Manage your collection settings and organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Collection management features will be added in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 