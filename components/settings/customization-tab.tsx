"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomTypesList } from "@/components/settings/custom-types-list"
import { CustomFranchisesList } from "@/components/settings/custom-franchises-list"
import { CustomBrandsList } from "@/components/settings/custom-brands-list"

interface CustomizationTabProps {
  onSave?: () => void
}

export function CustomizationTab({ onSave }: CustomizationTabProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="types" className="w-full">
        <TabsList className="mb-4 dark:bg-background/30 dark:text-muted-foreground dark:border dark:border-border rounded-lg">
          <TabsTrigger 
            value="types" 
            className="dark:data-[state=active]:bg-card/50 dark:data-[state=active]:text-foreground hover:text-purple-400"
          >
            Types
          </TabsTrigger>
          <TabsTrigger 
            value="franchises" 
            className="dark:data-[state=active]:bg-card/50 dark:data-[state=active]:text-foreground hover:text-purple-400"
          >
            Franchises
          </TabsTrigger>
          <TabsTrigger 
            value="brands" 
            className="dark:data-[state=active]:bg-card/50 dark:data-[state=active]:text-foreground hover:text-purple-400"
          >
            Brands
          </TabsTrigger>
        </TabsList>
        <TabsContent value="types">
          <CustomTypesList />
        </TabsContent>
        <TabsContent value="franchises">
          <CustomFranchisesList />
        </TabsContent>
        <TabsContent value="brands">
          <CustomBrandsList />
        </TabsContent>
      </Tabs>
    </div>
  )
} 