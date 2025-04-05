"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomAttributeList } from "@/components/settings/custom-attribute-list"

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
          <CustomAttributeList attributeType="type" />
        </TabsContent>
        <TabsContent value="franchises">
          <CustomAttributeList attributeType="franchise" />
        </TabsContent>
        <TabsContent value="brands">
          <CustomAttributeList attributeType="brand" />
        </TabsContent>
      </Tabs>
    </div>
  )
} 